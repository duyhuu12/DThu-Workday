'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  LogIn,
  Lock,
  UserRound,
} from 'lucide-react';
import dthuLogo from '../../img/logo-dthu.png';
import { useAppStore } from '@/hooks/useAppStore';
import { GuestOnly } from '@/routes/RoleGuard';
import { ROLE_HOME, ROLE_LABELS, DEMO_ACCOUNTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Vui lòng nhập email hoặc mã sinh viên'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type Form = z.infer<typeof schema>;

function LoginInner() {
  const { login } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const showDemoAccounts =
    process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true';
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || '123456';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  async function onSubmit(data: Form) {
    setLoading(true);
    try {
      const user = await login(data.identifier, data.password);
      toast({
        title: 'Đăng nhập thành công',
        description: `Xin chào, ${user.name}`,
      });
      router.replace(ROLE_HOME[user.role]);
    } catch (error) {
      toast({
        title: 'Đăng nhập thất bại',
        description:
          error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-white/30 dark:border-white/10 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] ring-1 ring-white/40 dark:ring-white/10 rounded-3xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white p-1 shadow-lg shadow-primary/20">
          <Image src={dthuLogo} alt="Logo Trường Đại học Đồng Tháp" className="h-full w-full object-contain" priority />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">Đăng Kí Lao Động Sinh Viên</CardTitle>
          <CardDescription className="mt-1 font-medium text-muted-foreground">
            Trường Đại học Đồng Tháp
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-sm font-semibold">Email hoặc mã sinh viên</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="student@dthu.edu.vn hoặc 00234..."
                className="pl-9 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-white/40 dark:border-white/10 focus:bg-white/90 dark:focus:bg-slate-800/90 transition-all duration-200"
                {...register('identifier')}
                aria-invalid={!!errors.identifier}
              />
            </div>
            {errors.identifier && (
              <p className="text-xs text-destructive">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold">Mật khẩu</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••"
                className="pl-9 pr-9 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-white/40 dark:border-white/10 focus:bg-white/90 dark:focus:bg-slate-800/90 transition-all duration-200"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all duration-200" disabled={loading}>
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Đăng nhập
              </>
            )}
          </Button>
        </form>

        {showDemoAccounts && (
          <div className="mt-6 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tài khoản demo
            </p>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setValue('identifier', account.email);
                    setValue('password', demoPassword);
                  }}
                  className="flex items-center justify-between rounded-xl border border-white/30 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 px-3 py-2 text-left text-sm transition-all duration-200 hover:border-primary hover:bg-primary/10"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {ROLE_LABELS[account.role]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {account.email}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">Dùng</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <GuestOnly>
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
        {/* Campus Background Image for Fullscreen Glassmorphism Context */}
        <Image
          src="/dthu.jpg"
          alt="Đại học Đồng Tháp"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-1000 scale-105"
        />
        {/* Smooth Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-950/80 backdrop-blur-[2px]" />

        {/* Outer Grid Layout */}
        <div className="relative z-10 flex w-full min-h-screen">
          {/* Left Column: Branding Text (Visible on lg) */}
          <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white p-1 shadow-lg">
                <Image src={dthuLogo} alt="Logo Trường Đại học Đồng Tháp" className="h-full w-full object-contain" priority />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Bộ Giáo Dục Và Đào Tạo</h3>
                <p className="text-xs text-white/70">Trường Đại học Đồng Tháp</p>
              </div>
            </div>

            <div className="space-y-4 max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/15">
                Cổng Quản Lý Ngày Công
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
                Quản lý & Đăng ký ngày công lao động trực quan
              </h1>
              <p className="text-sm text-white/80 leading-relaxed">
                Hệ thống hỗ trợ sinh viên và cán bộ theo dõi chỉ tiêu, đăng ký tham gia sự kiện và cập nhật lịch làm việc dễ dàng.
              </p>
            </div>

            <p className="text-xs text-white/50">
              © 2026 Đại học Đồng Tháp. All rights reserved.
            </p>
          </div>

          {/* Right Column: Liquid Glass Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
            <LoginInner />
          </div>
        </div>
      </div>
    </GuestOnly>
  );
}
