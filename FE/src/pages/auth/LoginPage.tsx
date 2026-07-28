'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GraduationCap,
  Eye,
  EyeOff,
  LogIn,
  Lock,
  UserRound,
} from 'lucide-react';
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
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <CardTitle className="text-2xl">DThU Workday</CardTitle>
          <CardDescription className="mt-1">
            Đại học Đồng Tháp
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email hoặc mã sinh viên</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="student@dthu.edu.vn hoặc 5720..."
                className="pl-9"
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
              <Label htmlFor="password">Mật khẩu</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
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
                className="pl-9 pr-9"
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

          <Button type="submit" className="w-full" disabled={loading}>
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
          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
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
                  className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {ROLE_LABELS[account.role]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {account.email}
                    </p>
                  </div>
                  <span className="text-xs text-primary">Dùng</span>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <LoginInner />
      </div>
    </GuestOnly>
  );
}
