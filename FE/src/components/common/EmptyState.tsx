import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center', className)}><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted"><Icon className="h-7 w-7 text-muted-foreground" /></div><h3 className="text-base font-semibold text-foreground">{title}</h3>{description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}
