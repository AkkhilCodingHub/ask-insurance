import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { sendPush } from '../lib/push';

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
        details:        typeof q.details === 'string' ? (() => { try { return JSON.parse(q.details); } catch { return q.details; } })() : q.details,
        status:         q.status,
        adminResponse:  q.adminResponse ? (typeof q.adminResponse === 'string' ? (() => { try { return JSON.parse(q.adminResponse); } catch { return null; } })() : q.adminResponse) : null,
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
  details: z.record(z.string(), z.any()),   // age, gender, sumInsured, smoker, planId, planName, etc.
});

async function getAssignedAgentForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentId: true }
  });

  if (user?.agentId) {
    const existingAgent = await prisma.admin.findFirst({
      where: { id: user.agentId, isActive: true }
    });
    if (existingAgent) return existingAgent.id;
  }

  // System Round-Robin Load Balancing: Find active agents with role='agent'
  const activeAgents = await prisma.admin.findMany({
    where: { role: 'agent', isActive: true },
    select: {
      id: true,
      _count: {
        select: { assignedQuotes: { where: { status: { in: ['pending', 'responded'] } } } }
      }
    }
  });

  if (activeAgents.length === 0) return null;

  // Pick agent with lowest current open workload
  activeAgents.sort((a, b) => a._count.assignedQuotes - b._count.assignedQuotes);
  const selectedAgentId = activeAgents[0]?.id ?? null;
  if (!selectedAgentId) return null;

  // Link user for future continuity
  await prisma.user.update({
    where: { id: userId },
    data: { agentId: selectedAgentId }
  }).catch(() => {});

  return selectedAgentId;
}

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { type, details } = createQuoteSchema.parse(req.body);

    const assignedAgentId = await getAssignedAgentForUser(userId);

    const ncbValue = Number(details?.ncbPercentage || 0);
    const hasClaim = Boolean(details?.hasPreviousClaim);
    const ncbDiscrepancy = hasClaim && ncbValue > 0;

    const ncbWarningAlert = ncbDiscrepancy ? {
      warning: true,
      code: 'NCB_DISCREPANCY',
      title: '⚠️ NCB Discrepancy & Penalty Risk Warning Alert',
      message: `Claim reported in previous policy year! Claiming ${ncbValue}% NCB will result in policy rejection or claim repudiation during verification. NCB reset to 0%.`
    } : null;

    const quote = await prisma.quote.create({
      data: {
        type,
        details:   JSON.stringify({ ...details, ...(ncbWarningAlert ? { ncbWarningAlert } : {}) }),
        providers: '[]',
        status:    'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        userId,
        agentId:   assignedAgentId,
      }
    });

    // If PAN and Aadhaar numbers are provided, auto-verify user's KYC & register official documents
    const panNum = typeof details?.panNumber === 'string' ? details.panNumber.trim().toUpperCase() : null;
    const aadhaarNum = typeof details?.aadhaarNumber === 'string' ? details.aadhaarNumber.replace(/\D/g, '') : null;
    if (panNum && panNum.length === 10 && aadhaarNum && aadhaarNum.length >= 12) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          panNumber: panNum,
          aadhaarVerified: true,
          kycStatus: 'verified',
          kycVerifiedAt: new Date(),
          kycSubmittedAt: new Date(),
        }
      }).catch(() => {});

      const existingPan = await prisma.userDocument.findFirst({
        where: { userId, docType: 'pan' }
      });
      if (!existingPan) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: `PAN Card (${panNum})`,
            docType: 'pan',
            source: 'user_upload',
            fileUrl: typeof details?.panDocUri === 'string' && details.panDocUri.startsWith('http') 
              ? details.panDocUri 
              : `https://storage.askinsurance.com/kyc/pan_${userId}.pdf`,
            issuer: 'Income Tax Department',
          }
        }).catch(() => {});
      }

      const existingAadhaar = await prisma.userDocument.findFirst({
        where: { userId, docType: 'aadhaar' }
      });
      if (!existingAadhaar) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: `Aadhaar Card (••••${aadhaarNum.slice(-4)})`,
            docType: 'aadhaar',
            source: 'user_upload',
            fileUrl: typeof details?.aadhaarDocUri === 'string' && details.aadhaarDocUri.startsWith('http') 
              ? details.aadhaarDocUri 
              : `https://storage.askinsurance.com/kyc/aadhaar_${userId}.pdf`,
            issuer: 'UIDAI',
          }
        }).catch(() => {});
      }
    }

    // Record Driving Licence Document if supplied (e.g. for Motor Insurance)
    const dlNum = typeof details?.drivingLicenseNumber === 'string' ? details.drivingLicenseNumber.trim().toUpperCase() : null;
    if (dlNum && dlNum.length >= 8) {
      const existingDl = await prisma.userDocument.findFirst({ where: { userId, docType: 'driving_license' } });
      if (!existingDl) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: `Driving Licence (${dlNum})`,
            docType: 'driving_license',
            source: 'user_upload',
            fileUrl: typeof details?.drivingLicenseDocUri === 'string' && details.drivingLicenseDocUri.startsWith('http')
              ? details.drivingLicenseDocUri
              : `https://storage.askinsurance.com/kyc/dl_${userId}.pdf`,
            issuer: 'Ministry of Road Transport and Highways',
          }
        }).catch(() => {});
      }
    }

    // Record Vehicle RC Document if supplied (e.g. for Motor Insurance)
    const rcNum = typeof details?.rcNumber === 'string' ? details.rcNumber.trim().toUpperCase() : (typeof details?.registrationNumber === 'string' ? details.registrationNumber.trim().toUpperCase() : null);
    if (rcNum && rcNum.length >= 6) {
      const existingRc = await prisma.userDocument.findFirst({ where: { userId, docType: 'vehicle_rc' } });
      if (!existingRc) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: `Registration Certificate (RC: ${rcNum})`,
            docType: 'vehicle_rc',
            source: 'user_upload',
            fileUrl: typeof details?.rcDocUri === 'string' && details.rcDocUri.startsWith('http')
              ? details.rcDocUri
              : `https://storage.askinsurance.com/kyc/rc_${userId}.pdf`,
            issuer: 'Ministry of Road Transport and Highways',
          }
        }).catch(() => {});
      }
    }

    res.status(201).json({
      quote: {
        id:              quote.id,
        type:            quote.type,
        status:          quote.status,
        agentId:         quote.agentId,
        ncbWarningAlert,
        createdAt:       quote.createdAt,
        message:         'Quote request submitted. Our advisor will contact you with the best quote within 24 hours.',
      }
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' });
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
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

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

import { generateQuoteAcknowledgementHtml } from '../lib/certificateGenerator';

// ── GET /:id/acknowledgement — render official quote acknowledgement slip ───
router.get('/:id/acknowledgement', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { user: { select: { name: true, phone: true, email: true } } }
    });

    if (!quote) {
      res.status(404).send('Quote acknowledgement slip not found');
      return;
    }

    let parsedDetails: Record<string, any> = {};
    try { parsedDetails = JSON.parse(quote.details); } catch {}

    let parsedAdminResponse: any = null;
    if (quote.adminResponse) {
      try { parsedAdminResponse = JSON.parse(quote.adminResponse as string); } catch {}
    }

    const html = generateQuoteAcknowledgementHtml({
      quoteId: quote.id,
      type: quote.type,
      status: quote.status,
      createdAt: quote.createdAt,
      expiresAt: quote.expiresAt,
      userName: quote.user?.name,
      userPhone: quote.user?.phone,
      userEmail: quote.user?.email || undefined,
      details: parsedDetails,
      adminResponse: parsedAdminResponse,
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating quote acknowledgement:', error);
    res.status(500).send('Error generating acknowledgement slip');
  }
});

router.get('/:id/report', async (req: Request, res: Response): Promise<void> => {
  res.redirect(`/api/quotes/${req.params.id}/acknowledgement`);
});

// ── POST /:id/approve — user approves admin's quote, creates pending policy ───
router.post('/:id/approve', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

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

    // Push notification (non-fatal)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
    await sendPush(
      user?.pushToken ?? null,
      'Application Approved',
      `Your ${quote.type} insurance application has been submitted. Expect a payment link shortly.`,
      { screen: 'my-quotes' }
    );

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
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as quotesRouter };
