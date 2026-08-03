import { RoleDashboardLayout } from '@/components/layout/RoleDashboardLayout';
export default function Layout({ children }: { children: React.ReactNode }) { return <RoleDashboardLayout roles={['superadmin']}>{children}</RoleDashboardLayout>; }
