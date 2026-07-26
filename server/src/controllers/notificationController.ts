import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as notificationService from '../services/notificationService.js';
import { handleError } from '../utils/errors.js';

export async function getNotifications(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await notificationService.listNotifications(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải thông báo');
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const notifId = parseInt(id as string);

  try {
    await notificationService.readNotif(notifId);
    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi đánh dấu đọc thông báo');
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    await notificationService.readAllNotifs(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu đọc tất cả thông báo',
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi đánh dấu đọc tất cả thông báo');
  }
}
