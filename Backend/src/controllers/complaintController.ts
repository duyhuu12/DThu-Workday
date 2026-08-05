import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as complaintService from '../services/complaintService.js';
import { handleError } from '../utils/errors.js';

// 1. Get complaints (Student sees own, Admin sees all)
export async function getComplaints(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await complaintService.listComplaints(req.user.role, req.user.studentId ?? null);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải thông tin khiếu nại');
  }
}

// 2. Student submit a complaint
export async function createComplaint(req: AuthRequest, res: Response) {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({ success: false, message: 'Chỉ sinh viên mới có quyền gửi khiếu nại' });
    return;
  }

  const studentId = req.user.studentId;
  if (!studentId) {
    res.status(400).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên' });
    return;
  }

  try {
    const data = await complaintService.submitComplaint(req.body, studentId, req.user.fullName);
    res.status(201).json({
      success: true,
      message: 'Gửi khiếu nại thành công',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi gửi khiếu nại');
  }
}

// 3. Admin respond / process / resolve complaint (Admin only)
export async function respondComplaint(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const compId = parseInt(id as string);
  const { status, note } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await complaintService.resolveComplaint(compId, status, note, req.user.fullName);
    res.status(200).json({
      success: true,
      message: 'Cập nhật phản hồi khiếu nại thành công',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi xử lý khiếu nại');
  }
}
