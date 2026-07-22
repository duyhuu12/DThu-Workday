'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, GraduationCap, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { delay } from '@/lib/config';

const schema = z.object({ email: z.string().email('Email không hợp lệ') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  async function onSubmit(data: Form) { setLoading(true); try { await delay(500); setSubmitted(true); toast({ title: 'Đã gửi yêu cầu', description: 'Vui lòng kiểm tra email.' }); } finally { setLoading(false); } }
  return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-3 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"><GraduationCap className="h-7 w-7" /></div><div><CardTitle className="text-2xl">Quên mật khẩu</CardTitle><CardDescription className="mt-1">Nhập email để nhận hướng dẫn đặt lại mật khẩu</CardDescription></div></CardHeader>
      <CardContent>{submitted ? <div className="space-y-4 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"><MailCheck className="h-6 w-6" /></div><p className="text-sm text-muted-foreground">Yêu cầu đặt lại mật khẩu đã được gửi (demo).</p><Button asChild className="w-full"><Link href="/login">Quay lại đăng nhập</Link></Button></div> :
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email đăng ký</Label><Input id="email" type="email" placeholder="email@dthu.edu.vn" {...register('email')} aria-invalid={!!errors.email} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div><Button type="submit" className="w-full" disabled={loading}>{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : 'Gửi yêu cầu'}</Button><Button asChild variant="ghost" className="w-full"><Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Link></Button></form>}
      </CardContent>
    </Card>
  </div>;
}
