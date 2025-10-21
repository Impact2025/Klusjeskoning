'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogOut, Users, FileText, Gift, BarChart3, CreditCard } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import AdminLoading from '@/components/admin/AdminLoading';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    families: 0,
    children: 0,
    blogPosts: 0,
    reviews: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@klusjeskoning.nl') {
        setUser(user);
        // Load real stats from Firebase
        loadStats();
      } else {
        router.push('/admin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadStats = async () => {
    try {
      // Fetch families data
      const familiesQuery = query(collection(db, 'families'));
      const familiesSnapshot = await getDocs(familiesQuery);
      
      // Calculate family statistics
      let totalChildren = 0;
      familiesSnapshot.forEach(doc => {
        const data = doc.data();
        totalChildren += data.childrenCount || 0;
      });
      
      // Fetch blog posts count
      const blogQuery = query(collection(db, 'blogPosts'));
      const blogSnapshot = await getDocs(blogQuery);
      
      // Fetch reviews count
      const reviewsQuery = query(collection(db, 'reviews'));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      // Update stats with real data
      setStats({
        families: familiesSnapshot.size,
        children: totalChildren,
        blogPosts: blogSnapshot.size,
        reviews: reviewsSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <AdminLoading />;
  }

  if (!user) {
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
              <div className="text-2xl font-bold">{stats.families}</div>
              <p className="text-xs text-muted-foreground">Actieve gezinnen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kinderen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.children}</div>
              <p className="text-xs text-muted-foreground">Geregistreerde kinderen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.blogPosts}</div>
              <p className="text-xs text-muted-foreground">Gepubliceerde artikelen</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviews}</div>
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
