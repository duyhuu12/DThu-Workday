import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as reportService from '../services/reportService.js';
import { handleError } from '../utils/errors.js';

function sendCsv(res: Response, file: reportService.CsvFile): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.status(200).send(file.content);
}

export async function getAdminSummary(_req: AuthRequest, res: Response) {
  try {
    res.status(200).json({ success: true, data: await reportService.getAdminReportSummary() });
  } catch (error) {
    handleError(res, error, 'Không thể tải báo cáo quản trị');
  }
}

export async function exportAdminStudents(_req: AuthRequest, res: Response) {
  try {
    sendCsv(res, await reportService.exportAdminStudentReport());
  } catch (error) {
    handleError(res, error, 'Không thể xuất báo cáo sinh viên');
  }
}

export async function getOrganizerSummary(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  try {
    res.status(200).json({ success: true, data: await reportService.getOrganizerReportSummary(req.user.id) });
  } catch (error) {
    handleError(res, error, 'Không thể tải báo cáo người phụ trách');
  }
}

export async function exportOrganizerEvents(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  try {
    sendCsv(res, await reportService.exportOrganizerEventReport(req.user.id));
  } catch (error) {
    handleError(res, error, 'Không thể xuất báo cáo sự kiện');
  }
}

export async function exportAttendance(req: AuthRequest, res: Response) {
  if (!req.user) return void res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  const eventId = Number(req.params.eventId);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return void res.status(400).json({ success: false, message: 'Mã sự kiện không hợp lệ' });
  }
  try {
    sendCsv(res, await reportService.exportEventAttendance(eventId, req.user.id, req.user.role));
  } catch (error) {
    handleError(res, error, 'Không thể xuất danh sách điểm danh');
  }
}
