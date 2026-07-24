import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as attendanceService from '../services/attendanceService.js';
import { handleError } from '../utils/errors.js';

// 1. Get attendance list by event ID (Organizer/Admin)
export async function getAttendanceByEvent(req: AuthRequest, res: Response) {
  const { eventId } = req.params;
  const evId = parseInt(eventId as string);

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await attendanceService.getAttendanceList(evId, req.user.role, req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải danh sách điểm danh');
  }
}

// 2. Update attendance status (Check-in/Check-out/Absent)
export async function updateAttendance(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const attId = parseInt(id as string);

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await attendanceService.updateStatus(attId, req.body, req.user.role, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Cập nhật điểm danh thành công',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi cập nhật điểm danh');
  }
}

// 3. Complete event and generate credits (Organizer/Admin)
export async function completeEvent(req: AuthRequest, res: Response) {
  const { eventId } = req.body;
  const evId = parseInt(eventId as string);

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    await attendanceService.completeWorkEvent(evId, req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Hoàn thành sự kiện và ghi nhận ngày công cho sinh viên thành công',
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi hoàn thành sự kiện');
  }
}
