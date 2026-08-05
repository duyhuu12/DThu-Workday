import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/hooks/useAppStore';
import dthuLogo from '../../img/logo-dthu.png';
export function Logo({ className, showText = true, collapsed }: { className?: string; showText?: boolean; collapsed?: boolean }) {
  const { settings } = useAppStore();
  return <div className={cn('flex items-center gap-2.5', className)}><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-0.5 shadow-sm"><Image src={dthuLogo} alt="Logo Trường Đại học Đồng Tháp" className="h-full w-full object-contain" priority /></div>{showText && !collapsed && <div className="flex min-w-0 flex-col leading-tight"><span className="truncate text-base font-bold text-foreground">{settings.siteName}</span><span className="text-[11px] text-muted-foreground">Đại học Đồng Tháp</span></div>}</div>;
}
