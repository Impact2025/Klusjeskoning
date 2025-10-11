'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Admin page redirects to /app on the client
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect to /app, which will handle the admin login
    router.replace('/app');
  }, [router]);

  return (
    <div className="h-screen w-screen bg-gray-200 flex items-center justify-center">
      <div className="h-full w-full max-w-lg mx-auto bg-card shadow-2xl flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    </div>
  );
}
