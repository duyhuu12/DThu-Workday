import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string { try { const d = typeof date === 'string' ? parseISO(date) : date; return format(d, fmt, { locale: vi }); } catch { return '—'; } }
export function formatDateTime(date: string | Date, fmt = 'dd/MM/yyyy HH:mm'): string { try { const d = typeof date === 'string' ? parseISO(date) : date; return format(d, fmt, { locale: vi }); } catch { return '—'; } }
