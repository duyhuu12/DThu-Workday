import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as studentService from '../services/studentService.js';
import { handleError } from '../utils/errors.js';

function requireStudentId(req: AuthRequest, res: Response): number | null {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return null;
  }

  if (req.user.role !== 'STUDENT' || !req.user.studentId) {
    res.status(403).json({ success: false, message: 'Chức năng chỉ dành cho sinh viên' });
    return null;
  }

  return req.user.studentId;
}

export async function getProfile(req: AuthRequest, res: Response) {
  const studentId = requireStudentId(req, res);
  if (!studentId) return;

  try {
    res.status(200).json({
      success: true,
      data: await studentService.getStudentProfile(studentId),
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải hồ sơ sinh viên');
  }
}

export async function getHistory(req: AuthRequest, res: Response) {
  const studentId = requireStudentId(req, res);
  if (!studentId) return;

  try {
    res.status(200).json({
      success: true,
      data: await studentService.getParticipationHistory(studentId),
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải lịch sử tham gia');
  }
}
