'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { GuestOnly } from '@/routes/RoleGuard';
import { ROLE_HOME, ROLE_LABELS, DEMO_ACCOUNTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({ email: z.string().email('Email không hợp lệ'), password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự') });
type Form = z.infer<typeof schema>;

function LoginInner() {
  const { login } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  async function onSubmit(data: Form) {
    setLoading(true);
    try { const user = await login(data.email, data.password); toast({ title: 'Đăng nhập thành công', description: `Xin chào, ${user.name}` }); router.replace(ROLE_HOME[user.role]); }
    catch (e) { toast({ title: 'Đăng nhập thất bại', description: e instanceof Error ? e.message : 'Đã có lỗi', variant: 'destructive' }); }
    finally { setLoading(false); }
  }
  return <Card className="w-full max-w-md shadow-lg">
    <CardHeader className="space-y-3 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"><GraduationCap className="h-7 w-7" /></div>
      <div><CardTitle className="text-2xl">DThU Workday</CardTitle><CardDescription className="mt-1">Đại học Đồng Tháp</CardDescription></div>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" placeholder="email@dthu.edu.vn" className="pl-9" {...register('email')} aria-invalid={!!errors.email} /></div>{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
        <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Mật khẩu</Label><Link href="/forgot-password" className="text-xs text-primary hover:underline">Quên mật khẩu?</Link></div><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type={show ? 'text' : 'password'} placeholder="••••••" className="pl-9 pr-9" {...register('password')} aria-invalid={!!errors.password} /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? 'Ẩn' : 'Hiện'}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <><LogIn className="mr-2 h-4 w-4" /> Đăng nhập</>}</Button>
      </form>
      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tài khoản demo (mật khẩu: 123456)</p>
        <div className="grid gap-2">{DEMO_ACCOUNTS.map((acc) => <button key={acc.email} type="button" onClick={() => { setValue('email', acc.email); setValue('password', '123456'); }} className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"><div><p className="font-medium text-foreground">{ROLE_LABELS[acc.role]}</p><p className="text-xs text-muted-foreground">{acc.email}</p></div><span className="text-xs text-primary">Dùng</span></button>)}</div>
      </div>
    </CardContent>
  </Card>;
}

export default function LoginPage() {
  return <GuestOnly><div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4"><LoginInner /></div></GuestOnly>;
}
