'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';
import { useSidebar } from './SidebarContext';
import { useAppStore } from '@/hooks/useAppStore';
import { NAV_CONFIG } from '@/routes/nav-config';
import { ROLE_LABELS } from '@/lib/constants';

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { currentUser } = useAppStore();
  const pathname = usePathname();
  const [clickedPath, setClickedPath] = useState<string | null>(null);

  useEffect(() => {
    setClickedPath(null);
  }, [pathname]);

  if (!currentUser || !pathname) return null;
  const sections = NAV_CONFIG[currentUser.role] ?? [];
  const homePath = `/${currentUser.role}/dashboard`;
  const activePath = clickedPath || pathname;
  const isActive = (href: string, exact?: boolean) => exact ? activePath === href : activePath === href || activePath.startsWith(href + '/');
  return <>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={cn('fixed left-0 top-0 z-50 flex h-fit max-h-screen flex-col border-b border-r bg-card transition-all duration-300', collapsed ? 'w-[68px]' : 'w-60', 'lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
      <div className={cn('flex h-14 items-center border-b px-3', collapsed && 'justify-center px-2')}>
        <Link href={homePath} onClick={() => setMobileOpen(false)} aria-label="Về trang tổng quan" className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Logo collapsed={collapsed} />
        </Link>
        <button className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Đóng"><X className="h-5 w-5" /></button>
      </div>
      <div className="min-h-0 overflow-y-auto scrollbar-thin">
      <nav className="space-y-0.5 p-2.5">
        {sections.map((section, si) => <div key={si} className="space-y-1">
          {section.title && !collapsed && <p className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{section.title}</p>}
          {section.items.map((item) => { const active = isActive(item.href, item.exact); const Icon = item.icon; return (
            <Link key={item.href} href={item.href} onMouseDown={() => setClickedPath(item.href)} onTouchStart={() => setClickedPath(item.href)} onClick={() => { setMobileOpen(false); setClickedPath(item.href); }} className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground', collapsed && 'justify-center px-2')} title={collapsed ? item.label : undefined}>
              <Icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ); })}
        </div>)}
      </nav>
      <div className="mx-2.5 border-t px-0 py-2.5">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-foreground">{currentUser.name}</p><p className="truncate text-[11px] text-muted-foreground">{ROLE_LABELS[currentUser.role]}</p></div>}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:flex" aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}><ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} /></button>
        </div>
      </div>
      </div>
    </aside>
  </>;
}
