export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dthu-jwt-token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? ((await response.json()) as ApiResponse<T>)
    : ({ success: response.ok, message: await response.text() } as ApiResponse<T>);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Không thể kết nối máy chủ');
  }
  return result;
}

export async function downloadApiFile(endpoint: string, fallbackFilename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers: authHeaders() });
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const message = contentType.includes('application/json')
      ? ((await response.json()) as ApiResponse<never>).message
      : await response.text();
    throw new Error(message || 'Không thể tải file báo cáo');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || fallbackFilename;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function checkApiHealth() {
  return apiRequest<never>('/health');
}
