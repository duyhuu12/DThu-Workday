import { apiRequest, downloadApiFile } from './api';

export interface AdminReportSummary {
  totals: { events: number; students: number; credits: number; complaints: number; completionRate: number };
  byFaculty: Array<{ id: string; name: string; students: number; registrations: number; credits: number }>;
  eventsByStatus: Array<{ status: string; value: number }>;
  topStudents: Array<{
    id: string;
    studentCode: string;
    fullName: string;
    facultyName: string;
    className: string;
    accumulatedWorkdays: number;
    requiredWorkdays: number;
  }>;
}

export interface OrganizerReportSummary {
  totals: { events: number; registrations: number; completedEvents: number; credits: number };
  byEvent: Array<{
    id: string;
    name: string;
    date: string;
    registrations: number;
    present: number;
    absent: number;
    credits: number;
    status: string;
  }>;
}

export async function getAdminReportSummary(): Promise<AdminReportSummary> {
  const response = await apiRequest<AdminReportSummary>('/reports/admin/summary');
  if (!response.data) throw new Error('Không có dữ liệu báo cáo');
  return response.data;
}

export async function getOrganizerReportSummary(): Promise<OrganizerReportSummary> {
  const response = await apiRequest<OrganizerReportSummary>('/reports/organizer/summary');
  if (!response.data) throw new Error('Không có dữ liệu báo cáo');
  return response.data;
}

export function exportAdminStudentReport(): Promise<void> {
  return downloadApiFile('/reports/admin/students.csv', 'bao-cao-ngay-cong-sinh-vien.csv');
}

export function exportOrganizerEventReport(): Promise<void> {
  return downloadApiFile('/reports/organizer/events.csv', 'bao-cao-su-kien.csv');
}

export function exportEventAttendance(eventId: string): Promise<void> {
  return downloadApiFile(`/reports/events/${eventId}/attendance.csv`, `diem-danh-${eventId}.csv`);
}
