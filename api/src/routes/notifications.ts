import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const unreadOnly = req.query.unread === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);

    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ notification: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid notification id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as notificationsRouter };
