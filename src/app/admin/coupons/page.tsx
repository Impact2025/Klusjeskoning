'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Ticket, Plus, Edit, Trash2, Copy, Users } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import { useApp } from '@/components/app/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const ADMIN_EMAIL = 'admin@klusjeskoning.nl';

type CouponFormState = {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

const initialForm: CouponFormState = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  maxUses: 0,
  validFrom: '',
  validUntil: '',
  isActive: true,
};

export const dynamic = 'force-dynamic';

export default function CouponsManagement() {
  const router = useRouter();
  const {
    family,
    isLoading,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponStats,
    generateCouponCode,
  } = useApp();
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponStats, setCouponStats] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCouponId, setCurrentCouponId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponFormState>(initialForm);

  useEffect(() => {
    if (!family || family.email !== ADMIN_EMAIL) {
      router.push('/admin');
      return;
    }
    loadData();
  }, [family, getCoupons, getCouponStats, router]);

  const loadData = async () => {
    try {
      const [couponsData, statsData] = await Promise.all([
        getCoupons(),
        getCouponStats(),
      ]);
      setCoupons(couponsData || []);
      setCouponStats(statsData || null);
    } catch (error) {
      console.error('Error loading coupon data:', error);
    }
  };

  const handleCreateCoupon = () => {
    setCurrentCouponId(null);
    setForm(initialForm);
    setIsDialogOpen(true);
  };

  const handleEditCoupon = (coupon: any) => {
    setCurrentCouponId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses || 0,
      validFrom: coupon.validFrom ? format(coupon.validFrom, 'yyyy-MM-dd') : '',
      validUntil: coupon.validUntil ? format(coupon.validUntil, 'yyyy-MM-dd') : '',
      isActive: coupon.isActive === 1,
    });
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    if (!form.code || !form.discountValue || form.discountValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Ongeldige invoer',
        description: 'Vul een couponcode en een geldige kortingswaarde in.',
      });
      return false;
    }

    if (form.discountType === 'percentage' && form.discountValue > 100) {
      toast({
        variant: 'destructive',
        title: 'Ongeldige invoer',
        description: 'Percentage korting mag niet hoger zijn dan 100%.',
      });
      return false;
    }

    if (form.validFrom && form.validUntil && new Date(form.validFrom) >= new Date(form.validUntil)) {
      toast({
        variant: 'destructive',
        title: 'Ongeldige datums',
        description: 'De einddatum moet na de startdatum liggen.',
      });
      return false;
    }

    return true;
  };

  const handleSaveCoupon = async () => {
    if (!validateForm()) return;

    try {
      const couponData = {
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: form.discountValue,
        maxUses: form.maxUses || undefined,
        validFrom: form.validFrom ? new Date(form.validFrom) : undefined,
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
        isActive: form.isActive,
      };

      if (currentCouponId) {
        await updateCoupon(currentCouponId, couponData);
        toast({
          title: 'Succes',
          description: 'Coupon bijgewerkt.',
        });
      } else {
        await createCoupon(couponData);
        toast({
          title: 'Succes',
          description: 'Coupon aangemaakt.',
        });
      }

      setIsDialogOpen(false);
      setForm(initialForm);
      setCurrentCouponId(null);
      await loadData();
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Weet je zeker dat je deze coupon wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      return;
    }

    try {
      await deleteCoupon(couponId);
      toast({
        title: 'Succes',
        description: 'Coupon verwijderd.',
      });
      await loadData();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const result = await generateCouponCode();
      setForm(prev => ({ ...prev, code: result }));
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Gekopieerd',
      description: `Couponcode ${code} gekopieerd naar klembord.`,
    });
  };

  const formatDiscount = (coupon: any) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else {
      return `€${coupon.discountValue / 100}`;
    }
  };

  const getStatusBadge = (coupon: any) => {
    const now = new Date();
    const isExpired = coupon.validUntil && new Date(coupon.validUntil) < now;
    const isNotActive = coupon.isActive === 0;

    if (isNotActive) {
      return <Badge variant="secondary">Inactief</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Verlopen</Badge>;
    }
    return <Badge variant="default">Actief</Badge>;
  };

  if (!family || family.email !== ADMIN_EMAIL) {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Ticket className="mr-2 h-6 w-6" />
            Coupon Beheer
          </h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        {couponStats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Coupons</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{couponStats.totalCoupons}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actieve Coupons</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{couponStats.activeCoupons}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Gebruikt</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{couponStats.totalUsages}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale Kortingen</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{(couponStats.totalDiscountGiven / 100).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Coupons</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateCoupon}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{currentCouponId ? 'Bewerk Coupon' : 'Nieuwe Coupon'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={form.code}
                        onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="KK123ABC"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={handleGenerateCode}>
                        Genereer
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Beschrijving (optioneel)</Label>
                    <Input
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Bv. Welkomstkorting"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountType">Type</Label>
                      <Select
                        value={form.discountType}
                        onValueChange={(value: 'percentage' | 'fixed') =>
                          setForm((prev) => ({ ...prev, discountType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Vast bedrag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountValue">
                        Waarde ({form.discountType === 'percentage' ? '%' : 'centen'})
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        value={form.discountValue}
                        onChange={(e) => setForm((prev) => ({ ...prev, discountValue: parseInt(e.target.value) || 0 }))}
                        placeholder={form.discountType === 'percentage' ? '20' : '500'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Maximaal gebruik (0 = onbeperkt)</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={form.maxUses}
                      onChange={(e) => setForm((prev) => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validFrom">Geldig vanaf (optioneel)</Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={form.validFrom}
                        onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Geldig tot (optioneel)</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={form.validUntil}
                        onChange={(e) => setForm((prev) => ({ ...prev, validUntil: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">Actief</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveCoupon} disabled={isLoading}>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Korting</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gebruikt</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Geldig tot</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="h-6 w-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {coupon.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold">
                        {formatDiscount(coupon)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {coupon.usedCount || 0}
                        {coupon.maxUses > 0 && ` / ${coupon.maxUses}`}
                      </td>
                      <td className="px-4 py-2">
                        {getStatusBadge(coupon)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {coupon.validUntil
                          ? format(new Date(coupon.validUntil), 'dd MMM yyyy', { locale: nl })
                          : 'Onbeperkt'
                        }
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCoupon(coupon)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Geen coupons gevonden.
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