import { apiRequest } from "./api";

export interface WorkEventResponse {
  id: number;
  code: string;
  name: string;
  location: string;
  workDate: string;
  startTime: string;
  endTime: string;
  credit: number;
  maximumStudents: number;
  registeredStudents: number;
  status: string;
}

export async function getWorkEvents(): Promise<WorkEventResponse[]> {
  const response =
    await apiRequest<WorkEventResponse[]>("/events");

  return response.data ?? [];
}