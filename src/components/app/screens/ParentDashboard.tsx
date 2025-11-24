'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  RefreshCw
} from 'lucide-react';
import type { Chore, Child, Reward } from '@/lib/types';
import AddChildModal from '../models/AddChildModal';
import EditChildModal from '../models/EditChildModal';
import AddChoreModal from '../models/AddChoreModal';
import EditChoreModal from '../models/EditChoreModal';
import AddRewardModal from '../models/AddRewardModal';
import EditRewardModal from '../models/EditRewardModal';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [automationSettings, setAutomationSettings] = useState({
    autoPayouts: true,
    dailyReminders: true,
    photoApprovals: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

  if (!family) return null;

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
          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden p-4 flex justify-between items-center bg-white shadow-sm border-b">
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {activeTab === 'overview' && 'Overzicht'}
            {activeTab === 'children' && 'Kinderen'}
            {activeTab === 'chores' && 'Klusjes'}
            {activeTab === 'rewards' && 'Beloningen'}
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
              className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 text-xs px-2 py-1"
              onClick={() => window.location.href = '/app/upgrade'}
            >
              ⭐ Premium
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('settings')}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <main className="p-4 pb-20 md:pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overzicht
                </TabsTrigger>
                <TabsTrigger value="children" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kinderen
                </TabsTrigger>
                <TabsTrigger value="chores" className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Klusjes
                </TabsTrigger>
                <TabsTrigger value="rewards" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Beloningen
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Goedkeuren
                  {totalPending > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {totalPending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Instellingen
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
              <div className="grid grid-cols-5 h-16">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-xs font-medium">Home</span>
                </button>
                <button
                  onClick={() => setActiveTab('children')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                    activeTab === 'children'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-medium">Kinderen</span>
                </button>
                <button
                  onClick={() => setActiveTab('chores')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                    activeTab === 'chores'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ListTodo className="h-5 w-5" />
                  <span className="text-xs font-medium">Klusjes</span>
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                    activeTab === 'rewards'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Gift className="h-5 w-5" />
                  <span className="text-xs font-medium">Beloningen</span>
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors relative ${
                    activeTab === 'actions'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-xs font-medium">Goedkeuren</span>
                  {totalPending > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {totalPending}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Family Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Familie Overzicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {family.children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{child.name[0]}</span>
                            </div>
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Deze week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Voltooide klusjes</span>
                        <span className="font-bold">{family.chores.filter(c => c.status === 'approved').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Totaal verdiend</span>
                        <span className="font-bold text-green-600">
                          €{family.children.reduce((sum, child) => sum + child.points, 0) / 100}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Actieve kinderen</span>
                        <span className="font-bold">{family.children.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="children" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Kinderen Beheren
                    </span>
                    <Button onClick={() => setIsAddChildOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Kind Toevoegen
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {family.children.length > 0 ? (
                      family.children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                              {child.avatar}
                            </div>
                            <div>
                              <p className="font-medium">{child.name}</p>
                              <p className="text-sm text-gray-600">
                                Level {Math.floor(child.totalXpEver / 100) + 1} • {child.points} punten
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <p className="text-sm text-gray-500">PIN: {child.pin}</p>
                              <p className="text-sm text-gray-500">XP: {child.xp}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditChild(child)}
                              className="mr-2"
                            >
                              <Edit className="h-4 w-4" />
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
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Nog geen kinderen toegevoegd</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chores" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ListTodo className="h-5 w-5 mr-2" />
                      Klusjes Beheren
                    </span>
                    <Button onClick={() => setIsAddChoreOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Klusje Toevoegen
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {family.chores.length > 0 ? (
                      family.chores.map((chore) => (
                        <div key={chore.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex-1" onClick={() => handleEditChore(chore)}>
                            <p className="font-medium">{chore.name}</p>
                            <p className="text-sm text-gray-600">{chore.points} punten</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={chore.status === 'available' ? 'default' : chore.status === 'submitted' ? 'secondary' : 'outline'}>
                              {chore.status === 'available' ? 'Beschikbaar' : chore.status === 'submitted' ? 'Ingediend' : 'Goedgekeurd'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditChore(chore)}
                              className="mr-2"
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
                      <p className="text-center text-gray-500 py-8">Nog geen klusjes toegevoegd</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Gift className="h-5 w-5 mr-2" />
                      Beloningen Beheren
                    </span>
                    <Button onClick={() => setIsAddRewardOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Beloning Toevoegen
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {family.rewards.length > 0 ? (
                      family.rewards.map((reward) => (
                        <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex-1" onClick={() => handleEditReward(reward)}>
                            <p className="font-medium">{reward.name}</p>
                            <p className="text-sm text-gray-600">{reward.points} punten • {reward.type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{reward.type}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditReward(reward)}
                              className="mr-2"
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
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Nog geen beloningen toegevoegd</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6 mt-6">
              {/* Action Required Section */}
              {totalPending > 0 ? (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-800">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Actie Vereist ({totalPending})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Pending Approvals */}
                    {pendingApprovals.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-800 mb-3">
                          ❌ {pendingApprovals.length} klusje{pendingApprovals.length !== 1 ? 's' : ''} wacht{pendingApprovals.length !== 1 ? 'en' : ''} op goedkeuring
                        </h4>
                        <div className="space-y-2">
                          {pendingApprovals.slice(0, 5).map((chore) => (
                            <div key={chore.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <div className="flex items-center gap-3">
                                {chore.photoUrl ? (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={chore.photoUrl}
                                      alt="Klusje foto"
                                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => handleQuickApprove(chore.id)}
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{chore.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {family.children.find(c => c.id === chore.submittedBy)?.name}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleApproveChore(chore.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Goedkeuren
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty Savings Alerts */}
                    {emptySavings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-800 mb-3">
                          💰 {emptySavings.length} kind{emptySavings.length !== 1 ? 'eren' : ''} {emptySavings.length !== 1 ? 'hebben' : 'heeft'} een lege spaarpot
                        </h4>
                        <div className="space-y-2">
                          {emptySavings.map((child) => (
                            <div key={child.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">{child.name[0]}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{child.name}</p>
                                  <p className="text-sm text-gray-600">{child.points} punten</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                Leeg
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Alles loopt goed!</h3>
                    <p className="text-gray-600">Er zijn geen klusjes die wachten op goedkeuring.</p>
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
    </div>
  );
}