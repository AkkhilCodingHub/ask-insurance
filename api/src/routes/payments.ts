import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireKyc } from '../middleware/auth';
import { createPaymentLink } from '../lib/razorpay';
import { sendPush } from '../lib/push';
import { calculateAndApplyBrokerage } from '../lib/brokerage';
import { sanitizeLog } from '../lib/sanitize';

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

      console.log(`[razorpay webhook] policyId   : ${sanitizeLog(policyId ?? 'NOT FOUND IN NOTES')}`);
      console.log(`[razorpay webhook] paymentId  : ${sanitizeLog(paymentId ?? 'n/a')}`);
      console.log(`[razorpay webhook] amountPaise: ${sanitizeLog(amountPaise ?? 'n/a')} (₹${amountPaise ? Number(amountPaise) / 100 : 'n/a'})`);
      console.log(`[razorpay webhook] notes (payment_link): ${sanitizeLog(JSON.stringify(event.payload?.payment_link?.entity?.notes))}`);
      console.log(`[razorpay webhook] notes (payment)     : ${sanitizeLog(JSON.stringify(event.payload?.payment?.entity?.notes))}`);

      if (!policyId) {
        console.warn('[razorpay webhook] SKIPPED — policyId missing from notes');
        res.json({ ok: true });
        return;
      }

      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { user: { select: { pushToken: true } } }
      });

      console.log(`[razorpay webhook] policy found: ${policy ? `YES (status=${sanitizeLog(policy.status)}, paymentStatus=${sanitizeLog(policy.paymentStatus)})` : 'NO'}`);

      if (!policy) {
        console.warn(`[razorpay webhook] SKIPPED — policy ${sanitizeLog(policyId)} not found in DB`);
        console.warn('[razorpay webhook] SKIPPED — policy not found in DB');
        res.json({ ok: true });
        return;
      }

      if (policy.paymentStatus === 'paid') {
        console.log(`[razorpay webhook] SKIPPED — policy ${sanitizeLog(policyId)} already paid (idempotency)`);
        console.log('[razorpay webhook] SKIPPED — policy already paid (idempotency)');
        res.json({ ok: true });
        return;
      }

      // ── Transaction ───────────────────────────────────────────────────────
      console.log(`[razorpay webhook] running activation transaction for policy ${sanitizeLog(policyId)}…`);
      console.log('[razorpay webhook] running activation transaction');
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
          }).catch(() => {});
        }

        await tx.notification.create({
          data: {
            userId: policy.userId,
            type:   'general',
            title:  'Payment Successful! 🎉',
            body:   `Your ${policy.type} insurance premium has been received. Your policy is now active.`,
          }
        });

        // Calculate and record brokerage for the policy
        await calculateAndApplyBrokerage(tx, policyId);
      });

      // ── Push notification ─────────────────────────────────────────────────
      const pushToken = policy.user?.pushToken;
      await sendPush(
        pushToken,
        'Payment Successful! 🎉',
        `Your ${policy.type} insurance policy is now active. Check My Policies.`,
        { screen: 'my-policies' }
      );
    }

    console.log('[razorpay webhook] done — responding 200');
    console.log(`${'─'.repeat(60)}\n`);
    res.json({ ok: true });
  } catch (e) {
    console.error('[razorpay webhook] error:', e);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
// ── Branded First-Party ASK Insurance Brokers Checkout Page ─────────────────
router.get('/checkout/:policyId', async (req: Request, res: Response): Promise<void> => {
  try {
    const policyId = String(req.params.policyId || '');
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      res.status(404).send('<h2>Policy not found</h2>');
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: policy.userId } });

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_SPxF487RfB0Pfu';
    const amountInRupees = policy.premium;
    const amountInPaise = Math.round(policy.premium * 100);
    const proposerName = user?.name || 'Akkhil Sharma';
    const phone = user?.phone || '7497007881';
    const email = user?.email || 'akkhil@askinsurance.in';
    const insurer = policy.provider || 'Bajaj Allianz General Insurance';
    const policyType = (policy.type || 'Insurance').toUpperCase();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ASK Insurance Brokers — Secure Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #0F172A; color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { background: #1E293B; border: 1px solid #334155; border-radius: 20px; max-width: 440px; width: 100%; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); text-align: center; }
    .brand-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(15,82,186,0.15); border: 1px solid rgba(15,82,186,0.4); color: #60A5FA; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #94A3B8; margin-bottom: 24px; }
    .summary-box { background: #0F172A; border: 1px solid #334155; border-radius: 14px; padding: 16px; text-align: left; margin-bottom: 24px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; }
    .summary-row:last-child { margin-bottom: 0; padding-top: 10px; border-top: 1px dashed #334155; }
    .label { color: #94A3B8; }
    .val { color: #F8FAFC; font-weight: 600; text-align: right; }
    .total-val { color: #10B981; font-weight: 800; font-size: 17px; }
    .btn-pay { width: 100%; background: #0F52BA; color: #FFFFFF; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(15,82,186,0.4); }
    .btn-pay:active { transform: scale(0.98); opacity: 0.9; }
    .guarantee { font-size: 12px; color: #64748B; margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-badge">
      🛡️ ASK Insurance Brokers
    </div>
    <h1>Direct Broker Checkout</h1>
    <p class="subtitle">IRDAI Reg: 102/2024 · Direct Insurance Broker</p>

    <div class="summary-box">
      <div class="summary-row">
        <span class="label">Policy Schedule:</span>
        <span class="val">${policy.policyNumber}</span>
      </div>
      <div class="summary-row">
        <span class="label">Coverage Type:</span>
        <span class="val">${policyType}</span>
      </div>
      <div class="summary-row">
        <span class="label">Underwriter Insurer:</span>
        <span class="val">${insurer}</span>
      </div>
      <div class="summary-row">
        <span class="label">Proposer:</span>
        <span class="val">${proposerName}</span>
      </div>
      <div class="summary-row">
        <span class="label">Total Premium (incl. GST):</span>
        <span class="val total-val">₹${amountInRupees.toLocaleString('en-IN')}</span>
      </div>
    </div>

    <button id="pay-btn" class="btn-pay" onclick="launchRazorpay()">
      <span>🔒 Pay ₹${amountInRupees.toLocaleString('en-IN')} via Razorpay</span>
    </button>

    <div class="guarantee">
      🔒 256-Bit SSL Encrypted · Official Razorpay Gateway
    </div>
  </div>

  <script>
    function launchRazorpay() {
      var options = {
        key: "${keyId}",
        amount: "${amountInPaise}",
        currency: "INR",
        name: "ASK Insurance Brokers",
        description: "${policyType} Insurance — ${insurer}",
        image: "https://ask-api.bitopayments.com/logo.png",
        prefill: {
          name: "${proposerName}",
          email: "${email}",
          contact: "${phone}"
        },
        theme: {
          color: "#0F52BA"
        },
        handler: function (response) {
          window.location.href = '/api/payments/razorpay/callback?policyId=${policy.id}&paymentId=' + (response.razorpay_payment_id || 'test');
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
          }
        }
      };
      var rzp = new Razorpay(options);
      rzp.open();
    }

    // Auto launch on load
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(launchRazorpay, 300);
    });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('[checkout error]:', err);
    res.status(500).send('<h2>Internal Checkout Error</h2>');
  }
});

// GET Razorpay callback route
router.get('/razorpay/callback', async (req: Request, res: Response): Promise<void> => {
  const { policyId, paymentId } = req.query;
  if (policyId) {
    try {
      const pid = String(policyId);
      const policy = await prisma.policy.findUnique({ where: { id: pid } });
      if (policy && policy.paymentStatus !== 'paid') {
        await prisma.$transaction(async (tx) => {
          await tx.policy.update({
            where: { id: pid },
            data: { status: 'active', paymentStatus: 'paid' },
          });
          await tx.payment.create({
            data: {
              amount: policy.premium,
              currency: 'INR',
              status: 'success',
              provider: 'razorpay',
              providerRef: String(paymentId || `pay_${Date.now()}`),
              policyId: pid,
              userId: policy.userId,
            },
          });
          await tx.notification.create({
            data: {
              userId: policy.userId,
              type: 'general',
              title: 'Policy Activated! 🎉',
              body: `Your ${policy.type} policy (${policy.policyNumber}) from ASK Insurance Brokers is now active.`,
            },
          }).catch(() => {});
          await calculateAndApplyBrokerage(tx, pid).catch(() => {});
        });
      }
    } catch (e) {
      console.error('[razorpay callback activation error]:', e);
    }
  }
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
