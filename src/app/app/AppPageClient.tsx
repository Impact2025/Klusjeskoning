'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from '@/components/app/AppProvider';
import LandingScreen from '@/components/app/screens/LandingScreen';
import ParentLoginScreen from '@/components/app/screens/ParentLoginScreen';
import ChildLoginScreen from '@/components/app/screens/ChildLoginScreen';
import ChildProfileSelectScreen from '@/components/app/screens/ChildProfileSelectScreen';
import ChildPinScreen from '@/components/app/screens/ChildPinScreen';
import ChildDashboard from '@/components/app/screens/ChildDashboard';
import RecoverCodeScreen from '@/components/app/screens/RecoverCodeScreen';
import QrScannerScreen from '@/components/app/screens/QrScannerScreen';
import AdminLoginScreen from '@/components/app/screens/AdminLoginScreen';
import nextDynamic from 'next/dynamic';
import type { Screen } from '@/lib/types';

// Dynamically import components that might have Firebase issues
const ParentDashboard = nextDynamic(() => import('@/components/app/screens/ParentDashboard'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ),
});

const AdminDashboard = nextDynamic(() => import('@/components/app/screens/AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ),
});

function AppContent() {
  const { currentScreen, isLoading } = useApp();

  const screens: Record<Screen, React.ReactNode> = {
    landing: <LandingScreen />,
    parentLogin: <ParentLoginScreen />,
    parentDashboard: <ParentDashboard />,
    childLogin: <ChildLoginScreen />,
    childProfileSelect: <ChildProfileSelectScreen />,
    childPin: <ChildPinScreen />,
    childDashboard: <ChildDashboard />,
    recoverCode: <RecoverCodeScreen />,
    qrScanner: <QrScannerScreen />,
    adminLogin: <AdminLoginScreen />,
    adminDashboard: <AdminDashboard />,
  };

  return (
    <div className="h-screen w-screen bg-gray-200 flex items-center justify-center overscroll-y-contain">
      <div id="app" className="h-full w-full max-w-lg mx-auto bg-card shadow-2xl relative overflow-hidden">
        {isLoading && (
          <div id="loading" className="absolute inset-0 bg-card/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}
        <div className="h-full w-full">{screens[currentScreen]}</div>
      </div>
    </div>
  );
}

export function AppPageClient() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-gray-200 flex items-center justify-center">
          <div className="h-full w-full max-w-lg mx-auto bg-card shadow-2xl flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Suspense>
  );
}

export default AppPageClient;