'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dthu-auth');
      if (raw) {
        const user = JSON.parse(raw);
        const home: Record<string, string> = {
          student: '/student/dashboard', organizer: '/organizer/dashboard',
          admin: '/admin/dashboard', superadmin: '/superadmin/dashboard',
        };
        router.replace(home[user.role] ?? '/login');
        return;
      }
    } catch {}
    router.replace('/login');
  }, [router]);
  return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
}
