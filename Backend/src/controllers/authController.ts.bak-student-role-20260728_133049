import { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { handleError } from '../utils/errors.js';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const result = await authService.loginUser(email, password);
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token: result.token,
      data: result.user
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi đăng nhập');
  }
}

export async function getCurrentUser(req: any, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await authService.getUserById(req.user.id);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi lấy thông tin người dùng');
  }
}
