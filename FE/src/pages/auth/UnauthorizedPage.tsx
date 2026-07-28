'use client';
import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function UnauthorizedPage() {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive"><ShieldX className="h-10 w-10" /></div>
    <h1 className="mt-6 text-3xl font-bold text-foreground">403</h1><p className="mt-2 text-lg font-semibold text-foreground">Không có quyền truy cập</p>
    <p className="mt-1 max-w-md text-sm text-muted-foreground">Bạn không có quyền truy cập trang này. Vui lòng đăng nhập bằng tài khoản phù hợp.</p>
    <Button asChild className="mt-6"><Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập</Link></Button>
  </div>;
}
