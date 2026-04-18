import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminQuoteResponse = {
  insurer:      string;
  planName:     string;
  netPremium:   number;
  gst:          number;
  totalPremium: number;
  notes?:       string;
};

// ── GET / — user's quote requests ─────────────────────────────────────────────
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const quotes = await prisma.quote.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    20,
    });

    res.json({
      quotes: quotes.map(q => ({
        id:             q.id,
        type:           q.type,
        details:        JSON.parse(q.details),
        status:         q.status,
        adminResponse:  q.adminResponse ? JSON.parse(q.adminResponse) as AdminQuoteResponse : null,
        adminResponseAt:q.adminResponseAt,
        approvedAt:     q.approvedAt,
        expiresAt:      q.expiresAt,
        createdAt:      q.createdAt,
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST / — submit a quote request (lead) ────────────────────────────────────
const createQuoteSchema = z.object({
  type:    z.string().min(1),
  details: z.record(z.any()),   // age, gender, sumInsured, smoker, planId, planName, etc.
});

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { type, details } = createQuoteSchema.parse(req.body);

    const quote = await prisma.quote.create({
      data: {
        type,
        details:   JSON.stringify(details),
        providers: '[]',  // unused in new flow
        status:    'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        userId,
      }
    });

    res.status(201).json({
      quote: {
        id:        quote.id,
        type:      quote.type,
        status:    quote.status,
        createdAt: quote.createdAt,
        message:   'Quote request submitted. Our advisor will contact you with the best quote within 24 hours.',
      }
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /:id — single quote request ───────────────────────────────────────────
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    const quote = await prisma.quote.findFirst({ where: { id, userId } });
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return; }

    res.json({
      quote: {
        id:             quote.id,
        type:           quote.type,
        details:        JSON.parse(quote.details),
        status:         quote.status,
        adminResponse:  quote.adminResponse ? JSON.parse(quote.adminResponse) as AdminQuoteResponse : null,
        adminResponseAt:quote.adminResponseAt,
        approvedAt:     quote.approvedAt,
        expiresAt:      quote.expiresAt,
        createdAt:      quote.createdAt,
      }
    });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'Invalid quote id' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /:id/approve — user approves admin's quote, creates pending policy ───
router.post('/:id/approve', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    const quote = await prisma.quote.findFirst({ where: { id, userId } });
    if (!quote)                         { res.status(404).json({ error: 'Quote not found' }); return; }
    if (quote.status !== 'responded')   { res.status(400).json({ error: 'No advisor quote to approve yet' }); return; }
    if (!quote.adminResponse)           { res.status(400).json({ error: 'No advisor quote to approve yet' }); return; }

    const adminResp = JSON.parse(quote.adminResponse) as AdminQuoteResponse;
    const now = new Date();

    const [policy] = await prisma.$transaction([
      prisma.policy.create({
        data: {
          policyNumber:  `APP${Date.now()}`,
          type:          quote.type,
          provider:      adminResp.insurer,
          sumInsured:    (JSON.parse(quote.details) as Record<string, unknown>).sumInsured as number ?? 0,
          premium:       adminResp.totalPremium,
          startDate:     now,
          endDate:       new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          status:        'pending',
          paymentStatus: 'pending',
          notes:         adminResp.notes ?? null,
          userId,
          quoteId:       quote.id,
        }
      }),
      prisma.quote.update({
        where: { id: quote.id },
        data:  { status: 'approved', approvedAt: now }
      }),
    ]);

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        type:  'info',
        title: 'Application Approved',
        body:  `Your application for ${adminResp.planName} has been submitted. Our advisor will send you a payment link shortly.`,
      }
    }).catch(() => {});

    res.status(201).json({
      policy: {
        id:            policy.id,
        policyNumber:  policy.policyNumber,
        status:        policy.status,
        paymentStatus: policy.paymentStatus,
        insurer:       adminResp.insurer,
        planName:      adminResp.planName,
        netPremium:    adminResp.netPremium,
        gst:           adminResp.gst,
        totalPremium:  adminResp.totalPremium,
        notes:         adminResp.notes,
        message:       'Application submitted! Our advisor will send you a payment link within 24 hours.',
      }
    });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: e.errors?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as quotesRouter };
