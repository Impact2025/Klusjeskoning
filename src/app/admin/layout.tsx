'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/components/app/AppProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        {children}
      </div>
    </AppProvider>
  );
}