import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as classLeaderService from '../services/classLeaderService.js';
import { handleError } from '../utils/errors.js';

function requireUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return null;
  }
  return req.user;
}

function sendCsv(res: Response, file: classLeaderService.CsvFile): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.status(200).send(file.content);
}

export async function getProfile(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try { res.json({ success: true, data: await classLeaderService.getProfile(user.id) }); }
  catch (error) { handleError(res, error, 'Không thể tải hồ sơ cán bộ lớp'); }
}

export async function getDashboard(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try { res.json({ success: true, data: await classLeaderService.getDashboard(user.id) }); }
  catch (error) { handleError(res, error, 'Không thể tải tổng quan lớp'); }
}

export async function getEvents(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try { res.json({ success: true, data: await classLeaderService.listClassEvents(user.id) }); }
  catch (error) { handleError(res, error, 'Không thể tải sự kiện của lớp'); }
}

export async function getStudents(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try { res.json({ success: true, data: await classLeaderService.listClassStudents(user.id, req.query.eventId) }); }
  catch (error) { handleError(res, error, 'Không thể tải danh sách sinh viên lớp'); }
}

export async function reviewRegistration(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await classLeaderService.reviewRegistration(user.id, req.params.id, req.body.status);
    res.json({ success: true, message: 'Đã cập nhật xác nhận sơ bộ', data });
  } catch (error) { handleError(res, error, 'Không thể xác nhận sơ bộ đăng ký'); }
}

export async function sendNotification(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await classLeaderService.sendClassNotification(user.id, req.body);
    res.json({ success: true, message: `Đã gửi thông báo đến ${data.sent} sinh viên`, data });
  } catch (error) { handleError(res, error, 'Không thể gửi thông báo lớp'); }
}

export async function remindWorkdays(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await classLeaderService.remindInsufficientWorkdays(user.id, req.body.message);
    res.json({ success: true, message: `Đã nhắc ${data.sent} sinh viên chưa đủ ngày công`, data });
  } catch (error) { handleError(res, error, 'Không thể gửi nhắc nhở ngày công'); }
}

export async function exportWorkCredits(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try { sendCsv(res, await classLeaderService.exportClassWorkCredits(user.id)); }
  catch (error) { handleError(res, error, 'Không thể xuất báo cáo ngày công lớp'); }
}

export async function getAssignments(_req: AuthRequest, res: Response) {
  try { res.json({ success: true, data: await classLeaderService.listAssignments() }); }
  catch (error) { handleError(res, error, 'Không thể tải danh sách cán bộ lớp'); }
}

export async function assignLeader(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    const data = await classLeaderService.assignClassLeader(req.body.studentId, req.body.classId, user.id);
    res.json({ success: true, message: 'Đã phân công cán bộ lớp', data });
  } catch (error) { handleError(res, error, 'Không thể phân công cán bộ lớp'); }
}

export async function removeLeader(req: AuthRequest, res: Response) {
  const user = requireUser(req, res); if (!user) return;
  try {
    await classLeaderService.removeClassLeader(req.params.userId, user.id);
    res.json({ success: true, message: 'Đã hủy phân công cán bộ lớp' });
  } catch (error) { handleError(res, error, 'Không thể hủy phân công cán bộ lớp'); }
}
