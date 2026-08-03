'use client';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { useSidebar } from './SidebarContext';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return <div className="min-h-screen bg-background">
    <Sidebar />
    <div className={cn('flex min-h-screen flex-col transition-all duration-300', collapsed ? 'lg:pl-[68px]' : 'lg:pl-64')}>
      <Header />
      <main className="flex-1 space-y-4 p-4 sm:p-6"><Breadcrumbs />{children}</main>
    </div>
  </div>;
}
