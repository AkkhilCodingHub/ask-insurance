import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { createPaymentLink } from '../lib/razorpay';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            type: true,
            provider: true,
          }
        }
      }
    });

    res.json({ payments });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// POST /api/payments/razorpay/create-link  — generates a Razorpay Payment Link for a pending policy
router.post('/razorpay/create-link', authenticate, async (req, res) => {
  try {
    const { policyId } = z.object({ policyId: z.string() }).parse(req.body);
    const userId = req.userId!;

    const policy = await prisma.policy.findFirst({
      where: { id: policyId, userId, paymentStatus: 'pending' },
      include: { user: { select: { name: true, phone: true } } }
    });
    if (!policy) { res.status(404).json({ error: 'Policy not found or already paid' }); return; }

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
    console.error(e);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// POST /api/payments/razorpay/webhook — Razorpay calls this on payment.captured
router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
    if (secret) {
      const sig = req.headers['x-razorpay-signature'] as string;
      const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
      if (sig !== expected) { res.status(400).json({ error: 'Invalid signature' }); return; }
    }

    const event = JSON.parse(req.body.toString());
    if (event.event === 'payment_link.paid') {
      const policyId = event.payload?.payment_link?.entity?.notes?.policyId as string;
      const paymentId = event.payload?.payment?.entity?.id as string;
      if (policyId) {
        const policy = await prisma.policy.findUnique({ where: { id: policyId } });
        if (policy && policy.paymentStatus !== 'paid') {
          await prisma.$transaction(async (tx) => {
            await tx.policy.update({
              where: { id: policyId },
              data: { status: 'active', paymentStatus: 'paid' }
            });
            await tx.payment.create({
              data: {
                amount: policy.premium, currency: 'INR',
                status: 'success', provider: 'razorpay',
                providerRef: paymentId,
                policyId, userId: policy.userId
              }
            });
            await tx.notification.create({
              data: {
                userId: policy.userId,
                type: 'general',
                title: 'Payment Successful!',
                body: 'Your premium payment was received. Your policy is now active.'
              }
            });
          });
        }
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Webhook error' });
  }
});

export { router as paymentsRouter };
