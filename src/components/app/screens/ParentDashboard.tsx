'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, Copy, QrCode, Plus, ListOrdered, Sparkles, Medal, Trash2, Check, X, Bell, Pencil, Gift } from 'lucide-react';
import { WhatsAppIcon } from '@/lib/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, PLAN_DEFINITIONS } from '@/lib/plans';
import AddChildModal from '../models/AddChildModal';
import AddChoreModal from '../models/AddChoreModal';
import AddRewardModal from '../models/AddRewardModal';
import EditChildModal from '../models/EditChildModal';
import EditChoreModal from '../models/EditChoreModal';
import EditRewardModal from '../models/EditRewardModal';
import TopChoresModal from '../models/TopChoresModal';
import TopRewardsModal from '../models/TopRewardsModal';
import GeminiChoreIdeasModal from '../models/GeminiChoreIdeasModal';
import QrCodeModal from '../models/QrCodeModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import type { Child, Chore, Reward, BillingInterval } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Only import components that might cause SSR issues dynamically
import dynamic from 'next/dynamic';
const AddChildModalDynamic = dynamic(() => import('../models/AddChildModal'), { ssr: false });
const AddChoreModalDynamic = dynamic(() => import('../models/AddChoreModal'), { ssr: false });
const AddRewardModalDynamic = dynamic(() => import('../models/AddRewardModal'), { ssr: false });
const EditChildModalDynamic = dynamic(() => import('../models/EditChildModal'), { ssr: false });
const EditChoreModalDynamic = dynamic(() => import('../models/EditChoreModal'), { ssr: false });
const EditRewardModalDynamic = dynamic(() => import('../models/EditRewardModal'), { ssr: false });
const TopChoresModalDynamic = dynamic(() => import('../models/TopChoresModal'), { ssr: false });
const TopRewardsModalDynamic = dynamic(() => import('../models/TopRewardsModal'), { ssr: false });
const GeminiChoreIdeasModalDynamic = dynamic(() => import('../models/GeminiChoreIdeasModal'), { ssr: false });
const QrCodeModalDynamic = dynamic(() => import('../models/QrCodeModal'), { ssr: false });

export default function ParentDashboard() {
  const {
    family,
    logout,
    approveChore,
    rejectChore,
    markRewardAsGiven,
    deleteItem,
    saveRecoveryEmail,
    goodCauses,
    activePlan,
    planDefinition,
    isPremium,
    monthlyChoreUsage,
    startPremiumCheckout,
    confirmPremiumCheckout,
    canAccessFeature,
    isLoading,
  } = useApp();
  const { toast } = useToast();
  
  const [isAddChildModalOpen, setAddChildModalOpen] = useState(false);
  const [isAddChoreModalOpen, setAddChoreModalOpen] = useState(false);
  const [isAddRewardModalOpen, setAddRewardModalOpen] = useState(false);

  const [isEditChildModalOpen, setEditChildModalOpen] = useState(false);
  const [isEditChoreModalOpen, setEditChoreModalOpen] = useState(false);
  const [isEditRewardModalOpen, setEditRewardModalOpen] = useState(false);

  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [isTopChoresModalOpen, setTopChoresModalOpen] = useState(false);
  const [isTopRewardsModalOpen, setTopRewardsModalOpen] = useState(false);
  const [isGeminiModalOpen, setGeminiModalOpen] = useState(false);
  const [isQrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  // Initialize recovery email when family loads
  useEffect(() => {
    if (family?.recoveryEmail) {
      setRecoveryEmail(family.recoveryEmail);
    }
  }, [family]);

  const handleUpgrade = useCallback(async (interval: BillingInterval) => {
    const paymentUrl = await startPremiumCheckout(interval);
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  }, [startPremiumCheckout]);

  useEffect(() => {
    const checkoutStatus = searchParams?.get('checkout');
    const orderId = searchParams?.get('order_id');
    const intervalParam = (searchParams?.get('interval') as BillingInterval | null) ?? 'monthly';

    // Check for pending checkout from sessionStorage
    const pendingCheckout = sessionStorage.getItem('pendingCheckout');

    if (pendingCheckout === 'premium') {
      sessionStorage.removeItem('pendingCheckout');
      handleUpgrade('monthly');
      return;
    }

    if (!checkoutStatus) {
      return;
    }

    if (checkoutStatus === 'premium') {
      // User clicked "Word Gezin+" - start checkout flow
      router.replace('/app');
      handleUpgrade('monthly');
    } else if (checkoutStatus === 'success' && orderId && processingOrder !== orderId) {
      setProcessingOrder(orderId);
      (async () => {
        await confirmPremiumCheckout(orderId, intervalParam);
        router.replace('/app');
      })();
    } else if (checkoutStatus === 'cancel') {
      toast({ title: 'Upgrade geannuleerd', description: 'Je blijft op het gratis plan.' });
      router.replace('/app');
    }
  }, [searchParams, confirmPremiumCheckout, router, toast, processingOrder, handleUpgrade]);

  if (!family) return null;

  const { familyCode, children, chores, rewards, pendingRewards } = family;
  const submittedChores = chores.filter(c => c.status === 'submitted');
  const maxChildren = planDefinition.limits.maxChildren;
  const canAddMoreChildren = typeof maxChildren !== 'number' || children.length < maxChildren;
  const choreQuota = planDefinition.limits.monthlyChoreQuota;
  const choreQuotaReached = typeof choreQuota === 'number' && monthlyChoreUsage >= choreQuota;
  const renewalLabel = family.subscription?.renewalDate && typeof (family.subscription.renewalDate as any).toDate === 'function'
    ? format((family.subscription.renewalDate as any).toDate(), 'dd MMMM yyyy', { locale: nl })
    : null;
  const currentIntervalLabel = family.subscription?.interval === 'yearly'
    ? 'Jaarplan'
    : family.subscription?.interval === 'monthly'
      ? 'Maandplan'
      : null;
  const aiFeatureEnabled = canAccessFeature('aiHelper');
  const donationsEnabled = canAccessFeature('donations');
  const premiumPlan = PLAN_DEFINITIONS.premium;
  
  const now = Timestamp.now();
  const activeCause = goodCauses?.find(c => c.startDate <= now && c.endDate >= now);

  const copyFamilyCode = () => {
    navigator.clipboard.writeText(familyCode);
    toast({ title: 'Gekopieerd!', description: 'De gezinscode is gekopieerd.' });
  };

  const inviteChildViaWhatsApp = (child: Child) => {
    const message = `Hoi ${child.name}! 🌟 Tijd om een echte KlusjesKoning te worden! Met deze app kun je klusjes doen, punten verdienen en superleuke beloningen vrijspelen. Doe je mee?

Hier zijn je inloggegevens:
Gezinscode: ${familyCode}
Jouw pincode: ${child.pin}

Klik op de link om de app te openen en direct te beginnen: [LINK NAAR APP]

Heel veel plezier! 🚀`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleSaveRecoveryEmail = () => {
    if (recoveryEmail && /^\S+@\S+\.\S+$/.test(recoveryEmail)) {
      saveRecoveryEmail(recoveryEmail);
    } else {
      toast({ variant: 'destructive', title: 'Fout', description: 'Voer een geldig e-mailadres in.' });
    }
  };

  const getAssignedText = (item: { assignedTo: string[] }) => {
    if (!item.assignedTo || item.assignedTo.length === 0) return 'Voor iedereen';
    const names = item.assignedTo.map(id => children.find(c => c.id === id)?.name.split(' ')[0]).filter(Boolean);
    return names.length > 0 ? `Voor: ${names.join(', ')}` : 'Niemand?';
  };

  const openEditChildModal = (child: Child) => {
    setEditingChild(child);
    setEditChildModalOpen(true);
  };
  const openEditChoreModal = (chore: Chore) => {
    setEditingChore(chore);
    setEditChoreModalOpen(true);
  };
  const openEditRewardModal = (reward: Reward) => {
    setEditingReward(reward);
    setEditRewardModalOpen(true);
  };


  return (
    <div className="h-full flex flex-col bg-slate-50">
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md">
        <h2 className="font-brand text-2xl">Dashboard</h2>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut />
        </Button>
      </header>
      <ScrollArea className="flex-grow">
        <main className="p-4 space-y-6">
          <Card className="bg-blue-50 border-l-4 border-primary shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-blue-900">Gezinscode: <span className="font-mono bg-white px-3 py-1 rounded-md border text-lg">{familyCode}</span></p>
                  <p className="text-sm text-blue-700 mt-2">Deel deze code met je kinderen om ze in te laten loggen.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={copyFamilyCode} className="bg-white border-blue-200 hover:bg-blue-100 text-blue-700">
                    <Copy className="h-4 w-4 mr-1" /> Kopieer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQrCodeModalOpen(true)} className="bg-white border-blue-200 hover:bg-blue-100 text-blue-700">
                    <QrCode className="h-4 w-4 mr-1" /> QR Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simplified plan information card without upgrade buttons */}
          <Card className="border border-primary/20 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{planDefinition.label}</CardTitle>
                  <CardDescription>{planDefinition.tagline}</CardDescription>
                </div>
                <Badge variant={isPremium ? 'default' : 'secondary'}>{isPremium ? 'Actief' : 'Gratis plan'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Maandelijks</p>
                  <p className="text-lg font-semibold">{formatPrice(planDefinition.priceMonthlyCents)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jaarlijks</p>
                  <p className="text-lg font-semibold">{formatPrice(planDefinition.priceYearlyCents)}</p>
                </div>
                <div className="space-y-1">
                  {currentIntervalLabel && <p className="text-sm font-medium text-slate-700">{currentIntervalLabel}</p>}
                  {renewalLabel && <p className="text-xs text-muted-foreground">Verlenging op {renewalLabel}</p>}
                </div>
              </div>

              {planDefinition.includedHighlights.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Inclusief:</p>
                  <ul className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    {planDefinition.includedHighlights.map((highlight) => (
                      <li key={highlight}>• {highlight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!isPremium && planDefinition.missingHighlights.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Mis je nu:</p>
                  <ul className="grid gap-1 text-sm text-slate-500 sm:grid-cols-2">
                    {planDefinition.missingHighlights.map((highlight) => (
                      <li key={highlight}>✦ {highlight}</li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <Button size="sm" onClick={() => router.push('/app/upgrade')} className="w-full">
                      Upgrade naar Gezin+ · {formatPrice(premiumPlan.priceMonthlyCents)}/mnd
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {typeof maxChildren === 'number' ? (
                  <span>{children.length}/{maxChildren} kinderen</span>
                ) : (
                  <span>Onbeperkte kinderen</span>
                )}
                {typeof choreQuota === 'number' ? (
                  <span>{monthlyChoreUsage}/{choreQuota} klusjes deze maand</span>
                ) : (
                  <span>Onbeperkte klusjes</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          {activeCause && (
             <Card className="bg-rose-50 border-l-4 border-rose-500 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-rose-800">
                      <Gift className="mr-2 h-5 w-5" /> Goede Doel van de Maand
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="bg-white p-4 rounded-lg border border-rose-100">
                      <p className="font-bold text-lg text-rose-800">{activeCause.name}</p>
                      <p className="text-sm text-gray-700 mb-3">{activeCause.description}</p>
                      <p className="text-xs text-rose-600 font-medium">
                          Actief tot: {format(activeCause.endDate.toDate(), 'dd MMMM yyyy', { locale: nl })}
                      </p>
                    </div>
                    <CardDescription className="mt-3 text-sm">
                        Deze periode steunen we dit goede doel. Het is een leuke, niet-verplichte manier om veel impact te maken. Kinderen kunnen hun gespaarde punten doneren in de beloningswinkel.
                    </CardDescription>
                </CardContent>
            </Card>
          )}

          <Card className="bg-slate-50 shadow-sm">
            <CardContent className="p-4">
              <p className="font-bold mb-3 text-slate-800">Herstel-e-mailadres</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  type="email" 
                  placeholder="jouw@email.com" 
                  value={recoveryEmail} 
                  onChange={(e) => setRecoveryEmail(e.target.value)} 
                  className="flex-grow"
                />
                <Button onClick={handleSaveRecoveryEmail} className="bg-slate-800 hover:bg-slate-700">
                  Opslaan
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ontvang een herstel-e-mail met je gezinscode als je wachtwoord kwijt bent.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-yellow-800">
                <Bell className="mr-2 h-5 w-5" /> Goedkeuren <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">{submittedChores.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {submittedChores.length > 0 ? submittedChores.map(chore => {
                const child = children.find(c => c.id === chore.submittedBy);
                return (
                  <div key={chore.id} className="bg-white p-4 rounded-lg border border-yellow-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">{chore.name} <span className="text-gray-600 font-normal">door {child?.name || 'onbekend'} {chore.emotion || ''}</span></p>
                        <p className="text-sm text-yellow-600 font-bold mt-1">{chore.points} punten</p>
                        {chore.photoUrl && (
                           <div className="mt-2">
                                <a href={chore.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm inline-flex items-center">
                                  <span className="mr-1">📸</span> Bekijk foto
                                </a>
                           </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => approveChore(chore.id)} size="sm" className="bg-success hover:bg-success/90 text-white">
                          <Check className="h-4 w-4 mr-1" /> Goedkeuren
                        </Button>
                        <Button onClick={() => rejectChore(chore.id)} size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                          <X className="h-4 w-4 mr-1" /> Afkeuren
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              }) : <p className="text-muted-foreground italic bg-white p-4 rounded-lg border">Geen klusjes om goed te keuren.</p>}
            </CardContent>
          </Card>
          
          <Card className="bg-teal-50 border-teal-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-teal-800">
                Beloningen Afhandelen <span className="ml-2 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full">{pendingRewards.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {pendingRewards.length > 0 ? pendingRewards.map(reward => (
                  <div key={reward.id} className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                              <p className="font-bold text-slate-800">{reward.rewardName}</p>
                              <p className="text-sm text-gray-600">Gekocht door: {reward.childName}</p>
                              <p className="text-sm text-teal-600 font-bold mt-1">{reward.points} punten</p>
                          </div>
                          <Button onClick={() => markRewardAsGiven(reward.id)} size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                            <Check className="mr-1 h-4 w-4" /> Gegeven
                          </Button>
                      </div>
                  </div>
              )) : <p className="text-muted-foreground italic bg-white p-4 rounded-lg border">Geen beloningen om af te handelen.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-slate-800">Kinderen</CardTitle>
              <Button
                size="sm"
                onClick={() => setAddChildModalOpen(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                disabled={!canAddMoreChildren}
                title={!canAddMoreChildren ? 'Upgrade naar Gezin+ voor onbeperkte kinderen' : undefined}
              >
                <Plus className="h-4 w-4 mr-1" /> Toevoegen
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {children.length > 0 ? children.map(child => (
                <div key={child.id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{child.avatar}</span>
                      <div>
                        <p className="font-bold text-slate-800">{child.name}</p>
                        <p className="text-sm text-yellow-600 font-bold">{child.points || 0} punten</p>
                        <p className="text-xs text-slate-500">Totaal verdiend: {child.totalPointsEver || 0} punten</p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => inviteChildViaWhatsApp(child)} title={`Nodig ${child.name} uit via WhatsApp`}>
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openEditChildModal(child)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive border-red-200 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                            <AlertDialogDescription>Wil je {child.name} verwijderen? Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem('children', child.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )) : <p className="text-muted-foreground italic bg-white p-4 rounded-lg border">Nog geen kinderen toegevoegd.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="text-slate-800">Klusjes</CardTitle>
              <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setTopChoresModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
                    <ListOrdered className="h-4 w-4 mr-1" /> Top Klusjes
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setGeminiModalOpen(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                    title={aiFeatureEnabled ? 'Klusjes Assistent' : 'Premium functie'}
                    disabled={!aiFeatureEnabled}
                  >
                    <Sparkles className="h-4 w-4 mr-1" /> AI Hulp
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAddChoreModalOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                    disabled={choreQuotaReached}
                    title={choreQuotaReached ? 'Upgrade voor onbeperkte klusjes' : undefined}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Toevoegen
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {choreQuotaReached && (
                <p className="text-sm text-amber-700 font-semibold bg-amber-100 px-4 py-3 rounded-lg border border-amber-200">
                  ⚠️ Je hebt het maximum van {choreQuota} klusjes deze maand bereikt. Upgrade naar Gezin+ voor onbeperkte klusjes.
                </p>
              )}
              {chores.length > 0 ? chores.map(chore => (
                <div key={chore.id} className="bg-white p-4 rounded-lg border shadow-sm">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{chore.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{getAssignedText(chore)}</p>
                      <p className="text-sm text-yellow-600 font-bold mt-1">{chore.points} punten</p>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openEditChoreModal(chore)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive border-red-200 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                            <AlertDialogDescription>Wil je "{chore.name}" verwijderen? Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem('chores', chore.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                   </div>
                </div>
              )) : <p className="text-muted-foreground italic bg-white p-4 rounded-lg border">Nog geen klusjes toegevoegd.</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Beloningen</CardTitle>
              <div className="flex space-x-2">
                  <Button size="icon" onClick={() => setTopRewardsModalOpen(true)} className="bg-teal-500 text-white" title="Top Beloningen"><Medal /></Button>
                  <Button size="icon" onClick={() => setAddRewardModalOpen(true)} className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"><Plus /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!donationsEnabled && (
                <p className="text-sm text-amber-700 bg-amber-100 px-4 py-3 rounded-lg border border-amber-200">
                  ℹ️ Donatie-beloningen zijn onderdeel van Gezin+. Upgrade om goede doelen te activeren.
                </p>
              )}
              {rewards.length > 0 ? rewards.map(reward => (
                <div key={reward.id} className="bg-white p-4 rounded-lg border shadow-sm">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{reward.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{getAssignedText(reward)}</p>
                      <p className="text-sm text-yellow-600 font-bold mt-1">{reward.points} punten</p>
                      <Badge variant="secondary" className="mt-2">
                        {reward.type === 'money' && 'Geld'}
                        {reward.type === 'experience' && 'Ervaring'}
                        {reward.type === 'privilege' && 'Privilege'}
                        {reward.type === 'donation' && 'Donatie'}
                      </Badge>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openEditRewardModal(reward)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive border-red-200 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                            <AlertDialogDescription>Wil je "{reward.name}" verwijderen? Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem('rewards', reward.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                   </div>
                </div>
              )) : <p className="text-muted-foreground italic bg-white p-4 rounded-lg border">Nog geen beloningen toegevoegd.</p>}
            </CardContent>
          </Card>
        </main>
      </ScrollArea>
      
      {/* Use dynamic imports for modals to prevent SSR issues */}
      <AddChildModalDynamic isOpen={isAddChildModalOpen} setIsOpen={setAddChildModalOpen} />
      <AddChoreModalDynamic isOpen={isAddChoreModalOpen} setIsOpen={setAddChoreModalOpen} />
      <AddRewardModalDynamic isOpen={isAddRewardModalOpen} setIsOpen={setAddRewardModalOpen} />

      {editingChild && <EditChildModalDynamic isOpen={isEditChildModalOpen} setIsOpen={setEditChildModalOpen} child={editingChild} />}
      {editingChore && <EditChoreModalDynamic isOpen={isEditChoreModalOpen} setIsOpen={setEditChoreModalOpen} chore={editingChore} />}
      {editingReward && <EditRewardModalDynamic isOpen={isEditRewardModalOpen} setIsOpen={setEditRewardModalOpen} reward={editingReward} />}

      <TopChoresModalDynamic isOpen={isTopChoresModalOpen} setIsOpen={setTopChoresModalOpen} />
      <TopRewardsModalDynamic isOpen={isTopRewardsModalOpen} setIsOpen={setTopRewardsModalOpen} />
      <GeminiChoreIdeasModalDynamic isOpen={isGeminiModalOpen} setIsOpen={setGeminiModalOpen} />
      <QrCodeModalDynamic isOpen={isQrCodeModalOpen} setIsOpen={setQrCodeModalOpen} />
    </div>
  );
}