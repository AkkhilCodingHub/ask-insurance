import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireKyc } from '../middleware/auth';
import { createPaymentLink } from '../lib/razorpay';
import { sendPush } from '../lib/push';
import { calculateAndApplyBrokerage } from '../lib/brokerage';

const router = Router();

// List user payments
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        policy: {
          select: { id: true, policyNumber: true, type: true, provider: true }
        }
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error('[payments] list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Razorpay payment link for a pending policy or quote
router.post('/razorpay/create-link', authenticate, requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const body = z.object({
      policyId: z.string().optional(),
      quoteId:  z.string().optional(),
    }).refine(d => d.policyId || d.quoteId, {
      message: 'Either policyId or quoteId is required',
    }).parse(req.body);

    let policy;

    if (body.policyId) {
      policy = await prisma.policy.findFirst({
        where: { id: body.policyId, userId, paymentStatus: 'pending' },
        include: { user: { select: { name: true, phone: true } } }
      });
    } else {
      policy = await prisma.policy.findFirst({
        where: { quoteId: body.quoteId!, userId, paymentStatus: 'pending' },
        include: { user: { select: { name: true, phone: true } } }
      });

      if (!policy && body.quoteId) {
        const quote = await prisma.quote.findFirst({
          where: { id: body.quoteId, userId },
          include: { user: { select: { name: true, phone: true } } }
        });

        if (quote && quote.adminResponse) {
          let ar: { insurer: string; planName: string; netPremium: number; gst: number; totalPremium: number; notes?: string };
          try { ar = JSON.parse(quote.adminResponse as string); } catch { ar = { insurer: 'ASK Insurance', planName: 'Policy', netPremium: 0, gst: 0, totalPremium: 0 }; }
          let details: Record<string, unknown> = {};
          try { details = JSON.parse(quote.details as string); } catch {}

          const now = new Date();
          policy = await prisma.policy.create({
            data: {
              policyNumber: `APP${Date.now()}`,
              type: quote.type,
              provider: ar.insurer,
              sumInsured: (details.sumInsured as number) ?? 0,
              premium: ar.totalPremium,
              startDate: now,
              endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
              status: 'pending',
              paymentStatus: 'pending',
              notes: ar.notes ?? null,
              userId: quote.userId,
              quoteId: quote.id,
            },
            include: { user: { select: { name: true, phone: true } } }
          });
        }
      }
    }

    if (!policy) {
      // Check if policy was already paid
      const paidPolicy = await prisma.policy.findFirst({
        where: { quoteId: body.quoteId!, userId, paymentStatus: 'paid' }
      });
      if (paidPolicy) {
        res.json({ paymentCompleted: true, paymentLinkId: null, paymentUrl: null, amount: paidPolicy.premium });
        return;
      }
      res.status(404).json({ error: 'Policy not found or payment link unavailable' });
      return;
    }

    const link = await createPaymentLink({
      amount:        policy.premium,
      policyId:      policy.id,
      policyNumber:  policy.policyNumber,
      customerName:  policy.user?.name ?? 'Customer',
      customerPhone: policy.user?.phone ?? '',
      description:   `${policy.type} Insurance Premium — ${policy.provider}`,
    });

    res.json({ paymentLinkId: link.id, paymentUrl: link.short_url, amount: policy.premium });
  } catch (e) {
    console.error('[razorpay] create-link error:', e);
    const msg = e instanceof Error ? e.message : 'Failed to create payment link';
    res.status(500).json({ error: msg, details: e });
  }
});

// Razorpay webhook handler
router.post('/razorpay/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

    // Verify webhook signature if secret configured
    if (secret) {
      const sig = req.headers['x-razorpay-signature'] as string;
      if (!sig) {
        res.status(400).json({ error: 'Missing signature' });
        return;
      }
      const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
      if (sig !== expected) {
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }
    }

    const rawStr = req.body.toString();
    const event = JSON.parse(rawStr);

    const isPaid =
      event.event === 'payment_link.paid' ||
      event.event === 'payment.captured';

    if (isPaid) {
      const policyId: string | undefined =
        event.payload?.payment_link?.entity?.notes?.policyId ??
        event.payload?.payment?.entity?.notes?.policyId;

      const paymentId: string | undefined =
        event.payload?.payment?.entity?.id ??
        event.payload?.payment_link?.entity?.id;

      const amountPaise: number | undefined =
        event.payload?.payment?.entity?.amount;

      console.log(`[razorpay webhook] policyId   : ${policyId ?? 'NOT FOUND IN NOTES'}`);
      console.log(`[razorpay webhook] paymentId  : ${paymentId ?? 'n/a'}`);
      console.log(`[razorpay webhook] amountPaise: ${amountPaise ?? 'n/a'} (₹${amountPaise ? amountPaise / 100 : 'n/a'})`);
      console.log(`[razorpay webhook] notes (payment_link): ${JSON.stringify(event.payload?.payment_link?.entity?.notes)}`);
      console.log(`[razorpay webhook] notes (payment)     : ${JSON.stringify(event.payload?.payment?.entity?.notes)}`);

      if (!policyId) {
        console.warn('[razorpay webhook] SKIPPED — policyId missing from notes');
        res.json({ ok: true });
        return;
      }

      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { user: { select: { pushToken: true } } }
      });

      console.log(`[razorpay webhook] policy found: ${policy ? `YES (status=${policy.status}, paymentStatus=${policy.paymentStatus})` : 'NO'}`);

      if (!policy) {
        console.warn(`[razorpay webhook] SKIPPED — policy ${policyId} not found in DB`);
        res.json({ ok: true });
        return;
      }

      if (policy.paymentStatus === 'paid') {
        console.log(`[razorpay webhook] SKIPPED — policy ${policyId} already paid (idempotency)`);
        res.json({ ok: true });
        return;
      }

      // ── Transaction ───────────────────────────────────────────────────────
      console.log(`[razorpay webhook] running activation transaction for policy ${policyId}…`);
      await prisma.$transaction(async (tx) => {
        await tx.policy.update({
          where: { id: policyId },
          data:  { status: 'active', paymentStatus: 'paid' }
        });
        console.log(`[razorpay webhook]   ✓ policy activated`);

        await tx.payment.create({
          data: {
            amount:      amountPaise ? amountPaise / 100 : policy.premium,
            currency:    'INR',
            status:      'success',
            provider:    'razorpay',
            providerRef: paymentId ?? null,
            policyId,
            userId: policy.userId,
          }
        });
        console.log(`[razorpay webhook]   ✓ payment record created`);

        if (policy.quoteId) {
          await tx.quote.update({
            where: { id: policy.quoteId },
            data:  { status: 'converted' }
          }).catch((e) => console.warn(`[razorpay webhook]   ⚠ quote update failed (non-fatal):`, e));
          console.log(`[razorpay webhook]   ✓ quote marked converted`);
        }

        await tx.notification.create({
          data: {
            userId: policy.userId,
            type:   'general',
            title:  'Payment Successful! 🎉',
            body:   `Your ${policy.type} insurance premium has been received. Your policy is now active.`,
          }
        });
        console.log(`[razorpay webhook]   ✓ in-app notification created`);

        // Calculate and record brokerage for the policy
        await calculateAndApplyBrokerage(tx, policyId);
      });

      console.log(`[razorpay webhook] policy ${policyId} fully activated ✓`);

      // ── Push notification ─────────────────────────────────────────────────
      const pushToken = policy.user?.pushToken;
      console.log(`[razorpay webhook] push token: ${pushToken ? '***present***' : 'NOT SET — skipping push'}`);
      await sendPush(
        pushToken,
        'Payment Successful! 🎉',
        `Your ${policy.type} insurance policy is now active. Check My Policies.`,
        { screen: 'my-policies' }
      );
      console.log(`[razorpay webhook] push notification sent`);
    }

    console.log(`[razorpay webhook] done — responding 200`);
    console.log(`${'─'.repeat(60)}\n`);
    res.json({ ok: true });
  } catch (e) {
    console.error('[razorpay webhook] error:', e);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
// GET Razorpay callback route
router.get('/razorpay/callback', async (req: Request, res: Response): Promise<void> => {
  res.redirect('askinsurance://payment-success');
});
// ── Test Mode Verification Endpoint (Instant Activation) ─────────────────────
router.post('/verify-test-payment', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { quoteId, policyId } = z.object({
      quoteId:  z.string().optional(),
      policyId: z.string().optional(),
    }).parse(req.body);

    let policy = await prisma.policy.findFirst({
      where: {
        userId,
        OR: [
          ...(policyId ? [{ id: policyId }] : []),
          ...(quoteId ? [{ quoteId }] : []),
        ]
      }
    });

    if (!policy && quoteId) {
      const quote = await prisma.quote.findFirst({ where: { id: quoteId, userId } });
      if (quote && quote.adminResponse) {
        let ar: { insurer: string; totalPremium: number; notes?: string } = { insurer: 'ASK Insurance', totalPremium: 0 };
        try { ar = JSON.parse(quote.adminResponse as string); } catch {}
        let details: Record<string, unknown> = {};
        try { details = JSON.parse(quote.details as string); } catch {}
        const now = new Date();
        policy = await prisma.policy.create({
          data: {
            policyNumber: `APP${Date.now()}`,
            type: quote.type,
            provider: ar.insurer,
            sumInsured: (details.sumInsured as number) ?? 0,
            premium: ar.totalPremium,
            startDate: now,
            endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            status: 'pending',
            paymentStatus: 'pending',
            notes: ar.notes ?? null,
            userId,
            quoteId: quote.id,
          }
        });
      }
    }

    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    if (policy.paymentStatus !== 'paid') {
      const targetPolicyId = policy.id;
      await prisma.$transaction(async (tx) => {
        await tx.policy.update({
          where: { id: targetPolicyId },
          data:  { status: 'active', paymentStatus: 'paid' }
        });
        await tx.payment.create({
          data: {
            amount:      policy!.premium,
            currency:    'INR',
            status:      'success',
            provider:    'razorpay_test',
            providerRef: `test_${Date.now()}`,
            policyId:    targetPolicyId,
            userId,
          }
        });
        if (policy!.quoteId) {
          await tx.quote.update({
            where: { id: policy!.quoteId },
            data:  { status: 'converted' }
          }).catch(() => {});
        }
        await tx.notification.create({
          data: {
            userId,
            type:   'general',
            title:  'Payment Successful! 🎉',
            body:   `Your ${policy!.type} insurance policy is now active.`,
          }
        }).catch(() => {});
        await calculateAndApplyBrokerage(tx, targetPolicyId).catch(() => {});
      });
    }

    res.json({ success: true, message: 'Policy activated successfully' });
  } catch (e) {
    console.error('[payments/verify-test-payment] error:', e);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export { router as paymentsRouter };
