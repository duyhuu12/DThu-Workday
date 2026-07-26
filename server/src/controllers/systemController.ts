import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as systemService from '../services/systemService.js';
import { handleError } from '../utils/errors.js';

// 1. Get faculties
export async function getFaculties(req: Request, res: Response) {
  try {
    const data = await systemService.listFaculties();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải danh sách khoa');
  }
}

// 2. Get classes
export async function getClasses(req: Request, res: Response) {
  try {
    const data = await systemService.listClasses();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải danh sách lớp');
  }
}

// 3. Get system settings
export async function getSettings(req: Request, res: Response) {
  try {
    const data = await systemService.getSystemConfig();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải cài đặt hệ thống');
  }
}

// 4. Update system settings (Super Admin only)
export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const data = await systemService.updateSystemConfig(req.body);
    res.status(200).json({
      success: true,
      message: 'Cập nhật cài đặt thành công',
      data
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi cập nhật cài đặt');
  }
}
