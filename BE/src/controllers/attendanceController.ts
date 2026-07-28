import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as attendanceService from '../services/attendanceService.js';
import { handleError } from '../utils/errors.js';

function positiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function getAttendanceByEvent(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  const eventId = positiveInt(req.params.eventId);
  if (!eventId) return void res.status(400).json({ success: false, message: 'Mã sự kiện không hợp lệ' });

  try {
    res.status(200).json({
      success: true,
      data: await attendanceService.getAttendanceList(eventId, req.user.role, req.user.id),
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải danh sách điểm danh');
  }
}

export async function updateAttendance(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  const attendanceId = positiveInt(req.params.id);
  if (!attendanceId) return void res.status(400).json({ success: false, message: 'Mã điểm danh không hợp lệ' });

  try {
    res.status(200).json({
      success: true,
      message: 'Cập nhật điểm danh thành công',
      data: await attendanceService.updateStatus(
        attendanceId,
        req.body,
        req.user.role,
        req.user.id,
      ),
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi cập nhật điểm danh');
  }
}

export async function bulkUpdateAttendance(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  const eventId = positiveInt(req.params.eventId);
  if (!eventId) return void res.status(400).json({ success: false, message: 'Mã sự kiện không hợp lệ' });

  try {
    res.status(200).json({
      success: true,
      message: 'Cập nhật điểm danh hàng loạt thành công',
      data: await attendanceService.bulkUpdateStatus(
        eventId,
        req.body.status,
        req.user.role,
        req.user.id,
      ),
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi điểm danh hàng loạt');
  }
}

export async function completeEvent(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  const eventId = positiveInt(req.params.eventId ?? req.body.eventId);
  if (!eventId) return void res.status(400).json({ success: false, message: 'Mã sự kiện không hợp lệ' });

  try {
    await attendanceService.completeWorkEvent(eventId, req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Đã hoàn tất sự kiện và ghi nhận ngày công',
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi hoàn thành sự kiện');
  }
}

export async function generateQr(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  const eventId = positiveInt(req.params.eventId);
  if (!eventId) return void res.status(400).json({ success: false, message: 'Mã sự kiện không hợp lệ' });

  try {
    res.status(200).json({
      success: true,
      message: 'Tạo mã QR điểm danh thành công',
      data: await attendanceService.createAttendanceQr(
        eventId,
        req.body.mode,
        req.body.expiresInMinutes,
        req.user.role,
        req.user.id,
      ),
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tạo mã QR điểm danh');
  }
}

export async function scanQr(req: AuthRequest, res: Response) {
  if (!req.user || req.user.role !== 'STUDENT' || !req.user.studentId) {
    return void res.status(403).json({
      success: false,
      message: 'Chức năng chỉ dành cho sinh viên',
    });
  }

  try {
    const data = await attendanceService.scanStudentQr(
      req.body.qrValue ?? req.body.token,
      req.user.studentId,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi điểm danh bằng QR');
  }
}
