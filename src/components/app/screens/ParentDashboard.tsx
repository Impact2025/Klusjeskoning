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
  Trophy
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

export default function ParentDashboard() {
  const { family, logout, approveChore, deleteItem, user } = useApp();
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
      await handleAction('deleteTeamChore', { teamChoreId });
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

  // Enhanced authentication check - ensure both family and user exist
  if (!family || !user) return null;

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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')} className="p-2">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Header - Clean and Professional */}
      <header className="md:hidden p-4 flex justify-between items-center bg-white shadow-sm border-b">
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

      {/* Desktop Navigation - Clean and Professional */}
      <div className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 h-14 bg-transparent">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <BarChart3 className="h-5 w-5" />
              <span>Overzicht</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Users className="h-5 w-5" />
              <span>Kinderen</span>
            </TabsTrigger>
            <TabsTrigger value="chores" className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <ListTodo className="h-5 w-5" />
              <span>Klusjes</span>
            </TabsTrigger>
            <TabsTrigger value="team-chores" className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Users className="h-5 w-5" />
              <span>Team Klusjes</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Gift className="h-5 w-5" />
              <span>Beloningen</span>
            </TabsTrigger>
            <TabsTrigger value="compliments" className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Heart className="h-5 w-5" />
              <span>Complimenten</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 relative">
              <AlertTriangle className="h-5 w-5" />
              <span>Goedkeuren</span>
              {totalPending > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {totalPending}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-grow">
        <main className="p-4 pb-20 md:pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Mobile Bottom Navigation - Clean and Professional */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 shadow-lg">
              <div className="grid grid-cols-7 h-16">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-medium">Overzicht</span>
                </button>
                <button
                  onClick={() => setActiveTab('children')}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ${
                    activeTab === 'children'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Kinderen</span>
                </button>
                <button
                  onClick={() => setActiveTab('chores')}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ${
                    activeTab === 'chores'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ListTodo className="h-4 w-4" />
                  <span className="text-xs font-medium">Klusjes</span>
                </button>
                <button
                  onClick={() => setActiveTab('team-chores')}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ${
                    activeTab === 'team-chores'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Team</span>
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ${
                    activeTab === 'rewards'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Gift className="h-4 w-4" />
                  <span className="text-xs font-medium">Beloningen</span>
                </button>
                <button
                  onClick={() => setActiveTab('compliments')}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 ${
                    activeTab === 'compliments'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  <span className="text-xs font-medium">Complimenten</span>
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all duration-200 relative ${
                    activeTab === 'actions'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Goedkeuren</span>
                  {totalPending > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {totalPending}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{family.children.length}</div>
                    <p className="text-xs text-gray-600">Kinderen</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{family.chores.filter(c => c.status === 'approved').length}</div>
                    <p className="text-xs text-gray-600">Voltooide klusjes</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div>
                    <p className="text-xs text-gray-600">Te goedkeuren</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">
                      €{family.children.reduce((sum, child) => sum + child.points, 0) / 100}
                    </div>
                    <p className="text-xs text-gray-600">Totaal verdiend</p>
                  </CardContent>
                </Card>
              </div>

              {/* Family Members Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Familie Leden
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {family.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{child.avatar || child.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{child.name}</p>
                            <p className="text-sm text-gray-600">Level {Math.floor(child.totalXpEver / 100) + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{child.points}</p>
                          <p className="text-xs text-gray-500">punten</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Recente Activiteit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {family.chores.slice(-5).reverse().map((chore) => (
                      <div key={chore.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={chore.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                            {chore.status === 'approved' ? '✓' : '⏳'}
                          </Badge>
                          <span className="text-sm">{chore.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {family.children.find(c => c.id === chore.submittedBy)?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="children" className="space-y-6 mt-6">
              {/* Quick Actions */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Kinderen Beheren</h2>
                <Button onClick={() => setIsAddChildOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Kind Toevoegen
                </Button>
              </div>

              {/* Children Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {family.children.length > 0 ? (
                  family.children.map((child) => (
                    <Card key={child.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="text-lg">{child.avatar || child.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{child.name}</CardTitle>
                              <p className="text-sm text-gray-600">Level {Math.floor(child.totalXpEver / 100) + 1}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{child.points} punten</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">PIN Code</p>
                            <p className="font-mono font-bold">{child.pin}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">XP Totaal</p>
                            <p className="font-bold">{child.totalXpEver}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditChild(child)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Bewerken
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteChild(child.id, child.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen kinderen toegevoegd</h3>
                      <p className="text-gray-600 mb-4">
                        Voeg je eerste kind toe om te beginnen met jullie beloningensysteem.
                      </p>
                      <Button onClick={() => setIsAddChildOpen(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Eerste Kind Toevoegen
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="chores" className="space-y-6 mt-6">
              {/* Quick Actions */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Klusjes Beheren</h2>
                <Button onClick={() => setIsAddChoreOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Klusje Toevoegen
                </Button>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {family.chores.filter(c => c.status === 'available').length}
                    </div>
                    <p className="text-xs text-gray-600">Beschikbaar</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">
                      {family.chores.filter(c => c.status === 'submitted').length}
                    </div>
                    <p className="text-xs text-gray-600">Ingediend</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {family.chores.filter(c => c.status === 'approved').length}
                    </div>
                    <p className="text-xs text-gray-600">Goedgekeurd</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">
                      {family.chores.filter(c => (c as any).isTemplate === 1).length}
                    </div>
                    <p className="text-xs text-gray-600">Terugkerend</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recurring Chores Overview */}
              {family.chores.filter(c => (c as any).isTemplate === 1).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Terugkerende Klusjes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {family.chores
                        .filter(c => (c as any).isTemplate === 1)
                        .map((chore) => (
                          <div key={chore.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                            <div className="flex items-center gap-4 flex-1">
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                {(chore as any).recurrenceType === 'daily' ? 'Dagelijks' :
                                 (chore as any).recurrenceType === 'weekly' ? 'Wekelijks' : 'Aangepast'}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium">{chore.name}</p>
                                <p className="text-sm text-gray-600">{chore.points} punten • Template</p>
                                {(chore as any).nextDueDate && (
                                  <p className="text-xs text-purple-600">
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
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteChore(chore.id, chore.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chores List */}
              <Card>
                <CardHeader>
                  <CardTitle>Alle Klusjes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {family.chores.length > 0 ? (
                      family.chores.map((chore) => (
                        <div key={chore.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <Badge
                              variant={chore.status === 'available' ? 'default' : chore.status === 'submitted' ? 'secondary' : 'outline'}
                              className="min-w-fit"
                            >
                              {chore.status === 'available' ? 'Beschikbaar' : chore.status === 'submitted' ? 'Ingediend' : 'Goedgekeurd'}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium">{chore.name}</p>
                              <p className="text-sm text-gray-600">{chore.points} punten • {chore.xpReward} XP</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditChore(chore)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteChore(chore.id, chore.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <ListTodo className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen klusjes toegevoegd</h3>
                        <p className="text-gray-600 mb-4">
                          Klik op "Klusje Toevoegen" om te beginnen met jullie taakensysteem.
                        </p>
                        <Button onClick={() => setIsAddChoreOpen(true)} variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Eerste Klusje Toevoegen
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team-chores" className="space-y-6 mt-6">
              {/* Quick Actions */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Team Klusjes Beheren</h2>
                <Button onClick={() => setIsAddTeamChoreOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Team Klusje Toevoegen
                </Button>
              </div>

              {/* Team Chores List */}
              <Card>
                <CardHeader>
                  <CardTitle>Alle Team Klusjes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {family.teamChores && family.teamChores.length > 0 ? (
                      family.teamChores.map((teamChore) => (
                        <div key={teamChore.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{teamChore.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{teamChore.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center">
                                  {teamChore.completedAt ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-blue-600 mr-1" />
                                  )}
                                  <span className={teamChore.completedAt ? 'text-green-600' : 'text-blue-600'}>
                                    {teamChore.completedAt ? 'Voltooid' : 'Bezig'}
                                  </span>
                                </span>
                                <span className="text-yellow-600 font-medium">
                                  {teamChore.totalPoints} punten te verdelen
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTeamChore(teamChore)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTeamChore(teamChore.id, teamChore.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm">
                              <span>Voortgang</span>
                              <span>{teamChore.progress}%</span>
                            </div>
                            <Progress value={teamChore.progress} className="h-3" />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{teamChore.participatingChildren.length} deelnemers</span>
                            </div>
                            {!teamChore.completedAt && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Samenwerken!
                              </span>
                            )}
                          </div>

                          {teamChore.participatingChildren.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm font-medium mb-2">Deelnemers:</p>
                              <div className="flex flex-wrap gap-2">
                                {teamChore.participatingChildren.map((childId) => {
                                  const child = family.children.find(c => c.id === childId);
                                  return child ? (
                                    <Badge key={childId} variant="secondary" className="text-xs">
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
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen team klusjes toegevoegd</h3>
                        <p className="text-gray-600 mb-4">
                          Team klusjes moedigen samenwerking aan tussen jullie kinderen. Klik op "Team Klusje Toevoegen" om te beginnen.
                        </p>
                        <Button onClick={() => setIsAddTeamChoreOpen(true)} variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Eerste Team Klusje Toevoegen
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6 mt-6">
              {/* Quick Actions */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Beloningen Beheren</h2>
                <Button onClick={() => setIsAddRewardOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Beloning Toevoegen
                </Button>
              </div>

              {/* Category Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Categorieën</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      variant={rewardFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('all')}
                      className="h-12"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Alle
                    </Button>
                    <Button
                      variant={rewardFilter === 'privileges' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('privileges')}
                      className="h-12"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Privileges
                    </Button>
                    <Button
                      variant={rewardFilter === 'experience' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('experience')}
                      className="h-12"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Ervaringen
                    </Button>
                    <Button
                      variant={rewardFilter === 'financial' ? 'default' : 'outline'}
                      onClick={() => setRewardFilter('financial')}
                      className="h-12"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Financieel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rewards List */}
              <Card>
                <CardHeader>
                  <CardTitle>Alle Beloningen</CardTitle>
                </CardHeader>
                <CardContent>
                  {family.rewards && family.rewards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {family.rewards
                        .filter(reward => rewardFilter === 'all' || reward.type === rewardFilter)
                        .map((reward) => (
                          <Card key={reward.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="text-3xl">🎁</div>
                                  <div>
                                    <h3 className="font-bold">{reward.name}</h3>
                                    <p className="text-sm text-gray-600">Type: {reward.type}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">
                                  {reward.points} punten
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="secondary"
                                  className={
                                    reward.type === 'privilege' ? 'bg-blue-100 text-blue-800' :
                                    reward.type === 'experience' ? 'bg-purple-100 text-purple-800' :
                                    reward.type === 'donation' ? 'bg-green-100 text-green-800' :
                                    reward.type === 'money' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }
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
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteReward(reward.id, reward.name)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen beloningen toegevoegd</h3>
                      <p className="text-gray-600 mb-4">
                        Klik op "Beloning Toevoegen" om te beginnen met jullie beloningensysteem.
                      </p>
                      <Button onClick={() => setIsAddRewardOpen(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Eerste Beloning Toevoegen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliments" className="space-y-6 mt-6">
              {/* Quick Actions */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Complimenten Versturen</h2>
              </div>

              {/* Stats Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-pink-600">{family.children.length}</div>
                      <p className="text-xs text-gray-600">Kinderen</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">8</div>
                      <p className="text-xs text-gray-600">Compliment Kaarten</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">∞</div>
                      <p className="text-xs text-gray-600">Gratis Versturen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliment Cards Component */}
              <ComplimentCards />
            </TabsContent>

            <TabsContent value="actions" className="space-y-6 mt-6">
              {/* Quick Actions */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Goedkeuringen</h2>
                <Badge variant="outline" className={totalPending > 0 ? 'border-orange-300 text-orange-700' : 'border-green-300 text-green-700'}>
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

            <TabsContent value="settings" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Instellingen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Familie Naam
                      </label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {family.familyName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Familie Code
                      </label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
                        {family.familyCode}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail
                      </label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {family.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Abonnement
                      </label>
                      <div className="flex items-center gap-2">
                        <Badge variant={family.subscription?.plan === 'premium' ? 'default' : 'secondary'}>
                          {family.subscription?.plan === 'premium' ? 'Premium' : 'Starter'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = '/app/upgrade'}
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
    </div>
  );
}