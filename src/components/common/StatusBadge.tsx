import { cn } from '@/lib/utils';
export function StatusBadge({ label, variant, className }: { label: string; variant?: string; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variant ?? 'bg-muted text-muted-foreground', className)}>{label}</span>;
}
