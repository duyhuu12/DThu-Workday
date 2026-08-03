'use client';
import { Users, ShieldAlert, Settings, Activity, UserCheck, UserX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

export default function SuperAdminDashboard() {
  const { users, students, activityLogs, settings } = useAppStore();
  const activeUsers = users.filter((u) => u.status === 'active');
  const lockedUsers = users.filter((u) => u.status === 'locked');
  const usersByRole = Object.entries(ROLE_LABELS).map(([key, label]) => ({ role: label, count: users.filter((u) => u.role === key).length + (key === 'student' ? students.length - users.filter((u) => u.role === 'student').length : 0) }));
  const recentLogs = activityLogs.slice(0, 8);

  return <div className="space-y-6">
    <PageHeader title="Tổng quan" description="Bảng điều khiển Super Admin" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng người dùng" value={users.length + students.length} icon={Users} iconClassName="bg-primary/10 text-primary" />
      <StatCard title="Đang hoạt động" value={activeUsers.length} icon={UserCheck} iconClassName="bg-success/10 text-success" />
      <StatCard title="Bị khóa" value={lockedUsers.length} icon={UserX} iconClassName="bg-destructive/10 text-destructive" />
      <StatCard title="Bản ghi hoạt động" value={activityLogs.length} icon={Activity} iconClassName="bg-info/10 text-info" />
    </div>
    <Card><CardHeader><CardTitle className="text-base">Người dùng theo vai trò</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><BarChart data={usersByRole} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="role" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Bar dataKey="count" name="Số lượng" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Hoạt động gần đây</CardTitle></CardHeader><CardContent className="space-y-2">{recentLogs.map((log) => <div key={log.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0"><div><span className="font-medium text-foreground">{log.userName}</span><span className="text-muted-foreground"> • {log.action} • {log.affectedItem}</span></div><span className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</span></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Trạng thái hệ thống</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">Chế độ bảo trì</span><StatusBadge label={settings.maintenanceMode ? 'Bật' : 'Tắt'} variant={settings.maintenanceMode ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'} /></div><div className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm">Ngày công mặc định</span><span className="font-medium">{settings.defaultRequiredWorkdays} ngày</span></div></CardContent></Card>
  </div>;
}
