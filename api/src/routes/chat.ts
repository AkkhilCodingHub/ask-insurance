import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── User: get or create their conversation ────────────────────────────────────
router.post('/conversations', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { subject } = z.object({ subject: z.string().max(200).optional() }).parse(req.body);

    // Reuse open conversation if one exists
    const existing = await prisma.conversation.findFirst({
      where: { userId, status: 'open' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        admin: { select: { id: true, name: true } }
      }
    });

    if (existing) {
      res.json({ conversation: existing });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: { userId, subject: subject ?? null, status: 'open' },
      include: {
        messages: true,
        admin: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ conversation });
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

// ── User: list their conversations ───────────────────────────────────────────
router.get('/conversations', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } }
      }
    });

    res.json({ conversations });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── User: get messages for a conversation ────────────────────────────────────
router.get('/conversations/:id/messages', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const after = req.query.after ? new Date(req.query.after as string) : undefined;

    const conversation = await prisma.conversation.findUnique({ where: { id }, select: { userId: true } });
    if (!conversation || conversation.userId !== userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id, ...(after ? { createdAt: { gt: after } } : {}) },
      orderBy: { createdAt: 'asc' }
    });

    // Mark admin messages as read
    const unreadIds = messages.filter(m => m.senderType === 'admin' && !m.readAt).map(m => m.id);
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({ where: { id: { in: unreadIds } }, data: { readAt: new Date() } });
    }

    res.json({ messages });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── User: send a message ─────────────────────────────────────────────────────
router.post('/conversations/:id/messages', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { content } = z.object({ content: z.string().min(1).max(4000) }).parse(req.body);

    const conversation = await prisma.conversation.findUnique({ where: { id }, select: { userId: true, status: true } });
    if (!conversation || conversation.userId !== userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    if (conversation.status === 'closed') {
      res.status(400).json({ error: 'Conversation is closed' });
      return;
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: id, content, senderType: 'user', senderId: userId }
      }),
      prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } })
    ]);

    res.status(201).json({ message });
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

export { router as chatRouter };
