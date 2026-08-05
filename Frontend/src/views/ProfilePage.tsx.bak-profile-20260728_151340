'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Mail, Phone, Save, Shield } from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS } from '@/lib/constants';

const schema = z.object({ name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'), email: z.string().email('Email không hợp lệ'), phone: z.string().optional() });
type Form = z.infer<typeof schema>;
const initials = (name: string) => name.trim().split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();

export default function ProfilePage() {
  const { currentUser, updateUser, faculties, classes } = useAppStore();
  const student = useCurrentStudent();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: currentUser?.name ?? '', email: currentUser?.email ?? '', phone: currentUser?.phone ?? '' } });
  if (!currentUser) return null;
  async function onSubmit(data: Form) { if (!currentUser) return; setLoading(true); try { await updateUser(currentUser.id, data); toast({ title: 'Cập nhật thành công' }); } finally { setLoading(false); } }
  const fac = student ? faculties.find((f) => f.id === student.facultyId) : null;
  const cls = student ? classes.find((c) => c.id === student.classId) : null;
  return <div className="space-y-6">
    <PageHeader title="Hồ sơ cá nhân" description="Xem và cập nhật thông tin tài khoản" />
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1"><CardHeader><CardTitle className="text-base">Thông tin tài khoản</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex flex-col items-center text-center"><Avatar className="h-20 w-20 border-2 border-primary/20"><AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">{initials(currentUser.name)}</AvatarFallback></Avatar><p className="mt-3 font-semibold text-foreground">{currentUser.name}</p><p className="text-sm text-muted-foreground">{currentUser.email}</p><span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><Shield className="h-3 w-3" /> {ROLE_LABELS[currentUser.role]}</span></div>
        <Separator />
        <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Trạng thái</span><span className="font-medium text-success">Hoạt động</span></div></div>
      </CardContent></Card>
      <div className="space-y-6 lg:col-span-2">
        <Card><CardHeader><CardTitle className="text-base">Chỉnh sửa thông tin</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Họ và tên</Label><div className="relative"><UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="name" className="pl-9" {...register('name')} aria-invalid={!!errors.name} /></div>{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" className="pl-9" {...register('email')} aria-invalid={!!errors.email} /></div>{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="phone">Số điện thoại</Label><div className="relative"><Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="phone" className="pl-9" {...register('phone')} /></div></div>
            <Button type="submit" disabled={loading || !isDirty}>{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <><Save className="mr-2 h-4 w-4" /> Lưu thay đổi</>}</Button>
          </form>
        </CardContent></Card>
        {student && <Card><CardHeader><CardTitle className="text-base">Thông tin sinh viên</CardTitle></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Mã sinh viên</p><p className="mt-0.5 font-medium text-foreground">{student.studentCode}</p></div>
          <div><p className="text-xs text-muted-foreground">Lớp</p><p className="mt-0.5 font-medium text-foreground">{cls?.name ?? '—'}</p></div>
          <div><p className="text-xs text-muted-foreground">Khoa</p><p className="mt-0.5 font-medium text-foreground">{fac?.name ?? '—'}</p></div>
          <div><p className="text-xs text-muted-foreground">Ngày công tích lũy</p><p className="mt-0.5 font-medium text-foreground">{student.accumulatedWorkdays} / {student.requiredWorkdays}</p></div>
        </div></CardContent></Card>}
      </div>
    </div>
  </div>;
}
