'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CreditCard, DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import { formatPrice } from '@/lib/plans';

export default function FinancialManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentSubscriptions, setRecentSubscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyGrowth: 0,
    avgSubscriptionValue: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@klusjeskoning.nl') {
        setUser(user);
        loadFinancialData();
      } else {
        router.push('/admin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadFinancialData = async () => {
    try {
      // In a real implementation, you would fetch actual financial data from your database
      // For now, we'll use mock data to demonstrate the UI
      
      // Mock statistics
      setStats({
        totalRevenue: 2450,
        activeSubscriptions: 42,
        monthlyGrowth: 12.5,
        avgSubscriptionValue: 58.33,
      });

      // Mock recent subscriptions
      const mockSubscriptions = [
        {
          id: 'sub_1',
          familyName: 'Jansen Familie',
          email: 'jansen@example.com',
          plan: 'premium',
          amount: 499,
          interval: 'monthly',
          date: new Date(Date.now() - 86400000), // 1 day ago
          status: 'active',
        },
        {
          id: 'sub_2',
          familyName: 'De Vries Gezin',
          email: 'devries@example.com',
          plan: 'premium',
          amount: 4999,
          interval: 'yearly',
          date: new Date(Date.now() - 172800000), // 2 days ago
          status: 'active',
        },
        {
          id: 'sub_3',
          familyName: 'Bakker Huis',
          email: 'bakker@example.com',
          plan: 'premium',
          amount: 499,
          interval: 'monthly',
          date: new Date(Date.now() - 259200000), // 3 days ago
          status: 'active',
        },
        {
          id: 'sub_4',
          familyName: 'Visser Gezin',
          email: 'visser@example.com',
          plan: 'premium',
          amount: 4999,
          interval: 'yearly',
          date: new Date(Date.now() - 345600000), // 4 days ago
          status: 'active',
        },
        {
          id: 'sub_5',
          familyName: 'Mulder Familie',
          email: 'mulder@example.com',
          plan: 'premium',
          amount: 499,
          interval: 'monthly',
          date: new Date(Date.now() - 432000000), // 5 days ago
          status: 'active',
        },
      ];

      setRecentSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error('Error loading financial data:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Financieel Beheer</h1>
          <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
            Terug naar Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale Omzet</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">Lifetime omzet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actieve Abonnementen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Premium gezinnen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maandelijkse Groei</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyGrowth}%</div>
              <p className="text-xs text-muted-foreground">Tov vorige maand</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gem. Abonnementswaarde</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.avgSubscriptionValue}</div>
              <p className="text-xs text-muted-foreground">Per maand</p>
            </CardContent>
          </Card>
        </div>

        {/* Premium Plans Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Premium Abonnementen</CardTitle>
            <CardDescription>
              Overzicht van de beschikbare premium abonnementen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Maandabonnement</h3>
                    <p className="text-3xl font-bold mt-2">€4,99<span className="text-lg font-normal text-gray-500">/maand</span></p>
                  </div>
                  <Badge variant="secondary">Populairst</Badge>
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Onbeperkte kinderen
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Onbeperkte klusjes
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    AI-klusassistent
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Virtueel huisdier & badges
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Donaties aan goede doelen
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <div>
                  <h3 className="text-lg font-semibold">Jaarabonnement</h3>
                  <p className="text-3xl font-bold mt-2">€49,99<span className="text-lg font-normal text-gray-500">/jaar</span></p>
                  <p className="text-sm text-gray-500 mt-1">Bespaar €9,89 per jaar</p>
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Alle voordelen van maandabonnement
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    2 maanden gratis
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Prioriteit support
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Recente Abonnementen</CardTitle>
            <CardDescription>
              Laatst geactiveerde premium abonnementen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gezin</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.familyName}</TableCell>
                    <TableCell>{subscription.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {subscription.plan} ({subscription.interval})
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(subscription.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {format(subscription.date, 'dd MMM yyyy', { locale: nl })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{subscription.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}