'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, TrendingUp, CreditCard } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import { useApp } from '@/components/app/AppProvider';
import { formatPrice } from '@/lib/plans';

const ADMIN_EMAIL = 'admin@klusjeskoning.nl';

export const dynamic = 'force-dynamic';

export default function FinancialManagement() {
  const router = useRouter();
  const { family, financialOverview, getFinancialOverview } = useApp();

  useEffect(() => {
    if (!family || family.email !== ADMIN_EMAIL) {
      router.push('/admin');
      return;
    }
    void getFinancialOverview();
  }, [family, getFinancialOverview, router]);

  if (!family || family.email !== ADMIN_EMAIL) {
    return <AdminLoading />;
  }

  const stats = financialOverview?.stats ?? {
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyGrowth: 0,
    avgSubscriptionValue: 0,
  };

  const recent = financialOverview?.recentSubscriptions ?? [];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Financieel overzicht</h1>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale omzet</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Totaal premium opbrengst</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actieve abonnementen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Premium gezinnen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gem. abonnementswaarde</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.avgSubscriptionValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per gezin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maandelijkse groei</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyGrowth.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">T.o.v. vorige maand</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent afgesloten abonnementen</CardTitle>
            <CardDescription>Een overzicht van de meest recente premium orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gezin</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold">{item.familyName}</div>
                      <div className="text-xs text-muted-foreground">{item.email}</div>
                    </TableCell>
                    <TableCell>{item.plan}</TableCell>
                    <TableCell>{formatPrice(Math.round(item.amount * 100))}</TableCell>
                    <TableCell>{item.interval}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Geen recente abonnementen gevonden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
