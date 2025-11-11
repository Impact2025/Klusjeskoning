'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Star, Sparkles } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import { useApp } from '@/components/app/AppProvider';

const ADMIN_EMAIL = 'admin@klusjeskoning.nl';

export const dynamic = 'force-dynamic';

export default function StatisticsPage() {
  const router = useRouter();
  const {
    family,
    adminStats,
    adminFamilies,
    goodCauses,
    getAdminStats,
    getAdminFamilies,
    getGoodCauses,
  } = useApp();

  useEffect(() => {
    if (!family || family.email !== ADMIN_EMAIL) {
      router.push('/admin');
      return;
    }
    void Promise.all([getAdminStats(), getAdminFamilies(), getGoodCauses()]);
  }, [family, getAdminFamilies, getAdminStats, getGoodCauses, router]);

  if (!family || family.email !== ADMIN_EMAIL) {
    return <AdminLoading />;
  }

  const stats = adminStats ?? {
    totalFamilies: adminFamilies?.length ?? 0,
    totalChildren: 0,
    totalPointsEver: 0,
    totalDonationPoints: 0,
  };

  const families = adminFamilies ?? [];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Statistieken</h1>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal gezinnen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFamilies}</div>
              <p className="text-xs text-muted-foreground">Actieve accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal kinderen</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChildren}</div>
              <p className="text-xs text-muted-foreground">Registraties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goede doelen</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goodCauses?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">Beschikbare acties</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recente gezinnen</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gezin</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Kinderen</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {families.slice(0, 10).map((fam) => (
                  <TableRow key={fam.id}>
                    <TableCell>
                      <div className="font-semibold">{fam.familyName}</div>
                      <div className="text-xs text-muted-foreground">{fam.city}</div>
                    </TableCell>
                    <TableCell>{fam.email}</TableCell>
                    <TableCell>{fam.childrenCount}</TableCell>
                    <TableCell>{fam.subscriptionPlan ?? 'starter'}</TableCell>
                    <TableCell>{fam.subscriptionStatus ?? 'inactive'}</TableCell>
                  </TableRow>
                ))}
                {families.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Geen gezinnen gevonden.
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
