'use client';

import { AppProvider } from '@/components/app/AppProvider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProvider>{children}</AppProvider>;
}
