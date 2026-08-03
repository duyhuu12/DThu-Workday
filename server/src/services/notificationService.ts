import { prisma } from '../config/prisma.js';

function mapNotification(n: any) {
  return {
    id: String(n.id),
    userId: String(n.userId),
    type: n.type.toLowerCase(),
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    link: n.link || undefined,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function listNotifications(userId: number) {
  const list = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return list.map(mapNotification);
}

export async function readNotif(notifId: number) {
  await prisma.notification.update({
    where: { id: notifId },
    data: { isRead: true },
  });
}

export async function readAllNotifs(userId: number) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
