'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogOut, Users, FileText, Gift, BarChart3, CreditCard } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import { useApp } from '@/components/app/AppProvider';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const router = useRouter();
  const {
    currentScreen,
    isLoading,
    logout,
    adminStats,
    blogPosts,
    reviews,
    getAdminStats,
    getBlogPosts,
    getReviews,
    getAdminFamilies,
    adminFamilies,
  } = useApp();

  useEffect(() => {
    if (currentScreen !== 'adminDashboard') {
      router.push('/admin');
      return;
    }
    void (async () => {
      await Promise.all([getAdminStats(), getBlogPosts(), getReviews(), getAdminFamilies()]);
    })();
  }, [currentScreen, getAdminFamilies, getAdminStats, getBlogPosts, getReviews, router]);

  const familyCount = adminStats?.totalFamilies ?? adminFamilies?.length ?? 0;
  const childCount = adminStats?.totalChildren ?? 0;
  const blogCount = blogPosts?.length ?? 0;
  const reviewCount = reviews?.length ?? 0;

  const handleLogout = async () => {
    await logout();
    router.push('/admin');
  };

  if (isLoading && currentScreen !== 'adminDashboard') {
    return <AdminLoading />;
  }

  if (currentScreen !== 'adminDashboard') {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gezinnen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{familyCount}</div>
              <p className="text-xs text-muted-foreground">Actieve gezinnen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kinderen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{childCount}</div>
              <p className="text-xs text-muted-foreground">Geregistreerde kinderen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blogCount}</div>
              <p className="text-xs text-muted-foreground">Gepubliceerde artikelen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewCount}</div>
              <p className="text-xs text-muted-foreground">Gebruikersreviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Snelkoppelingen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/blog')}>
                <FileText className="mr-2 h-4 w-4" />
                Beheer Blog Posts
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/reviews')}>
                <Gift className="mr-2 h-4 w-4" />
                Beheer Reviews
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/families')}>
                <Users className="mr-2 h-4 w-4" />
                Beheer Gezinnen
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/statistics')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Bekijk Statistieken
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/financial')}>
                <CreditCard className="mr-2 h-4 w-4" />
                Financieel Beheer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recente Activiteit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium">Nieuw gezin geregistreerd</p>
                    <p className="text-sm text-muted-foreground">2 minuten geleden</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium">Nieuwe blog post gepubliceerd</p>
                    <p className="text-sm text-muted-foreground">1 uur geleden</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium">Nieuwe review toegevoegd</p>
                    <p className="text-sm text-muted-foreground">3 uur geleden</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
