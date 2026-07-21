import { prisma } from './prisma';

export async function logActivity(adminId: string, action: string, details: any) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId,
        action,
        details: typeof details === 'string' ? details : JSON.stringify(details)
      }
    });
  } catch (err) {
    console.error('[logActivity] Failed:', err);
  }
}
