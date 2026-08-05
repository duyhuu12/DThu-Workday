'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Wrench } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { ROLE_HOME } from '@/lib/constants';
import type { UserRole } from '@/types';

export function RoleGuard({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { currentUser, settings, fetchSettings, fetchSemesters, logout } = useAppStore();
  const router = useRouter();
  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    if (!allowedRoles.includes(currentUser.role)) router.replace('/403');
  }, [currentUser, allowedRoles, router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void Promise.allSettled([fetchSettings(), fetchSemesters()]);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [fetchSettings, fetchSemesters]);

  if (!currentUser || !allowedRoles.includes(currentUser.role)) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
  if (settings.maintenanceMode && currentUser.role !== 'superadmin') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <section className="w-full max-w-lg rounded-2xl border bg-background p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">Hệ thống đang bảo trì</h1>
          <p className="mt-3 text-muted-foreground">
            Hệ thống tạm khóa truy cập để thực hiện bảo trì. Vui lòng quay lại sau.
          </p>
          <div className="mt-5 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Hỗ trợ: {settings.supportEmail} · {settings.supportPhone}
          </div>
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </button>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppStore();
  const router = useRouter();
  useEffect(() => { if (currentUser) router.replace(ROLE_HOME[currentUser.role]); }, [currentUser, router]);
  if (currentUser) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
  return <>{children}</>;
}

export function useLogout() {
  const { logout } = useAppStore();
  const router = useRouter();
  return () => { logout(); router.replace('/login'); };
}
