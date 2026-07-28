import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as systemService from '../services/systemService.js';
import { handleError } from '../utils/errors.js';

function clientIp(req: Request): string | undefined {
  return req.ip || req.socket.remoteAddress || undefined;
}

function requireUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return null;
  }
  return req.user;
}

export async function getFaculties(_req: Request, res: Response) {
  try {
    res.status(200).json({ success: true, data: await systemService.listFaculties() });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải danh sách khoa');
  }
}

export async function createFaculty(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.createFaculty(req.body, user.id, clientIp(req));
    res.status(201).json({ success: true, message: 'Thêm khoa thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi thêm khoa'); }
}

export async function updateFaculty(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.updateFaculty(req.params.id, req.body, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Cập nhật khoa thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi cập nhật khoa'); }
}

export async function deleteFaculty(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    await systemService.deleteFaculty(req.params.id, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Xóa khoa thành công' });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi xóa khoa'); }
}

export async function getClasses(_req: Request, res: Response) {
  try {
    res.status(200).json({ success: true, data: await systemService.listClasses() });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi tải danh sách lớp'); }
}

export async function createClass(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.createClass(req.body, user.id, clientIp(req));
    res.status(201).json({ success: true, message: 'Thêm lớp thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi thêm lớp'); }
}

export async function updateClass(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.updateClass(req.params.id, req.body, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Cập nhật lớp thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi cập nhật lớp'); }
}

export async function deleteClass(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    await systemService.deleteClass(req.params.id, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Xóa lớp thành công' });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi xóa lớp'); }
}

export async function getStudents(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.listStudents(user.role, user.studentId);
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi tải danh sách sinh viên'); }
}

export async function createStudent(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.createStudent(req.body, user.id, clientIp(req));
    res.status(201).json({ success: true, message: 'Thêm sinh viên thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi thêm sinh viên'); }
}

export async function updateStudent(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.updateStudent(req.params.id, req.body, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Cập nhật sinh viên thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi cập nhật sinh viên'); }
}

export async function deleteStudent(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    await systemService.deleteStudent(req.params.id, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Xóa sinh viên thành công' });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi xóa sinh viên'); }
}

export async function getUsers(req: AuthRequest, res: Response) {
  if (!requireUser(req, res)) return;
  try {
    res.status(200).json({ success: true, data: await systemService.listUsers() });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi tải danh sách người dùng'); }
}

export async function createUser(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.createUser(req.body, user.id, clientIp(req));
    res.status(201).json({ success: true, message: 'Thêm người dùng thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi thêm người dùng'); }
}

export async function updateUser(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.updateUser(req.params.id, req.body, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Cập nhật người dùng thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi cập nhật người dùng'); }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    await systemService.deleteUser(req.params.id, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi xóa người dùng'); }
}

export async function getSettings(_req: Request, res: Response) {
  try {
    res.status(200).json({ success: true, data: await systemService.getSystemConfig() });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi tải cài đặt hệ thống'); }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await systemService.updateSystemConfig(req.body, user.id, clientIp(req));
    res.status(200).json({ success: true, message: 'Cập nhật cài đặt thành công', data });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi cập nhật cài đặt'); }
}

export async function getSemesters(_req: Request, res: Response) {
  try {
    res.status(200).json({ success: true, data: await systemService.listSemesters() });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi tải học kỳ'); }
}

export async function getActivityLogs(req: AuthRequest, res: Response) {
  if (!requireUser(req, res)) return;
  try {
    res.status(200).json({ success: true, data: await systemService.listActivityLogs() });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi tải nhật ký hoạt động'); }
}

export async function createActivityLog(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    await systemService.createActivityLog(req.body, user.id, clientIp(req));
    res.status(201).json({ success: true, message: 'Đã ghi nhật ký hoạt động' });
  } catch (error) { handleError(res, error, 'Lỗi hệ thống khi ghi nhật ký hoạt động'); }
}
