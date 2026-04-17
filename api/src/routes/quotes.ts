import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

const createQuoteSchema = z.object({
  type: z.enum(['life', 'health', 'motor', 'travel', 'home', 'business']),
  details: z.record(z.any())
});

const insurers = [
  { name: 'LIC', rating: 4.8, claimsRatio: '98.5%' },
  { name: 'HDFC Life', rating: 4.7, claimsRatio: '99.1%' },
  { name: 'ICICI Pru', rating: 4.6, claimsRatio: '97.8%' },
  { name: 'SBI Life', rating: 4.5, claimsRatio: '96.9%' },
  { name: 'Max Life', rating: 4.7, claimsRatio: '99.3%' },
  { name: 'Bajaj Allianz', rating: 4.4, claimsRatio: '95.8%' }
];

type QuoteOffer = {
  id: string;
  insurer: string;
  premium: number;
  sumInsured: number;
  rating: number;
  claimsRatio: string;
  features: string[];
  recommended: boolean;
};

const generateQuotes = (type: string, details: Record<string, unknown>): QuoteOffer[] =>
  insurers
    .map((insurer, index) => {
      const basePremium = Math.floor(Math.random() * 10000) + 2000;
      const premium = Math.round(basePremium * (0.8 + Math.random() * 0.4));

      return {
        id: `${type}_${insurer.name.toLowerCase().replace(/\s+/g, '_')}`,
        insurer: insurer.name,
        premium,
        sumInsured: typeof details.sumInsured === 'number' ? details.sumInsured : 1000000,
        rating: insurer.rating,
        claimsRatio: insurer.claimsRatio,
        features: ['24/7 customer support', 'Cashless claims', 'Online renewal', 'Tax benefits'],
        recommended: index === 0
      };
    })
    .sort((a, b) => a.premium - b.premium);

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, details } = createQuoteSchema.parse(req.body);
    const quotes = generateQuotes(type, details);
    const now = new Date();

    const quote = await prisma.quote.create({
      data: {
        type,
        details: JSON.stringify(details),
        providers: JSON.stringify(quotes),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        userId
      }
    });

    res.status(201).json({
      quote: {
        id: quote.id,
        type: quote.type,
        quotes,
        expiresAt: quote.expiresAt
      }
    });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const quotes = await prisma.quote.findMany({
      where: {
        userId,
        status: 'active',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formattedQuotes = quotes.map((quote) => ({
      id: quote.id,
      type: quote.type,
      quotes: JSON.parse(quote.providers) as QuoteOffer[],
      expiresAt: quote.expiresAt,
      createdAt: quote.createdAt
    }));

    res.json({ quotes: formattedQuotes });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const paramsSchema = z.object({ id: z.string().cuid() });
    const { id } = paramsSchema.parse(req.params);

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }
    if (quote.expiresAt < new Date()) {
      res.status(410).json({ error: 'Quote has expired' });
      return;
    }

    res.json({
      quote: {
        id: quote.id,
        type: quote.type,
        quotes: JSON.parse(quote.providers) as QuoteOffer[],
        expiresAt: quote.expiresAt,
        createdAt: quote.createdAt
      }
    });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid quote id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

const convertQuoteSchema = z.object({
  providerIndex: z.number().int().min(0).max(5).optional()
});

router.post('/:id/convert', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { providerIndex = 0 } = convertQuoteSchema.parse(req.body);

    const quote = await prisma.quote.findFirst({ where: { id, userId } });
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }
    if (quote.expiresAt < new Date()) {
      res.status(410).json({ error: 'Quote has expired' });
      return;
    }
    if (quote.status !== 'active') {
      res.status(400).json({ error: 'Quote has already been converted or is no longer active' });
      return;
    }

    const offers = JSON.parse(quote.providers) as QuoteOffer[];
    const selected = offers[providerIndex] ?? offers[0];
    if (!selected) {
      res.status(400).json({ error: 'Invalid provider selection' });
      return;
    }

    const now = new Date();
    const [policy] = await prisma.$transaction([
      prisma.policy.create({
        data: {
          policyNumber: `POL${Date.now()}`,
          type: quote.type,
          provider: selected.insurer,
          sumInsured: selected.sumInsured,
          premium: selected.premium,
          startDate: now,
          endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          userId,
          quoteId: quote.id
        }
      }),
      prisma.quote.update({ where: { id: quote.id }, data: { status: 'converted' } })
    ]);

    res.status(201).json({ policy });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export { router as quotesRouter };