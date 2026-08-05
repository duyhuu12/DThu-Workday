import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as creditService from '../services/creditService.js';
import { handleError } from '../utils/errors.js';

// 1. Get all credits (with filters)
export async function getCredits(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const { studentId, status } = req.query;

    const data = await creditService.listCredits(
      {
        studentId: studentId?.toString(),
        status: status?.toString()
      },
      req.user.role,
      req.user.studentId ?? null,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải thông tin ngày công');
  }
}

// 2. Adjust credit value (Admin only)
export async function adjustCredit(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const creditId = parseInt(id as string);
  const { creditValue, reason } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await creditService.adjustCreditValue(
      creditId,
      parseFloat(creditValue),
      reason,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Điều chỉnh ngày công thành công',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi điều chỉnh ngày công');
  }
}

export async function updateCreditStatus(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }
  const creditId = Number(req.params.id);
  try {
    const data = await creditService.updateCreditStatus(creditId, req.body.status, req.user.id);
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái ngày công thành công', data });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi cập nhật trạng thái ngày công');
  }
}

export async function createManualCredit(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }
  try {
    const data = await creditService.createManualCreditAdjustment(
      req.body.studentId,
      req.body.creditValue,
      req.body.reason,
      req.user.id,
    );
    res.status(201).json({ success: true, message: 'Đã điều chỉnh ngày công cho sinh viên', data });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi cấp ngày công');
  }
}
