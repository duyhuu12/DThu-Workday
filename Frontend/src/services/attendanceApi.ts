import { apiRequest } from './api';
import type {
  Attendance,
  AttendanceQrData,
  AttendanceSessionData,
  AttendanceStatus,
  StudentQrScanResult,
} from '@/types';

export interface AttendanceRow extends Attendance {
  className?: string;
  facultyName?: string;
}

export async function getAttendanceByEvent(eventId: string): Promise<AttendanceRow[]> {
  const response = await apiRequest<AttendanceRow[]>(`/attendance/event/${eventId}`);
  return response.data ?? [];
}

export async function updateAttendanceStatus(
  attendanceId: string,
  status: AttendanceStatus,
  data: { checkInTime?: string; checkOutTime?: string; notes?: string } = {},
): Promise<AttendanceRow> {
  const response = await apiRequest<AttendanceRow>(`/attendance/${attendanceId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, ...data }),
  });
  if (!response.data) throw new Error('Máy chủ không trả dữ liệu điểm danh');
  return response.data;
}

export async function bulkUpdateAttendance(
  eventId: string,
  status: AttendanceStatus,
): Promise<AttendanceRow[]> {
  const response = await apiRequest<AttendanceRow[]>(`/attendance/event/${eventId}/bulk`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return response.data ?? [];
}

export async function completeAttendanceEvent(eventId: string): Promise<void> {
  await apiRequest(`/attendance/event/${eventId}/complete`, { method: 'POST' });
}

export async function generateAttendanceQr(
  eventId: string,
  mode: 'check_in' | 'check_out',
  expiresInMinutes = 5,
): Promise<AttendanceQrData> {
  const response = await apiRequest<AttendanceQrData>(`/attendance/event/${eventId}/qr`, {
    method: 'POST',
    body: JSON.stringify({ mode, expiresInMinutes }),
  });
  if (!response.data) throw new Error('Máy chủ không trả mã QR');
  return response.data;
}

export async function getAttendanceSession(eventId: string): Promise<AttendanceSessionData> {
  const response = await apiRequest<AttendanceSessionData>(`/attendance/event/${eventId}/session`);
  if (!response.data) throw new Error('Máy chủ không trả trạng thái phiên điểm danh');
  return response.data;
}

export async function startAttendanceSession(
  eventId: string,
  mode: 'check_in' | 'check_out',
): Promise<AttendanceSessionData> {
  const response = await apiRequest<AttendanceSessionData>(
    `/attendance/event/${eventId}/session/start`,
    { method: 'POST', body: JSON.stringify({ mode }) },
  );
  if (!response.data) throw new Error('Máy chủ không trả phiên điểm danh');
  return response.data;
}

export async function stopAttendanceSession(eventId: string): Promise<AttendanceSessionData> {
  const response = await apiRequest<AttendanceSessionData>(
    `/attendance/event/${eventId}/session/stop`,
    { method: 'POST' },
  );
  if (!response.data) throw new Error('Máy chủ không trả trạng thái phiên điểm danh');
  return response.data;
}

export async function scanStudentAttendanceQr(qrValue: string): Promise<StudentQrScanResult> {
  const response = await apiRequest<StudentQrScanResult>('/attendance/student/scan', {
    method: 'POST',
    body: JSON.stringify({ qrValue }),
  });
  if (!response.data) throw new Error('Máy chủ không trả kết quả điểm danh');
  return response.data;
}
