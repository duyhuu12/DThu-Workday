'use client';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/routes/RoleGuard';
import type { UserRole } from '@/types';
export function RoleDashboardLayout({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  return <RoleGuard allowedRoles={roles}><SidebarProvider><DashboardShell>{children}</DashboardShell></SidebarProvider></RoleGuard>;
}
