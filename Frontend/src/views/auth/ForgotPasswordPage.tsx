'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/services/api';
import dthuLogo from '../../img/logo-dthu.png';

type Step = 'email' | 'otp' | 'password' | 'success';

const stepContent: Record<Exclude<Step, 'success'>, { title: string; description: string; icon: typeof Mail }> = {
  email: { title: 'Quên mật khẩu', description: 'Nhập email đăng ký để nhận mã xác nhận', icon: Mail },
  otp: { title: 'Xác nhận OTP', description: 'Nhập mã gồm 6 chữ số đã được gửi đến email', icon: ShieldCheck },
  password: { title: 'Tạo mật khẩu mới', description: 'Mật khẩu mới sẽ được áp dụng ngay sau khi xác nhận', icon: KeyRound },
};

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  async function requestOtp(isResend = false) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast({ title: 'Email không hợp lệ', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest<{ retryAfterSeconds: number }>('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
      });
      setEmail(normalizedEmail);
      setOtp('');
      setCountdown(result.data?.retryAfterSeconds ?? 60);
      setStep('otp');
      toast({ title: isResend ? 'Đã gửi lại mã OTP' : 'Đã gửi mã OTP', description: 'Vui lòng kiểm tra hộp thư và thư mục spam.' });
    } catch (error) {
      toast({ title: 'Không thể gửi mã OTP', description: error instanceof Error ? error.message : 'Vui lòng thử lại sau', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      toast({ title: 'Vui lòng nhập đủ 6 chữ số', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest<{ resetToken: string }>('/auth/password-reset/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      if (!result.data?.resetToken) throw new Error('Máy chủ không trả phiên đặt lại mật khẩu');
      setResetToken(result.data.resetToken);
      setStep('password');
    } catch (error) {
      toast({ title: 'Xác nhận OTP thất bại', description: error instanceof Error ? error.message : 'Mã OTP không hợp lệ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast({ title: 'Mật khẩu chưa đạt yêu cầu', description: 'Cần 8–72 ký tự, có ít nhất một chữ cái và một chữ số.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Mật khẩu xác nhận không khớp', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await apiRequest('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ resetToken, password }),
      });
      setResetToken('');
      setOtp('');
      setPassword('');
      setConfirmPassword('');
      setStep('success');
    } catch (error) {
      toast({ title: 'Không thể đổi mật khẩu', description: error instanceof Error ? error.message : 'Vui lòng yêu cầu mã OTP mới', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const content = step === 'success' ? null : stepContent[step];
  const StepIcon = content?.icon ?? CheckCircle2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl shadow-md ${step === 'email' ? 'border bg-white p-1' : 'bg-primary text-primary-foreground'}`}>
            {step === 'email' ? <Image src={dthuLogo} alt="Logo Trường Đại học Đồng Tháp" className="h-full w-full object-contain" priority /> : <StepIcon className="h-7 w-7" />}
          </div>
          <div>
            <CardTitle className="text-2xl">{step === 'success' ? 'Đổi mật khẩu thành công' : content?.title}</CardTitle>
            <CardDescription className="mt-1">
              {step === 'success' ? 'Bạn có thể đăng nhập bằng mật khẩu mới' : content?.description}
            </CardDescription>
          </div>
          {step !== 'success' && <div className="mx-auto flex w-40 items-center gap-1.5 pt-1">
            {(['email', 'otp', 'password'] as const).map((item, index) => {
              const activeIndex = ['email', 'otp', 'password'].indexOf(step);
              return <span key={item} className={`h-1.5 flex-1 rounded-full ${index <= activeIndex ? 'bg-primary' : 'bg-muted'}`} />;
            })}
          </div>}
        </CardHeader>

        <CardContent>
          {step === 'email' && <form onSubmit={(event) => { event.preventDefault(); void requestOtp(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email đăng ký</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="email@dthu.edu.vn" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</Button>
            <Button asChild variant="ghost" className="w-full"><Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập</Link></Button>
          </form>}

          {step === 'otp' && <div className="space-y-5">
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center text-sm text-muted-foreground">
              Mã đã gửi đến <span className="font-medium text-foreground">{email.replace(/^(.{2}).*(@.*)$/, '$1***$2')}</span>
            </div>
            <div className="space-y-2">
              <Label className="block text-center">Mã xác nhận</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp} inputMode="numeric" pattern="[0-9]*" containerClassName="justify-center">
                <InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="h-12 w-12 text-lg font-semibold" />)}</InputOTPGroup>
              </InputOTP>
              <p className="text-center text-xs text-muted-foreground">Mã có hiệu lực trong 10 phút và tối đa 5 lần nhập.</p>
            </div>
            <Button className="w-full" onClick={verifyOtp} disabled={loading || otp.length !== 6}>{loading ? 'Đang xác nhận...' : 'Xác nhận mã OTP'}</Button>
            <div className="flex items-center justify-between text-sm">
              <Button variant="ghost" size="sm" className="px-0" onClick={() => setStep('email')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Đổi email</Button>
              <Button variant="ghost" size="sm" className="px-0 text-primary" disabled={loading || countdown > 0} onClick={() => void requestOtp(true)}>
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
              </Button>
            </div>
          </div>}

          {step === 'password' && <form onSubmit={(event) => { event.preventDefault(); void changePassword(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" autoFocus />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <p className="text-xs text-muted-foreground">Từ 8–72 ký tự, có ít nhất một chữ cái và một chữ số.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Nhập lại mật khẩu mới</Label>
              <Input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}</Button>
          </form>}

          {step === 'success' && <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="h-7 w-7" /></div>
            <p className="text-sm text-muted-foreground">Mật khẩu của tài khoản <span className="font-medium text-foreground">{email}</span> đã được cập nhật.</p>
            <Button asChild className="w-full"><Link href="/login">Đăng nhập ngay</Link></Button>
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
