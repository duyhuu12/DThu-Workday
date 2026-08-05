import { apiRequest } from './api';
import type { Student, StudentParticipationHistory } from '@/types';

export async function getCurrentStudentProfile(): Promise<Student> {
  const response = await apiRequest<Student>('/student/profile');
  if (!response.data) throw new Error('Máy chủ không trả hồ sơ sinh viên');
  return response.data;
}

export async function getStudentParticipationHistory(): Promise<StudentParticipationHistory[]> {
  const response = await apiRequest<StudentParticipationHistory[]>('/student/history');
  return response.data ?? [];
}
