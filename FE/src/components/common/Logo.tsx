import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
export function Logo({ className, showText = true, collapsed }: { className?: string; showText?: boolean; collapsed?: boolean }) {
  return <div className={cn('flex items-center gap-2.5', className)}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><GraduationCap className="h-5 w-5" /></div>{showText && !collapsed && <div className="flex flex-col leading-tight"><span className="text-base font-bold text-foreground">DThU Workday</span><span className="text-[11px] text-muted-foreground">Đại học Đồng Tháp</span></div>}</div>;
}
