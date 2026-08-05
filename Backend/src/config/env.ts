import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(currentDirectory, '../../.env');

if (existsSync(envPath)) {
  config({ path: envPath, override: false });
} else {
  config();
}

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}. Hãy kiểm tra file BE/.env`);
  }
  return value;
}

export function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Biến môi trường ${name} phải là số`);
  }
  return value;
}

export function booleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (['true', '1', 'yes'].includes(raw)) return true;
  if (['false', '0', 'no'].includes(raw)) return false;
  throw new Error(`Biến môi trường ${name} phải là true hoặc false`);
}
