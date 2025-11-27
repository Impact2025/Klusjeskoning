'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Image as ImageIcon,
  DollarSign,
  Users,
  LogOut,
  Settings,
  ListTodo,
  Gift,
  BarChart3,
  Edit,
  Trash2,
  Home,
  Menu,
  RefreshCw,
  Heart,
  Star,
  Trophy,
  Zap,
  BookOpen
} from 'lucide-react';
import type { Chore, Child, Reward } from '@/lib/types';
import AddChildModal from '../models/AddChildModal';
import EditChildModal from '../models/EditChildModal';
import AddChoreModal from '../models/AddChoreModal';
import EditChoreModal from '../models/EditChoreModal';
import AddRewardModal from '../models/AddRewardModal';
import EditRewardModal from '../models/EditRewardModal';
import AddTeamChoreModal from '../models/AddTeamChoreModal';
import EditTeamChoreModal from '../models/EditTeamChoreModal';
import ComplimentCards from '../../gamification/ComplimentCards';
import { OnboardingWizard } from '../../onboarding';
import SuggestionBanner from '../../suggestions/SuggestionBanner';
import ChoreLibrary from '../../chores/ChoreLibrary';
import { ParentInsightsDashboard } from '../../coach';

export default function ParentDashboard() {
  const { family, logout, approveChore, deleteItem } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<Chore[]>([]);
  const [emptySavings, setEmptySavings] = useState<Child[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isEditChildOpen, setIsEditChildOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isEditChoreOpen, setIsEditChoreOpen] = useState(false);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [isEditRewardOpen, setIsEditRewardOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isAddTeamChoreOpen, setIsAddTeamChoreOpen] = useState(false);
  const [isEditTeamChoreOpen, setIsEditTeamChoreOpen] = useState(false);
  const [selectedTeamChore, setSelectedTeamChore] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [automationSettings, setAutomationSettings] = useState({
    autoPayouts: true,
    dailyReminders: true,
    photoApprovals: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [rewardFilter, setRewardFilter] = useState<'all' | 'privileges' | 'experience' | 'financial'>('all');

  // Onboarding states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingChild, setOnboardingChild] = useState<Child | null>(null);

  // Chore Library state
  const [showChoreLibrary, setShowChoreLibrary] = useState(false);

  useEffect(() => {
    if (family) {
      // Get pending chore approvals
      const pending = family.chores.filter(chore => chore.status === 'submitted');
      setPendingApprovals(pending);

      // Get children with empty savings (mock data for now)
      const empty = family.children.filter(child => child.points < 50);
      setEmptySavings(empty);
    }
  }, [family]);

  const handleApproveChore = async (choreId: string) => {
    try {
      await approveChore(choreId);
      setPendingApprovals(prev => prev.filter(chore => chore.id !== choreId));
    } catch (error) {
      console.error('Failed to approve chore:', error);
    }
  };

  const handleQuickApprove = async (choreId: string) => {
    // One-click approval without confirmation
    await handleApproveChore(choreId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force a page refresh to get latest data
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh:', error);
      setIsRefreshing(false);
    }
  };

  const handleEditChild = (child: Child) => {
    setSelectedChild(child);
    setIsEditChildOpen(true);
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (window.confirm(`Weet je zeker dat je ${childName} wilt verwijderen? Alle gegevens van dit kind gaan verloren.`)) {
      await deleteItem('children', childId);
    }
  };

  const handleStartOnboarding = (child: Child) => {
    setOnboardingChild(child);
    setIsOnboardingOpen(true);
  };

  const handleOnboardingComplete = () => {
    setIsOnboardingOpen(false);
    setOnboardingChild(null);
    window.location.reload();
  };

  const handleEditChore = (chore: Chore) => {
    setSelectedChore(chore);
    setIsEditChoreOpen(true);
  };

  const handleDeleteChore = async (choreId: string, choreName: string) => {
    if (window.confirm(`Weet je zeker dat je "${choreName}" wilt verwijderen?`)) {
      await deleteItem('chores', choreId);
    }
  };

  const handleEditReward = (reward: Reward) => {
    setSelectedReward(reward);
    setIsEditRewardOpen(true);
  };

  const handleDeleteReward = async (rewardId: string, rewardName: string) => {
    if (window.confirm(`Weet je zeker dat je "${rewardName}" wilt verwijderen?`)) {
      await deleteItem('rewards', rewardId);
    }
  };

  const handleEditTeamChore = (teamChore: any) => {
    setSelectedTeamChore(teamChore);
    setIsEditTeamChoreOpen(true);
  };

  const handleDeleteTeamChore = async (teamChoreId: string, teamChoreName: string) => {
    if (window.confirm(`Weet je zeker dat je "${teamChoreName}" wilt verwijderen? Alle voortgang gaat verloren.`)) {
      // TODO: Implement team chore deletion when handleAction is added to AppContext
      console.log('Team chore deletion not yet implemented:', teamChoreId);
      alert('Team klusje verwijderen functionaliteit wordt binnenkort toegevoegd!');
    }
  };

  const handleSaveAutomationSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAutomationSettings',
          payload: automationSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Show success message (you could add a toast notification here)
      alert('Instellingen succesvol opgeslagen!');
    } catch (error) {
      console.error('Failed to save automation settings:', error);
      alert('Er ging iets mis bij het opslaan van de instellingen.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Enhanced authentication check - ensure family exists (user is only for child sessions)
  if (!family) {
    console.log('ParentDashboard: No family data available');
    return null;
  }

  const totalPending = pendingApprovals.length + emptySavings.length;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Desktop Header */}
      <header className="hidden md:flex p-4 justify-between items-center bg-white shadow-sm border-b">
        <div>
          <h1 className="text-xl font-bold text-gray-800">KlusjesKoning</h1>
          <p className="text-sm text-gray-600">{family.familyName}</p>
        </div>
        <div className="flex items-center gap-2">
          {family.subscription?.plan === 'starter' && (
            <Button
              variant="outline"
              size="sm"
              className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => window.location.href = '/app/upgrade'}
            >
              ⭐ Upgrade naar Premium
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50 hover:border-gray-400">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')} className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50 hover:border-gray-400">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="h-9 w-9 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Header - Clean and Professional */}
      <header className="md:hidden px-4 pb-4 flex justify-between items-center bg-white shadow-sm border-b" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeTab === 'overview' && 'Overzicht'}
            {activeTab === 'children' && 'Kinderen'}
            {activeTab === 'chores' && 'Klusjes'}
            {activeTab === 'rewards' && 'Beloningen'}
            {activeTab === 'compliments' && 'Complimenten'}
            {activeTab === 'actions' && 'Goedkeuren'}
            {activeTab === 'settings' && 'Instellingen'}
          </h1>
          <p className="text-sm text-gray-600">{family.familyName}</p>
        </div>
        <div className="flex items-center gap-2">
          {family.subscription?.plan === 'starter' && (
            <Button
              variant="outline"
              size="sm"
              className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 text-xs px-3 py-1"
              onClick={() => window.location.href = '/app/upgrade'}
            >
              ⭐ Premium
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Navigation - Minimalist & Professional */}
      <div className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-12 bg-transparent p-1">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-all duration-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md">
              <BarChart3 className="h-4 w-4" />
              <span>Overzicht</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-all duration-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md" data-tour="children">
              <Users className="h-4 w-4" />
              <span>Kinderen</span>
            </TabsTrigger>
            <TabsTrigger value="chores" className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-all duration-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md" data-tour="chores">
              <ListTodo className="h-4 w-4" />
              <span>Klusjes</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-all duration-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md" data-tour="rewards">
              <Gift className="h-4 w-4" />
              <span>Beloningen</span>
            </TabsTrigger>
            <TabsTrigger value="compliments" className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-all duration-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md">
              <Heart className="h-4 w-4" />
              <span>Complimenten</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-all duration-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md relative" data-tour="actions">
              <AlertTriangle className="h-4 w-4" />
              <span>Goedkeuren</span>
              {totalPending > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center font-bold">
                  {totalPending}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-grow">
        <main className="p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Mobile Bottom Navigation - Optimized for Touch */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 md:hidden z-50 shadow-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="flex justify-around items-center h-14 px-1 max-w-lg mx-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-lg transition-all duration-200 active:scale-95 ${
                    activeTab === 'overview'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-0.5">Overzicht</span>
                </button>
                <button
                  onClick={() => setActiveTab('children')}
                  className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-lg transition-all duration-200 active:scale-95 ${
                    activeTab === 'children'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-0.5">Kinderen</span>
                </button>
                <button
                  onClick={() => setActiveTab('chores')}
                  className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-lg transition-all duration-200 active:scale-95 ${
                    activeTab === 'chores'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ListTodo className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-0.5">Klusjes</span>
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-lg transition-all duration-200 active:scale-95 ${
                    activeTab === 'rewards'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Gift className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-0.5">Beloningen</span>
                </button>
                <button
                  onClick={() => setActiveTab('compliments')}
                  className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-lg transition-all duration-200 active:scale-95 ${
                    activeTab === 'compliments'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-0.5">Complimenten</span>
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-lg transition-all duration-200 active:scale-95 relative ${
                    activeTab === 'actions'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-0.5">Actie</span>
                  {totalPending > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-0.5 right-0 h-4 min-w-[16px] rounded-full px-1 text-[10px] flex items-center justify-center font-bold"
                    >
                      {totalPending}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-8 mt-8">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6" data-tour="overview">
                <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{family.children.length}</div>
                    <p className="text-sm font-medium text-blue-800">Kinderen</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-green-600 mb-2">{family.chores.filter(c => c.status === 'approved').length}</div>
                    <p className="text-sm font-medium text-green-800">Voltooide klusjes</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">{pendingApprovals.length}</div>
                    <p className="text-sm font-medium text-yellow-800">Te goedkeuren</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      €{family.children.reduce((sum, child) => sum + child.points, 0) / 100}
                    </div>
                    <p className="text-sm font-medium text-purple-800">Totaal verdiend</p>
                  </CardContent>
                </Card>
              </div>

              {/* Family Members Overview */}
              <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="h-5 w-5 mr-2 text-gray-600" />
                    Familie Leden
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {family.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {child.avatar || child.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{child.name}</p>
                            <p className="text-sm text-gray-600">Level {Math.floor((child.totalXpEver || 0) / 100) + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-lg">{child.points}</p>
                          <p className="text-xs text-gray-500">punten</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Smart Suggestions per Child */}
              {family.children.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Slimme Suggesties
                  </h3>
                  {family.children.map((child) => (
                    <SuggestionBanner
                      key={`suggestion-${child.id}`}
                      childId={child.id}
                      childName={child.name}
                      onAccept={() => {}}
                    />
                  ))}
                </div>
              )}

              {/* AI Coach Insights - Premium Feature */}
              {family.subscription?.plan === 'premium' && (
                <ParentInsightsDashboard />
              )}

              {/* Recent Activity */}
              <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
                    Recente Activiteit
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {family.chores.slice(-5).reverse().map((chore) => (
                      <div key={chore.id} className="flex items-center justify-between py-3 px-4 bg-white/40 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <Badge variant={chore.status === 'approved' ? 'default' : 'secondary'} className="text-xs px-2 py-1">
                            {chore.status === 'approved' ? '✓ Goedgekeurd' : '⏳ Ingediend'}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">{chore.name}</span>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {family.children.find(c => c.id === chore.submittedBy)?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="children" className="space-y-8 mt-8">
              {/* Professional Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Familie Leden</h2>
                  <p className="text-sm text-gray-600 mt-1">Beheer jullie kinderen en hun voortgang</p>
                </div>
                <Button onClick={() => setIsAddChildOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Kind Toevoegen
                </Button>
              </div>

              {/* Professional Children List - Mobile Cards / Desktop Table */}
              {family.children.length > 0 ? (
                <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Desktop Table Header - Hidden on Mobile */}
                    <div className="hidden md:block bg-gray-50/80 border-b border-gray-200/60 px-6 py-4">
                      <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                        <div className="col-span-4">Kind</div>
                        <div className="col-span-2 text-center">Level</div>
                        <div className="col-span-2 text-center">Punten</div>
                        <div className="col-span-2 text-center">PIN Code</div>
                        <div className="col-span-2 text-center">Acties</div>
                      </div>
                    </div>

                    {/* Children List */}
                    <div className="divide-y divide-gray-100">
                      {family.children.map((child, index) => (
                        <div key={child.id} className={`p-4 md:px-6 md:py-5 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                          {/* Mobile Card Layout */}
                          <div className="md:hidden space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                                    {child.avatar || child.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-gray-900">{child.name}</p>
                                  <p className="text-sm text-gray-600">{child.totalXpEver} XP</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {Math.floor((child.totalXpEver || 0) / 100) + 1}
                                  </span>
                                </div>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-bold">
                                  {child.points}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <code className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-mono font-bold">
                                PIN: {child.pin}
                              </code>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditChild(child)}
                                  className="h-10 w-10 p-0 border-gray-300 hover:bg-gray-100 active:scale-95"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleStartOnboarding(child)}
                                  className="h-10 px-3 bg-purple-600 hover:bg-purple-700 text-xs font-medium active:scale-95"
                                >
                                  <Zap className="h-4 w-4 mr-1" />
                                  Setup
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteChild(child.id, child.name)}
                                  className="h-10 w-10 p-0 border-red-300 text-red-600 hover:bg-red-50 active:scale-95"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Table Layout */}
                          <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                            {/* Child Info */}
                            <div className="col-span-4 flex items-center gap-4">
                              <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                                  {child.avatar || child.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-gray-900 text-lg">{child.name}</p>
                                <p className="text-sm text-gray-600">{child.totalXpEver} XP totaal</p>
                              </div>
                            </div>

                            {/* Level */}
                            <div className="col-span-2 text-center">
                              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
                                <span className="text-white font-bold text-sm">
                                  {Math.floor((child.totalXpEver || 0) / 100) + 1}
                                </span>
                              </div>
                            </div>

                            {/* Points */}
                            <div className="col-span-2 text-center">
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold inline-block">
                                {child.points}
                              </div>
                            </div>

                            {/* PIN Code */}
                            <div className="col-span-2 text-center">
                              <code className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-mono font-bold">
                                {child.pin}
                              </code>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditChild(child)}
                                className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStartOnboarding(child)}
                                className="h-9 px-3 bg-purple-600 hover:bg-purple-700 text-xs font-medium"
                              >
                                <Zap className="h-4 w-4 mr-1" />
                                Setup
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteChild(child.id, child.name)}
                                className="h-9 w-9 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Empty State */
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="text-center py-16">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Welkom bij jullie gezin!</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Voeg jullie eerste kind toe om te beginnen met een georganiseerd beloningensysteem dat de hele familie motiveert.
                    </p>
                    <Button onClick={() => setIsAddChildOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9">
                      <Plus className="h-4 w-4 mr-2" />
                      Eerste Kind Toevoegen
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="chores" className="space-y-8 mt-8">
              {/* Professional Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Klusjes Beheren</h2>
                  <p className="text-sm text-gray-600 mt-1">Organiseer en beheer jullie gezinstaakjes</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant={showChoreLibrary ? "default" : "outline"}
                    onClick={() => setShowChoreLibrary(!showChoreLibrary)}
                    className={`${showChoreLibrary ? "bg-purple-600 hover:bg-purple-700" : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"} text-sm font-medium px-4 py-2 h-9`}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Bibliotheek
                  </Button>
                  <Button onClick={() => setIsAddChoreOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9">
                    <Plus className="h-4 w-4 mr-2" />
                    Klusje Toevoegen
                  </Button>
                </div>
              </div>

              {/* Chore Library */}
              {showChoreLibrary && (
                <ChoreLibrary
                  children={family.children.map(c => ({ id: c.id, name: c.name }))}
                  onChoreAdded={() => window.location.reload()}
                />
              )}

              {/* Status Overview - Professional Layout */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {family.chores.filter(c => c.status === 'available').length}
                    </div>
                    <p className="text-sm font-medium text-blue-800">Beschikbaar</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {family.chores.filter(c => c.status === 'submitted').length}
                    </div>
                    <p className="text-sm font-medium text-yellow-800">Ingediend</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {family.chores.filter(c => c.status === 'approved').length}
                    </div>
                    <p className="text-sm font-medium text-green-800">Goedgekeurd</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {family.chores.filter(c => (c as any).isTemplate === 1).length}
                    </div>
                    <p className="text-sm font-medium text-purple-800">Terugkerend</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {family.teamChores?.length || 0}
                    </div>
                    <p className="text-sm font-medium text-indigo-800">Team Klusjes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recurring Chores Overview */}
              {family.chores.filter(c => (c as any).isTemplate === 1).length > 0 && (
                <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <RefreshCw className="h-5 w-5 mr-2 text-gray-600" />
                      Terugkerende Klusjes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {family.chores
                        .filter(c => (c as any).isTemplate === 1)
                        .map((chore) => (
                          <div key={chore.id} className="flex items-center justify-between p-5 bg-white/60 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-4 flex-1">
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 px-3 py-1">
                                {(chore as any).recurrenceType === 'daily' ? 'Dagelijks' :
                                 (chore as any).recurrenceType === 'weekly' ? 'Wekelijks' : 'Aangepast'}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{chore.name}</p>
                                <p className="text-sm text-gray-600">{chore.points} punten • Sjabloon</p>
                                {(chore as any).nextDueDate && (
                                  <p className="text-sm text-purple-600 font-medium">
                                    Volgende: {new Date((chore as any).nextDueDate).toLocaleDateString('nl-NL')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditChore(chore)}
                                className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteChore(chore.id, chore.name)}
                                className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chores List */}
              <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Individuele Klusjes</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {family.chores.length > 0 ? (
                      family.chores.map((chore) => (
                        <div key={chore.id} className="flex items-center justify-between p-5 bg-white/60 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-4 flex-1">
                            <Badge
                              variant={chore.status === 'available' ? 'default' : chore.status === 'submitted' ? 'secondary' : 'outline'}
                              className="px-3 py-1 text-xs font-medium"
                            >
                              {chore.status === 'available' ? 'Beschikbaar' : chore.status === 'submitted' ? 'Ingediend' : 'Goedgekeurd'}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{chore.name}</p>
                              <p className="text-sm text-gray-600">{chore.points} punten • {chore.xpReward} XP</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditChore(chore)}
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteChore(chore.id, chore.name)}
                              className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <ListTodo className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Nog geen klusjes toegevoegd</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                          Begin met het toevoegen van jullie eerste klusjes om een georganiseerd beloningensysteem op te zetten.
                        </p>
                        <Button onClick={() => setIsAddChoreOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9">
                          <Plus className="h-4 w-4 mr-2" />
                          Eerste Klusje Toevoegen
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Team Chores Section */}
              <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-600" />
                      Team Klusjes
                    </div>
                    <Button onClick={() => setIsAddTeamChoreOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9">
                      <Plus className="h-4 w-4 mr-2" />
                      Toevoegen
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {family.teamChores && family.teamChores.length > 0 ? (
                      family.teamChores.map((teamChore) => (
                        <div key={teamChore.id} className="border border-gray-100 rounded-lg p-6 bg-white/60 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900 mb-2">{teamChore.name}</h3>
                              <p className="text-gray-600 mb-4">{teamChore.description}</p>
                              <div className="flex items-center gap-6 text-sm">
                                <span className="flex items-center">
                                  {teamChore.completedAt ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                                  )}
                                  <span className={`font-medium ${teamChore.completedAt ? 'text-green-600' : 'text-blue-600'}`}>
                                    {teamChore.completedAt ? 'Voltooid' : 'Bezig'}
                                  </span>
                                </span>
                                <span className="text-yellow-600 font-semibold">
                                  {teamChore.totalPoints} punten te verdelen
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTeamChore(teamChore)}
                                className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTeamChore(teamChore.id, teamChore.name)}
                                className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700">Voortgang</span>
                              <span className="font-semibold text-gray-900">{teamChore.progress}%</span>
                            </div>
                            <Progress value={teamChore.progress} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-2" />
                              <span className="font-medium">{teamChore.participatingChildren.length} deelnemers</span>
                            </div>
                            {!teamChore.completedAt && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                Samenwerken
                              </Badge>
                            )}
                          </div>

                          {teamChore.participatingChildren.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm font-semibold text-gray-700 mb-3">Deelnemers:</p>
                              <div className="flex flex-wrap gap-2">
                                {teamChore.participatingChildren.map((childId) => {
                                  const child = family.children.find(c => c.id === childId);
                                  return child ? (
                                    <Badge key={childId} variant="outline" className="text-xs border-gray-300">
                                      {child.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Nog geen team klusjes</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                          Team klusjes bevorderen samenwerking tussen jullie kinderen en maken het leuker om samen te werken.
                        </p>
                        <Button onClick={() => setIsAddTeamChoreOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9">
                          <Plus className="h-4 w-4 mr-2" />
                          Eerste Team Klusje Toevoegen
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="rewards" className="space-y-8 mt-8">
              {/* Professional Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Beloningen Beheren</h2>
                  <p className="text-sm text-gray-600 mt-1">Stel aantrekkelijke beloningen in voor jullie gezin</p>
                </div>
                <Button onClick={() => setIsAddRewardOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9">
          <Plus className="h-4 w-4 mr-2" />
          Beloning Toevoegen
        </Button>
              </div>

              {/* Professional Category Filter */}
              <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Filter op Categorie</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant={rewardFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('all')}
                      className={`h-14 transition-all duration-200 ${rewardFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'hover:bg-gray-50'}`}
                    >
                      <Gift className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Alle</div>
                        <div className="text-xs opacity-80">Alle categorieën</div>
                      </div>
                    </Button>
                    <Button
                      variant={rewardFilter === 'privileges' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('privileges')}
                      className={`h-14 transition-all duration-200 ${rewardFilter === 'privileges' ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'hover:bg-gray-50'}`}
                    >
                      <Star className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Privileges</div>
                        <div className="text-xs opacity-80">Extra rechten</div>
                      </div>
                    </Button>
                    <Button
                      variant={rewardFilter === 'experience' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('experience')}
                      className={`h-14 transition-all duration-200 ${rewardFilter === 'experience' ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'hover:bg-gray-50'}`}
                    >
                      <Trophy className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Ervaringen</div>
                        <div className="text-xs opacity-80">Uitjes & activiteiten</div>
                      </div>
                    </Button>
                    <Button
                      variant={rewardFilter === 'financial' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('financial')}
                      className={`h-14 transition-all duration-200 ${rewardFilter === 'financial' ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'hover:bg-gray-50'}`}
                    >
                      <DollarSign className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Financieel</div>
                        <div className="text-xs opacity-80">Geld & sparen</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Rewards Grid */}
              <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Alle Beloningen</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {family.rewards && family.rewards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {family.rewards
                        .filter(reward => rewardFilter === 'all' || reward.type === rewardFilter)
                        .map((reward) => (
                          <Card key={reward.id} className="bg-white/80 hover:shadow-lg transition-all duration-200 border-gray-100 hover:border-gray-200">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                                    <Gift className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg">{reward.name}</h3>
                                    <p className="text-sm text-gray-600 capitalize">{reward.type}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold">
                                  {reward.points} punten
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="secondary"
                                  className={`px-3 py-1 text-xs font-medium ${
                                    reward.type === 'privilege' ? 'bg-blue-100 text-blue-800' :
                                    reward.type === 'experience' ? 'bg-purple-100 text-purple-800' :
                                    reward.type === 'donation' ? 'bg-green-100 text-green-800' :
                                    reward.type === 'money' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {reward.type === 'privilege' ? 'Privileges' :
                                   reward.type === 'experience' ? 'Ervaring' :
                                   reward.type === 'donation' ? 'Donatie' :
                                   reward.type === 'money' ? 'Geld' : reward.type}
                                </Badge>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditReward(reward)}
                                    className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteReward(reward.id, reward.name)}
                                    className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gift className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Nog geen beloningen toegevoegd</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Stel aantrekkelijke beloningen in om jullie kinderen te motiveren voor hun inspanningen.
                      </p>
                      <Button onClick={() => setIsAddRewardOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Eerste Beloning Toevoegen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliments" className="space-y-8 mt-8">
              {/* Professional Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Complimenten Versturen</h2>
                  <p className="text-sm text-gray-600 mt-1">Versterk jullie band met positieve woorden</p>
                </div>
              </div>

              {/* Professional Stats Card */}
              <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
                <CardContent className="pt-8 pb-6">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                        <Users className="h-6 w-6 text-pink-600" />
                      </div>
                      <div className="text-3xl font-bold text-pink-600">{family.children.length}</div>
                      <p className="text-sm font-medium text-pink-800">Kinderen</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <Heart className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="text-3xl font-bold text-purple-600">8</div>
                      <p className="text-sm font-medium text-purple-800">Compliment Kaarten</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Gift className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-green-600">∞</div>
                      <p className="text-sm font-medium text-green-800">Gratis Versturen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliment Cards Component */}
              <ComplimentCards />
            </TabsContent>

            <TabsContent value="actions" className="space-y-8 mt-8">
              {/* Professional Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Goedkeuringen</h2>
                  <p className="text-sm text-gray-600 mt-1">Beoordeel en keur ingediende klusjes goed</p>
                </div>
                <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold ${totalPending > 0 ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-green-300 text-green-700 bg-green-50'}`}>
                  {totalPending > 0 ? `${totalPending} actie${totalPending !== 1 ? 's' : ''} vereist` : 'Alles up-to-date'}
                </Badge>
              </div>

              {/* Action Required Section */}
              {totalPending > 0 ? (
                <div className="space-y-6">
                  {/* Pending Approvals */}
                  {pendingApprovals.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-orange-800">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          Klusjes Goedkeuren ({pendingApprovals.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {pendingApprovals.map((chore) => (
                            <div key={chore.id} className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-4">
                                {chore.photoUrl ? (
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={chore.photoUrl}
                                      alt="Klusje foto"
                                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => handleQuickApprove(chore.id)}
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <CheckCircle className="h-8 w-8 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold">{chore.name}</p>
                                  <p className="text-sm text-gray-600">
                                    Ingediend door {family.children.find(c => c.id === chore.submittedBy)?.name}
                                  </p>
                                  <p className="text-sm font-medium text-green-600">{chore.points} punten waard</p>
                                </div>
                              </div>
                              <Button
                                size="lg"
                                onClick={() => handleApproveChore(chore.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Goedkeuren
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Empty Savings Alerts */}
                  {emptySavings.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-blue-800">
                          <DollarSign className="h-5 w-5 mr-2" />
                          Lege Spaarpotten ({emptySavings.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {emptySavings.map((child) => (
                            <div key={child.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback>{child.avatar || child.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{child.name}</p>
                                  <p className="text-sm text-gray-600">Huidige punten: {child.points}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                Spaarpot is leeg
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Alles loopt perfect! 🎉</h3>
                    <p className="text-gray-600 text-lg">
                      Er zijn geen klusjes die wachten op goedkeuring en alle spaarpotten zijn gevuld.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 mt-8">
              {/* Professional Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Instellingen</h2>
                  <p className="text-sm text-gray-600 mt-1">Beheer jullie account en voorkeuren</p>
                </div>
              </div>

              <Card className="bg-white/50 backdrop-blur-sm border-gray-200/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-gray-600" />
                    Account Informatie
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Familie Naam
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-900 font-medium">{family.familyName}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Familie Code
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-900 font-mono font-bold">{family.familyCode}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        E-mail Adres
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-900">{family.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Abonnement
                      </label>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <Badge variant={family.subscription?.plan === 'premium' ? 'default' : 'secondary'} className="px-3 py-1">
                          {family.subscription?.plan === 'premium' ? 'Premium' : 'Starter'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = '/app/upgrade'}
                          className="ml-auto"
                        >
                          {family.subscription?.plan === 'premium' ? 'Beheren' : 'Upgrade'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Geavanceerde Instellingen
                    <Button
                      onClick={handleSaveAutomationSettings}
                      disabled={isSavingSettings}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-sm font-medium px-4 py-2 h-9"
                    >
                      {isSavingSettings ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Automatische Uitbetalingen</h4>
                      <p className="text-sm text-gray-600">Elke vrijdagavond automatisch uitbetalen</p>
                    </div>
                    <Switch
                      checked={automationSettings.autoPayouts}
                      onCheckedChange={(checked) =>
                        setAutomationSettings(prev => ({ ...prev, autoPayouts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Herinneringen</h4>
                      <p className="text-sm text-gray-600">Dagelijkse notificaties voor pending approvals</p>
                    </div>
                    <Switch
                      checked={automationSettings.dailyReminders}
                      onCheckedChange={(checked) =>
                        setAutomationSettings(prev => ({ ...prev, dailyReminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Foto Goedkeuringen</h4>
                      <p className="text-sm text-gray-600">One-click goedkeuringen voor klusjes met foto</p>
                    </div>
                    <Switch
                      checked={automationSettings.photoApprovals}
                      onCheckedChange={(checked) =>
                        setAutomationSettings(prev => ({ ...prev, photoApprovals: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gevarenzone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <h4 className="font-medium text-red-800">Account Verwijderen</h4>
                        <p className="text-sm text-red-600">Dit verwijdert permanent alle gegevens</p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Verwijder Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </ScrollArea>

      {/* Modals */}
      <AddChildModal isOpen={isAddChildOpen} setIsOpen={setIsAddChildOpen} />
      <EditChildModal
        isOpen={isEditChildOpen}
        setIsOpen={setIsEditChildOpen}
        child={selectedChild!}
      />
      <AddChoreModal isOpen={isAddChoreOpen} setIsOpen={setIsAddChoreOpen} />
      <EditChoreModal
        isOpen={isEditChoreOpen}
        setIsOpen={setIsEditChoreOpen}
        chore={selectedChore!}
      />
      <AddRewardModal isOpen={isAddRewardOpen} setIsOpen={setIsAddRewardOpen} />
      <EditRewardModal
        isOpen={isEditRewardOpen}
        setIsOpen={setIsEditRewardOpen}
        reward={selectedReward!}
      />
      <AddTeamChoreModal isOpen={isAddTeamChoreOpen} setIsOpen={setIsAddTeamChoreOpen} />
      <EditTeamChoreModal
        isOpen={isEditTeamChoreOpen}
        setIsOpen={setIsEditTeamChoreOpen}
        teamChore={selectedTeamChore!}
      />

      {/* Onboarding Wizard for setting up chores */}
      {onboardingChild && (
        <OnboardingWizard
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          child={{
            id: onboardingChild.id,
            name: onboardingChild.name,
          }}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
}