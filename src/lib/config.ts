export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';
export const API_DELAY = 400;
export function delay(ms = API_DELAY): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
export function genId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`; }
