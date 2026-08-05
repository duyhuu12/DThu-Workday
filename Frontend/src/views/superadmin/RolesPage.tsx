'use client';
import { ShieldAlert, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';

const PERMISSIONS = [
  'Xem sự kiện', 'Đăng ký sự kiện', 'Hủy đăng ký', 'Xem ngày công', 'Gửi khiếu nại',
  'Tạo sự kiện', 'Duyệt đăng ký', 'Điểm danh', 'Xem báo cáo',
  'Duyệt sự kiện', 'Quản lý sinh viên', 'Quản lý lớp/khoa', 'Quản lý ngày công', 'Xử lý khiếu nại', 'Xem nhật ký',
  'Quản lý người dùng', 'Quản lý vai trò', 'Cài đặt hệ thống',
];

const ROLE_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  student: { 'Xem sự kiện': true, 'Đăng ký sự kiện': true, 'Hủy đăng ký': true, 'Xem ngày công': true, 'Gửi khiếu nại': true },
  organizer: { 'Xem sự kiện': true, 'Đăng ký sự kiện': true, 'Tạo sự kiện': true, 'Duyệt đăng ký': true, 'Điểm danh': true, 'Xem báo cáo': true },
  admin: { 'Xem sự kiện': true, 'Tạo sự kiện': true, 'Duyệt sự kiện': true, 'Duyệt đăng ký': true, 'Điểm danh': true, 'Quản lý sinh viên': true, 'Quản lý lớp/khoa': true, 'Quản lý ngày công': true, 'Xử lý khiếu nại': true, 'Xem báo cáo': true, 'Xem nhật ký': true },
  superadmin: Object.fromEntries(PERMISSIONS.map((p) => [p, true])),
};

export default function RolesPage() {
  return <div className="space-y-6">
    <PageHeader title="Vai trò & quyền" description="Phân quyền theo vai trò" />
    <Card><CardContent className="overflow-x-auto p-4"><table className="w-full text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3 text-left font-semibold text-foreground">Quyền</th>{(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <th key={r} className="px-4 py-3 text-center font-semibold text-foreground">{ROLE_LABELS[r]}</th>)}</tr></thead><tbody className="divide-y">{PERMISSIONS.map((perm) => <tr key={perm} className="hover:bg-muted/30"><td className="px-4 py-3 font-medium text-foreground">{perm}</td>{(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <td key={r} className="px-4 py-3 text-center">{ROLE_PERMISSIONS[r][perm] ? <Check className="mx-auto h-4 w-4 text-success" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/30" />}</td>)}</tr>)}</tbody></table></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <Card key={r}><CardHeader><CardTitle className="text-base">{ROLE_LABELS[r]}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{Object.values(ROLE_PERMISSIONS[r]).filter(Boolean).length}</p><p className="text-sm text-muted-foreground">quyền được cấp</p></CardContent></Card>)}</div>
  </div>;
}
