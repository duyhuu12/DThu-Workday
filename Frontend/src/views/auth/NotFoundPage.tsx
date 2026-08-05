'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function NotFoundPage() {
  const router = useRouter();
  return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"><FileQuestion className="h-10 w-10" /></div>
    <h1 className="mt-6 text-3xl font-bold text-foreground">404</h1><p className="mt-2 text-lg font-semibold text-foreground">Không tìm thấy trang</p>
    <p className="mt-1 max-w-md text-sm text-muted-foreground">Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.</p>
    <div className="mt-6 flex gap-3"><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button><Button asChild><Link href="/login"><Home className="mr-2 h-4 w-4" /> Về trang chủ</Link></Button></div>
  </div>;
}
