'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/components/app/AppProvider';
import LandingScreen from '@/components/app/screens/LandingScreen';
import ParentLoginScreen from '@/components/app/screens/ParentLoginScreen';
import EmailVerificationScreen from '@/components/app/screens/EmailVerificationScreen';
import FamilySetupWizard from '@/components/app/setup/FamilySetupWizard';
import ChildLoginScreen from '@/components/app/screens/ChildLoginScreen';
import ChildProfileSelectScreen from '@/components/app/screens/ChildProfileSelectScreen';
import ChildPinScreen from '@/components/app/screens/ChildPinScreen';
import ChildDashboard from '@/components/app/screens/ChildDashboard';
import RecoverCodeScreen from '@/components/app/screens/RecoverCodeScreen';
import QrScannerScreen from '@/components/app/screens/QrScannerScreen';
import AdminLoginScreen from '@/components/app/screens/AdminLoginScreen';
import TourGuide from '@/components/app/TourGuide';
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
  const { currentScreen, isLoading, family, addChild, addChore, addReward, setScreen, showTour, closeTour } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Add keyboard shortcut to manually trigger tour for debugging
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        console.log('Manual tour trigger activated');
        localStorage.setItem('manual_tour_trigger', 'true');
        window.location.reload(); // Reload to trigger tour logic
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFamilySetupComplete = async (data: {
    children: { name: string; age: number }[];
    model: 'linked' | 'separate';
    chores: any[];
    allowances: { [childName: string]: number };
  }) => {
    try {
      // Create all children first
      for (const child of data.children) {
        await addChild(child.name, '1234', '🐼'); // Default PIN and avatar
      }

      // Small delay to ensure family state is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now get the created children from the updated family state
      const createdChildren = family?.children.filter(c =>
        data.children.some(childData => childData.name === c.name)
      ) || [];

      // Create chores
      for (const chore of data.chores) {
        const childIds = createdChildren
          .filter(c => chore.assignedTo.includes(c.name))
          .map(c => c.id);
        await addChore(chore.name, chore.points, childIds);
      }

      // Create rewards (allowances as money rewards)
      for (const [childName, allowance] of Object.entries(data.allowances)) {
        const child = createdChildren.find(c => c.name === childName);
        if (child) {
          await addReward(`${childName}'s zakgeld`, allowance, 'money', [child.id]);
        }
      }

      // Navigate to parent dashboard
      setScreen('parentDashboard');
    } catch (error) {
      console.error('Failed to complete family setup:', error);
    }
  };

  // Handle checkout parameter
  useEffect(() => {
    const checkout = searchParams?.get('checkout');
    if (checkout === 'premium') {
      if (family) {
        // User is logged in, redirect to upgrade page
        router.replace('/app/upgrade');
      } else {
        // User is not logged in, stay on current page (login screen)
        // The checkout parameter will be preserved for after login
      }
    }
  }, [searchParams, router, family]);

  const screens: Record<Screen, React.ReactNode> = {
    landing: <LandingScreen />,
    parentLogin: <ParentLoginScreen />,
    emailVerification: <EmailVerificationScreen />,
    familySetup: <FamilySetupWizard onComplete={handleFamilySetupComplete} />,
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
    <>
      <div className="h-screen w-screen bg-slate-100 flex items-center justify-center overscroll-y-contain">
        <div id="app" className="h-full w-full max-w-lg mx-auto bg-white shadow-2xl shadow-slate-900/10 relative overflow-hidden md:rounded-3xl md:my-4 md:h-[calc(100vh-2rem)] md:border md:border-slate-200">
          {isLoading && (
            <div id="loading" className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 backdrop-blur-sm">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          <div className="h-full w-full">{screens[currentScreen]}</div>
        </div>
      </div>
      {/* TourGuide outside overflow-hidden container */}
      <TourGuide isOpen={showTour} onClose={closeTour} />
    </>
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
      <AppContent />
    </Suspense>
  );
}

export default AppPageClient;