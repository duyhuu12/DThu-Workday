'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/useAppStore';
import { ROLE_HOME } from '@/lib/constants';
import type { UserRole } from '@/types';

export function RoleGuard({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { currentUser } = useAppStore();
  const router = useRouter();
  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    if (!allowedRoles.includes(currentUser.role)) router.replace('/403');
  }, [currentUser, allowedRoles, router]);
  if (!currentUser || !allowedRoles.includes(currentUser.role)) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
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
