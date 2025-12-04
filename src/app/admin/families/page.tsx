'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Crown, CreditCard } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import { useApp } from '@/components/app/AppProvider';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'admin@klusjeskoning.nl';

type FormState = {
  familyName: string;
  city: string;
  email: string;
  familyCode: string;
  password: string;
};

const initialForm: FormState = {
  familyName: '',
  city: '',
  email: '',
  familyCode: '',
  password: '',
};

export const dynamic = 'force-dynamic';

export default function FamiliesManagement() {
  const router = useRouter();
  const {
    family,
    isLoading,
    adminFamilies,
    getAdminFamilies,
    createAdminFamily,
    updateAdminFamily,
    deleteAdminFamily,
    upgradeFamilyToPro,
    downgradeFamilyAccount,
    setFamilySubscription,
    extendFamilySubscription,
  } = useApp();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [currentSubscriptionFamily, setCurrentSubscriptionFamily] = useState<any>(null);

  useEffect(() => {
    if (!family || family.email !== ADMIN_EMAIL) {
      router.push('/admin');
      return;
    }
    void getAdminFamilies();
  }, [family, getAdminFamilies, router]);

  const families = useMemo(() => adminFamilies ?? [], [adminFamilies]);

  const handleCreateFamily = () => {
    setCurrentFamilyId(null);
    setForm(initialForm);
    setIsDialogOpen(true);
  };

  const handleEditFamily = (familyId: string) => {
    const familyToEdit = families.find((item) => item.id === familyId);
    if (!familyToEdit) return;
    setCurrentFamilyId(familyToEdit.id);
    setForm({
      familyName: familyToEdit.familyName ?? '',
      city: familyToEdit.city ?? '',
      email: familyToEdit.email ?? '',
      familyCode: familyToEdit.familyCode ?? '',
      password: '',
    });
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    if (!form.familyName || !form.city || !form.email) {
      toast({
        variant: 'destructive',
        title: 'Ongeldige invoer',
        description: 'Vul alle verplichte velden in.',
      });
      return false;
    }
    if (!currentFamilyId && !form.password) {
      toast({
        variant: 'destructive',
        title: 'Wachtwoord vereist',
        description: 'Geef een tijdelijk wachtwoord op voor het nieuwe gezin.',
      });
      return false;
    }
    return true;
  };

  const handleSaveFamily = async () => {
    if (!validateForm()) return;

    try {
      if (currentFamilyId) {
        await updateAdminFamily({
          familyId: currentFamilyId,
          familyName: form.familyName,
          city: form.city,
          email: form.email,
          familyCode: form.familyCode || undefined,
          password: form.password || undefined,
        });
      } else {
        await createAdminFamily({
          familyName: form.familyName,
          city: form.city,
          email: form.email,
          password: form.password,
          familyCode: form.familyCode || undefined,
        });
      }
      setIsDialogOpen(false);
      setForm(initialForm);
      setCurrentFamilyId(null);
    } catch {
      // Fouten worden al getoond via AppProvider
    }
  };

  const handleDeleteFamily = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit gezin wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      return;
    }
    await deleteAdminFamily(id);
  };

  const handleManageSubscription = (family: any) => {
    setCurrentSubscriptionFamily(family);
    setIsSubscriptionDialogOpen(true);
  };

  const handleUpgradeToPro = async () => {
    if (!currentSubscriptionFamily) return;

    try {
      await upgradeFamilyToPro(currentSubscriptionFamily.id, {
        plan: 'premium',
        interval: 'monthly',
      });
      toast({
        title: 'Succes',
        description: `${currentSubscriptionFamily.familyName} is opgewaardeerd naar Premium.`,
      });
      setIsSubscriptionDialogOpen(false);
      await getAdminFamilies();
    } catch (error) {
      console.error('Error upgrading family:', error);
    }
  };

  const handleDowngradeAccount = async () => {
    if (!currentSubscriptionFamily) return;

    try {
      await downgradeFamilyAccount(currentSubscriptionFamily.id, { immediate: true });
      toast({
        title: 'Succes',
        description: `${currentSubscriptionFamily.familyName} is teruggezet naar Starter.`,
      });
      setIsSubscriptionDialogOpen(false);
      await getAdminFamilies();
    } catch (error) {
      console.error('Error downgrading family:', error);
    }
  };

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return 'Onbekend';
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (!family || family.email !== ADMIN_EMAIL) {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-2 h-6 w-6" />
            Beheer Gezinnen
          </h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gezinnen</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateFamily}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuw Gezin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{currentFamilyId ? 'Bewerk Gezin' : 'Nieuw Gezin'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Gezinsnaam</Label>
                    <Input
                      id="familyName"
                      value={form.familyName}
                      onChange={(e) => setForm((prev) => ({ ...prev, familyName: e.target.value }))}
                      placeholder="Voer gezinsnaam in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Stad</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Voer stad in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="naam@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="familyCode">Gezinscode</Label>
                    <Input
                      id="familyCode"
                      value={form.familyCode}
                      onChange={(e) => setForm((prev) => ({ ...prev, familyCode: e.target.value.toUpperCase() }))}
                      placeholder="Bijv. AB12CD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{currentFamilyId ? 'Nieuw wachtwoord (optioneel)' : 'Tijdelijk wachtwoord'}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimaal 6 tekens"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveFamily} disabled={isLoading}>
                    Opslaan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gezin</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kinderen</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aangemaakt</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonnement</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {families.map((fam) => {
                    const createdAt = fam.createdAt?.toDate?.();
                    return (
                      <tr key={fam.id}>
                        <td className="px-4 py-2">
                          <div className="font-semibold">{fam.familyName}</div>
                          <div className="text-xs text-muted-foreground">{fam.city}</div>
                        </td>
                        <td className="px-4 py-2 text-sm">{fam.email}</td>
                        <td className="px-4 py-2 text-sm font-mono">{fam.familyCode}</td>
                        <td className="px-4 py-2 text-sm">{fam.childrenCount}</td>
                        <td className="px-4 py-2 text-sm">{formatDate(createdAt)}</td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              fam.subscriptionPlan === 'premium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {fam.subscriptionPlan === 'premium' ? 'Premium' : 'Starter'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleManageSubscription(fam)}
                              className="h-6 w-6"
                            >
                              <Crown className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditFamily(fam.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFamily(fam.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {families.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Geen gezinnen gevonden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management Dialog */}
        <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Abonnement Beheren</DialogTitle>
            </DialogHeader>
            {currentSubscriptionFamily && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold">{currentSubscriptionFamily.familyName}</h3>
                  <p className="text-sm text-muted-foreground">{currentSubscriptionFamily.email}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentSubscriptionFamily.subscriptionPlan === 'premium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      Huidig: {currentSubscriptionFamily.subscriptionPlan === 'premium' ? 'Premium' : 'Starter'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Acties:</h4>
                  <div className="space-y-2">
                    {currentSubscriptionFamily.subscriptionPlan !== 'premium' && (
                      <Button
                        onClick={handleUpgradeToPro}
                        className="w-full"
                        disabled={isLoading}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Opwaarderen naar Premium
                      </Button>
                    )}
                    {currentSubscriptionFamily.subscriptionPlan === 'premium' && (
                      <Button
                        onClick={handleDowngradeAccount}
                        variant="destructive"
                        className="w-full"
                        disabled={isLoading}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Terugzetten naar Starter
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)}>
                Sluiten
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
