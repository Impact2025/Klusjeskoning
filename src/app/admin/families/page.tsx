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
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
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
  } = useApp();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

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
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Geen gezinnen gevonden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
