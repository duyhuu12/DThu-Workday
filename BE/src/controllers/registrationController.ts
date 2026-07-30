import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as registrationService from '../services/registrationService.js';
import { handleError } from '../utils/errors.js';

export async function getRegistrations(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const { studentId, eventId, status } = req.query;

    const data = await registrationService.listRegistrations(
      {
        studentId: studentId?.toString(),
        eventId: eventId?.toString(),
        status: status?.toString(),
      },
      req.user.role,
      req.user.studentId ?? null,
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi lấy danh sách đăng ký');
  }
}

export async function registerEvent(req: AuthRequest, res: Response) {
  if (!req.user || !['STUDENT', 'CLASS_LEADER'].includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Chỉ sinh viên mới được đăng ký sự kiện' });
    return;
  }

  const studentId = req.user.studentId;
  if (!studentId) {
    res.status(400).json({ success: false, message: 'Không tìm thấy thông tin sinh viên' });
    return;
  }

  const { eventId, selectedDate, selectedShift, selectedStartTime, selectedEndTime } = req.body;
  const evId = parseInt(eventId as string);

  if (!Number.isInteger(evId) || evId <= 0) {
    res.status(400).json({ success: false, message: 'Mã sự kiện không hợp lệ' });
    return;
  }

  try {
    const data = await registrationService.createRegistration(evId, studentId, {
      selectedDate,
      selectedShift,
      selectedStartTime,
      selectedEndTime,
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký sự kiện thành công, vui lòng đợi duyệt',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi đăng ký sự kiện');
  }
}

export async function cancelRegistration(req: AuthRequest, res: Response) {
  if (!req.user || !['STUDENT', 'CLASS_LEADER'].includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Hành động không hợp lệ' });
    return;
  }

  const studentId = req.user.studentId;
  if (!studentId) {
    res.status(400).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên' });
    return;
  }

  const { id } = req.params;
  const regId = parseInt(id as string);

  try {
    const data = await registrationService.cancelRegistration(regId, studentId);
    res.status(200).json({
      success: true,
      message: 'Hủy đăng ký thành công',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi hủy đăng ký');
  }
}

export async function updateRegistrationStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const regId = parseInt(id as string);
  const { status, rejectionReason } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await registrationService.approveOrReject(
      regId,
      status,
      rejectionReason,
      req.user.id,
      req.user.role,
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đăng ký thành công',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi duyệt đăng ký');
  }
}
