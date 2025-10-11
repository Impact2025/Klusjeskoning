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
  const [recoveryEmail, setRecoveryEmail] = useState(family?.recoveryEmail || '');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

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
          <Card className="bg-blue-100 border-l-4 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold">Gezinscode: <span className="font-mono bg-white px-2 py-1 rounded">{familyCode}</span></p>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={copyFamilyCode} title="Kopieer code"><Copy className="h-5 w-5 text-primary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setQrCodeModalOpen(true)} title="Toon QR Code"><QrCode className="h-5 w-5 text-primary" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Deel deze code met je kinderen om ze in te laten loggen.</p>
            </CardContent>
          </Card>

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
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                {!isPremium && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpgrade('monthly')} disabled={isLoading}>
                      Upgrade naar Gezin+ · {formatPrice(premiumPlan.priceMonthlyCents)}/mnd
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleUpgrade('yearly')} disabled={isLoading}>
                      {formatPrice(premiumPlan.priceYearlyCents)}/jaar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {activeCause && (
             <Card className="bg-rose-50 border-rose-400 border-l-4">
                <CardHeader>
                    <CardTitle className="flex items-center text-rose-800"><Gift className="mr-2"/> Goede Doel van de Maand</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="font-bold text-lg">{activeCause.name}</p>
                    <p className="text-sm text-gray-700 mb-2">{activeCause.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Actief tot: {format(activeCause.endDate.toDate(), 'dd MMMM yyyy', { locale: nl })}
                    </p>
                    <CardDescription className="mt-2">
                        Deze periode steunen we dit goede doel. Het is een leuke, niet-verplichte manier om veel impact te maken. Kinderen kunnen hun gespaarde punten doneren in de beloningswinkel.
                    </CardDescription>
                </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <p className="font-bold mb-2">Herstel-e-mailadres</p>
              <div className="flex">
                <Input type="email" placeholder="jouw@email.com" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} />
                <Button onClick={handleSaveRecoveryEmail} className="ml-2">Opslaan</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2" /> Goedkeuren <span className="ml-2 bg-yellow-400 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">{submittedChores.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {submittedChores.length > 0 ? submittedChores.map(chore => {
                const child = children.find(c => c.id === chore.submittedBy);
                return (
                  <div key={chore.id} className="bg-slate-50 p-3 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{chore.name} <span className="text-gray-500 font-normal">door {child?.name || 'onbekend'} {chore.emotion || ''}</span></p>
                        <p className="text-sm text-yellow-600 font-bold">{chore.points} punten</p>
                        {chore.photoUrl && (
                           <div className="mt-2">
                                <a href={chore.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">Bekijk foto</a>
                           </div>
                        )}
                      </div>
                      <div className="space-x-2 flex-shrink-0">
                        <Button onClick={() => approveChore(chore.id)} size="icon" className="bg-success hover:bg-success/90 text-white"><Check /></Button>
                        <Button onClick={() => rejectChore(chore.id)} size="icon" variant="destructive"><X /></Button>
                      </div>
                    </div>
                  </div>
                )
              }) : <p className="text-muted-foreground italic">Geen klusjes om goed te keuren.</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Beloningen Afhandelen <span className="ml-2 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full">{pendingRewards.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingRewards.length > 0 ? pendingRewards.map(reward => (
                  <div key={reward.id} className="bg-slate-50 p-3 rounded-lg border">
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="font-bold">{reward.rewardName}</p>
                              <p className="text-sm text-gray-600">Gekocht door: {reward.childName}</p>
                          </div>
                          <Button onClick={() => markRewardAsGiven(reward.id)} className="bg-teal-500 hover:bg-teal-600 text-white"><Check className="mr-1 h-4 w-4"/> Gegeven</Button>
                      </div>
                  </div>
              )) : <p className="text-muted-foreground italic">Geen beloningen om af te handelen.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kinderen</CardTitle>
              <Button
                size="icon"
                onClick={() => setAddChildModalOpen(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                disabled={!canAddMoreChildren}
                title={!canAddMoreChildren ? 'Upgrade naar Gezin+ voor onbeperkte kinderen' : undefined}
              >
                <Plus />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {children.length > 0 ? children.map(child => (
                <div key={child.id} className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{child.avatar}</span>
                    <div>
                      <p className="font-bold">{child.name}</p>
                      <p className="text-sm text-yellow-600 font-bold">{child.points || 0} punten</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Button variant="ghost" size="icon" className="text-green-600" onClick={() => inviteChildViaWhatsApp(child)} title={`Nodig ${child.name} uit via WhatsApp`}><WhatsAppIcon className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => openEditChildModal(child)}><Pencil/></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Wil je {child.name} verwijderen? Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteItem('children', child.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )) : <p className="text-muted-foreground italic">Nog geen kinderen toegevoegd.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Klusjes</CardTitle>
              <div className="flex space-x-2">
                  <Button size="icon" onClick={() => setTopChoresModalOpen(true)} className="bg-blue-500 text-white" title="Top Klusjes"><ListOrdered /></Button>
                  <Button
                    size="icon"
                    onClick={() => setGeminiModalOpen(true)}
                    className="bg-purple-500 text-white"
                    title={aiFeatureEnabled ? 'Klusjes Assistent' : 'Premium functie'}
                    disabled={!aiFeatureEnabled}
                  >
                    <Sparkles />
                  </Button>
                  <Button
                    size="icon"
                    onClick={() => setAddChoreModalOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                    disabled={choreQuotaReached}
                    title={choreQuotaReached ? 'Upgrade voor onbeperkte klusjes' : undefined}
                  >
                    <Plus />
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {choreQuotaReached && (
                <p className="text-sm text-amber-600 font-semibold bg-amber-100 px-3 py-2 rounded-lg">
                  Je hebt het maximum van {choreQuota} klusjes deze maand bereikt. Upgrade naar Gezin+ voor onbeperkte klusjes.
                </p>
              )}
              {chores.length > 0 ? chores.map(chore => (
                <div key={chore.id} className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center">
                   <div>
                    <p className="font-bold">{chore.name}</p>
                    <p className="text-xs text-gray-500">{getAssignedText(chore)}</p>
                    <p className="text-sm text-yellow-600 font-bold">{chore.points} punten</p>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => openEditChoreModal(chore)}><Pencil/></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Wil je "{chore.name}" verwijderen? Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteItem('chores', chore.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )) : <p className="text-muted-foreground italic">Nog geen klusjes toegevoegd.</p>}
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
                <p className="text-sm text-amber-600 bg-amber-100 px-3 py-2 rounded-lg">
                  Donatie-beloningen zijn onderdeel van Gezin+. Upgrade om goede doelen te activeren.
                </p>
              )}
              {rewards.length > 0 ? rewards.map(reward => (
                <div key={reward.id} className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center">
                   <div>
                    <p className="font-bold">{reward.name}</p>
                    <p className="text-xs text-gray-500">{getAssignedText(reward)}</p>
                    <p className="text-sm text-yellow-600 font-bold">{reward.points} punten</p>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => openEditRewardModal(reward)}><Pencil/></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Weet je het zeker?</AlertDialogTitle><AlertDialogDescription>Wil je "{reward.name}" verwijderen? Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteItem('rewards', reward.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )) : <p className="text-muted-foreground italic">Nog geen beloningen toegevoegd.</p>}
            </CardContent>
          </Card>
        </main>
      </ScrollArea>
      
      <AddChildModal isOpen={isAddChildModalOpen} setIsOpen={setAddChildModalOpen} />
      <AddChoreModal isOpen={isAddChoreModalOpen} setIsOpen={setAddChoreModalOpen} />
      <AddRewardModal isOpen={isAddRewardModalOpen} setIsOpen={setAddRewardModalOpen} />

      {editingChild && <EditChildModal isOpen={isEditChildModalOpen} setIsOpen={setEditChildModalOpen} child={editingChild} />}
      {editingChore && <EditChoreModal isOpen={isEditChoreModalOpen} setIsOpen={setEditChoreModalOpen} chore={editingChore} />}
      {editingReward && <EditRewardModal isOpen={isEditRewardModalOpen} setIsOpen={setEditRewardModalOpen} reward={editingReward} />}

      <TopChoresModal isOpen={isTopChoresModalOpen} setIsOpen={setTopChoresModalOpen} />
      <TopRewardsModal isOpen={isTopRewardsModalOpen} setIsOpen={setTopRewardsModalOpen} />
      <GeminiChoreIdeasModal isOpen={isGeminiModalOpen} setIsOpen={setGeminiModalOpen} />
      <QrCodeModal isOpen={isQrCodeModalOpen} setIsOpen={setQrCodeModalOpen} />
    </div>
  );
}
