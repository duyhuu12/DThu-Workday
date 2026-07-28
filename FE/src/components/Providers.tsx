'use client';
import { AppStoreProvider } from '@/hooks/useAppStore';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      {children}
      <Toaster />
    </AppStoreProvider>
  );
}
