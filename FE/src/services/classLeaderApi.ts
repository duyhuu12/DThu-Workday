import { apiRequest, downloadApiFile } from './api';
import type {
  ClassLeaderDashboardData,
  ClassLeaderEvent,
  ClassLeaderProfile,
  ClassLeaderStudent,
  PreliminaryReviewStatus,
} from '@/types';

export interface ClassLeaderAssignments {
  leaders: Array<{
    userId: string; fullName: string; email: string; studentId?: string; studentCode?: string;
    classId?: string; className?: string; facultyName?: string;
  }>;
  candidates: Array<{
    studentId: string; userId: string; studentCode: string; fullName: string;
    classId: string; className: string; facultyName: string; currentRole: string;
  }>;
  classes: Array<{ id: string; code: string; name: string; facultyName: string }>;
}

export async function getClassLeaderProfile(): Promise<ClassLeaderProfile> {
  const response = await apiRequest<ClassLeaderProfile>('/class-leader/profile');
  if (!response.data) throw new Error('Không có dữ liệu cán bộ lớp');
  return response.data;
}

export async function getClassLeaderDashboard(): Promise<ClassLeaderDashboardData> {
  const response = await apiRequest<ClassLeaderDashboardData>('/class-leader/dashboard');
  if (!response.data) throw new Error('Không có dữ liệu tổng quan lớp');
  return response.data;
}

export async function getClassLeaderEvents(): Promise<ClassLeaderEvent[]> {
  const response = await apiRequest<ClassLeaderEvent[]>('/class-leader/events');
  return response.data ?? [];
}

export async function getClassStudents(eventId?: string): Promise<ClassLeaderStudent[]> {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  const response = await apiRequest<ClassLeaderStudent[]>(`/class-leader/students${query}`);
  return response.data ?? [];
}

export async function setPreliminaryReview(
  registrationId: string,
  status: PreliminaryReviewStatus,
): Promise<void> {
  await apiRequest(`/class-leader/registrations/${registrationId}/preliminary`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function sendClassAnnouncement(input: {
  target: 'all' | 'insufficient' | 'unregistered' | 'selected';
  title: string;
  message: string;
  eventId?: string;
  studentIds?: string[];
}): Promise<number> {
  const response = await apiRequest<{ sent: number }>('/class-leader/notifications', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data?.sent ?? 0;
}

export async function remindInsufficientStudents(message?: string): Promise<number> {
  const response = await apiRequest<{ sent: number }>('/class-leader/reminders/workdays', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return response.data?.sent ?? 0;
}

export function exportClassWorkCredits(): Promise<void> {
  return downloadApiFile('/class-leader/reports/work-credits.csv', 'ngay-cong-lop.csv');
}

export async function getClassLeaderAssignments(): Promise<ClassLeaderAssignments> {
  const response = await apiRequest<ClassLeaderAssignments>('/class-leader/admin/assignments');
  if (!response.data) throw new Error('Không có dữ liệu cán bộ lớp');
  return response.data;
}

export async function assignClassLeader(studentId: string, classId: string): Promise<void> {
  await apiRequest('/class-leader/admin/assign', {
    method: 'PUT',
    body: JSON.stringify({ studentId, classId }),
  });
}

export async function removeClassLeader(userId: string): Promise<void> {
  await apiRequest(`/class-leader/admin/assignments/${userId}`, { method: 'DELETE' });
}
