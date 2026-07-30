'use client';
import { useEffect, useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
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
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: currentUser?.name ?? '', email: currentUser?.email ?? '', phone: currentUser?.phone ?? '' } });

  useEffect(() => {
    if (!currentUser) return;
    reset({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone ?? '',
    });
  }, [currentUser, reset]);

  if (!currentUser) return null;

  async function onSubmit(data: Form) {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateUser(currentUser.id, data);
      reset(data);
      toast({ title: 'Cập nhật thành công', description: 'Thông tin đã được cập nhật.' });
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const fac = student ? faculties.find((f) => f.id === student.facultyId) : null;
  const cls = student ? classes.find((c) => c.id === student.classId) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Hồ sơ cá nhân" description="Xem và cập nhật thông tin tài khoản của bạn" />

      {/* Banner & User Quick Info Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-sm">
        {/* Banner with modern gradient */}
        <div className="h-32 w-full bg-gradient-to-r from-primary/20 via-primary/5 to-info/20" />

        {/* User Info Wrapper */}
        <div className="relative px-6 pb-6 pt-0 sm:flex sm:items-end sm:space-x-5">
          <div className="flex">
            <Avatar className="-mt-14 h-24 w-24 rounded-full border-4 border-card shadow-lg ring-1 ring-primary/10">
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/30 text-2xl font-bold text-primary">
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:space-x-6 sm:pb-1">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground truncate">{currentUser.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {currentUser.email}
                </span>
                {currentUser.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> {currentUser.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Shield className="h-3.5 w-3.5" /> {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
              <span className="inline-flex items-center justify-center rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success border border-success/20">
                ● Tài khoản Hoạt động
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Student Specific Stats & Info if applicable */}
        {student ? (
          <Card className="lg:col-span-1 border-primary/10 flex flex-col justify-between overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" /> Thông tin sinh viên
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1">
              {/* Stats Progress Circle/Card */}
              <div className="rounded-xl bg-primary/5 p-4 border border-primary/10 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Tiến độ ngày công</span>
                  <span className="font-bold text-primary">
                    {student.accumulatedWorkdays} / {student.requiredWorkdays} ngày
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (student.accumulatedWorkdays / student.requiredWorkdays) * 100)}
                  className="h-2.5"
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {student.accumulatedWorkdays >= student.requiredWorkdays
                    ? "🎉 Bạn đã hoàn thành chỉ tiêu ngày công trong học kỳ này!"
                    : `Bạn cần tích lũy thêm ${Math.max(0, student.requiredWorkdays - student.accumulatedWorkdays)} ngày công.`
                  }
                </p>
              </div>

              {/* Grid of detail items */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Mã sinh viên</span>
                  <p className="font-semibold text-foreground">{student.studentCode}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Lớp sinh hoạt</span>
                  <p className="font-semibold text-foreground truncate">{cls?.name ?? '—'}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Khoa quản lý</span>
                  <p className="font-semibold text-foreground truncate">{fac?.name ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Niên khóa</span>
                  <p className="font-semibold text-foreground">{student.schoolYear || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Giới tính</span>
                  <p className="font-semibold text-foreground">
                    {student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : '—'}
                  </p>
                </div>
                {student.birthDate && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Ngày sinh</span>
                    <p className="font-semibold text-foreground">
                      {new Date(student.birthDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
                {student.hometown && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Quê quán</span>
                    <p className="font-semibold text-foreground truncate">{student.hometown}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-1 border-primary/10 p-6 flex flex-col justify-center items-center text-center shadow-sm">
            <Shield className="h-12 w-12 text-primary/50 mb-3" />
            <h3 className="font-bold text-foreground text-lg">Hồ sơ cán bộ</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
              Tài khoản này có vai trò quản trị hệ thống. Không liên kết với dữ liệu học tập của sinh viên.
            </p>
          </Card>
        )}

        {/* Right column: Edit Profile Form */}
        <Card className="lg:col-span-2 border-primary/10 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Chỉnh sửa thông tin liên hệ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">Họ và tên</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    className="pl-9 bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Địa chỉ Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9 bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">Số điện thoại liên hệ</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-9 bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                    {...register('phone')}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || !isDirty}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
