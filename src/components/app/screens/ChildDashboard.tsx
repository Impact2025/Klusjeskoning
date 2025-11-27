'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { LogOut, Star, ListTodo, Store, Hourglass, Trophy, Users, Gamepad2, ChevronUp, ChevronDown, Share2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RewardShopModal from '../models/RewardShopModal';
import SubmitChoreModal from '../models/SubmitChoreModal';
import LevelsModal from '../models/LevelsModal';
import ChildOnboardingModal from '../models/ChildOnboardingModal';
import { QuestCard } from '@/components/ui/quest-card';
import TeamChores from '@/components/ui/team-chores';
import SpinWheel from '@/components/gamification/SpinWheel';
import StickerAlbum from '@/components/gamification/StickerAlbum';
import FamilyFeed from '@/components/gamification/FamilyFeed';
import SeasonalEvents from '@/components/gamification/SeasonalEvents';
import VirtualRoom from '@/components/gamification/VirtualRoom';
import AIPersona from '@/components/gamification/AIPersona';
import FamilyRanking from '@/components/gamification/FamilyRanking';
import ChampionCelebration from '@/components/gamification/ChampionCelebration';
import type { Chore } from '@/lib/types';
import type { VirtualPet as VirtualPetType } from '@/server/db/schema';
import { getLevelFromXp, LEVEL_BADGES, calculateLevel } from '@/lib/xp-utils';
// Quest chains removed - using actual family chores now
import XPProgressBar from '@/components/ui/xp-progress-bar';
import { Timestamp } from '@/lib/timestamp';
import ComplimentNotification, { useComplimentNotifications } from '@/components/gamification/ComplimentNotification';
import { ChildInvitation } from '@/components/powerklusjes/ChildInvitation';
import { CoachWidget } from '@/components/coach';

const levels = [
  { points: 1000, name: 'KlusjesKoning', icon: '👑' },
  { points: 500, name: 'Gouden Draak', icon: '🐲' },
  { points: 300, name: 'Grote Dino', icon: '🦖' },
  { points: 150, name: 'Kleine Dino', icon: '🐤' },
  { points: 50, name: 'Kuiken', icon: '🐣' },
  { points: 0, name: 'Ei', icon: '🥚' },
];

const getLevel = (points: number) => {
  return levels.find(l => points >= l.points) || levels[levels.length - 1];
};


export default function ChildDashboard() {
  const { user, family, logout, goodCauses } = useApp();
  const [isRewardShopOpen, setRewardShopOpen] = useState(false);
  const [isSubmitChoreOpen, setSubmitChoreOpen] = useState(false);
  const [isLevelsModalOpen, setLevelsModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isGamesMenuOpen, setIsGamesMenuOpen] = useState(false);
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  const [isStickerAlbumOpen, setIsStickerAlbumOpen] = useState(false);
  const [isFamilyFeedOpen, setIsFamilyFeedOpen] = useState(false);
  const [isSeasonalEventsOpen, setIsSeasonalEventsOpen] = useState(false);
  const [isVirtualRoomOpen, setIsVirtualRoomOpen] = useState(false);
  const [isAIPersonaOpen, setIsAIPersonaOpen] = useState(false);
  const [isPowerKlusjesOpen, setIsPowerKlusjesOpen] = useState(false);
  const [isFamilyRankingOpen, setIsFamilyRankingOpen] = useState(false);
  const [championCelebration, setChampionCelebration] = useState<{
    isOpen: boolean;
    championName: string;
    category: string;
    rewards: string[];
  } | null>(null);
  const [isGoldenPet, setIsGoldenPet] = useState(false);
  const [isVirtualPetOpen, setIsVirtualPetOpen] = useState(false);
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
  const [optimisticallySubmittedChores, setOptimisticallySubmittedChores] = useState<Set<string>>(new Set());
  const [virtualPet, setVirtualPet] = useState<VirtualPetType | null>(null);
  const [isPetLoading, setIsPetLoading] = useState(true);
  const [spinsAvailable, setSpinsAvailable] = useState(0);
  const [isSpinLoading, setIsSpinLoading] = useState(true);
  const [lastPetLoad, setLastPetLoad] = useState(0);
  const [lastSpinLoad, setLastSpinLoad] = useState(0);

  // Compliment notifications
  const { compliments, addCompliment, dismissCompliment } = useComplimentNotifications();

  // Check if child has completed onboarding
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const onboardingCompleted = localStorage.getItem(`child_onboarding_${user.id}`);
      if (!onboardingCompleted) {
        // Small delay to ensure the dashboard has loaded
        setTimeout(() => setIsOnboardingOpen(true), 1000);
      }
    }
  }, [user]);

  const loadVirtualPet = useCallback(async () => {
    if (isPetLoading) return; // Prevent multiple simultaneous calls

    const now = Date.now();
    if (now - lastPetLoad < 60000) return; // Debounce: don't call more than once every 60 seconds

    try {
      setIsPetLoading(true);
      setLastPetLoad(now);
      const response = await fetch(`/api/gamification/pet?childId=${user!.id}`);
      if (response.ok) {
        const data = await response.json();
        setVirtualPet(data.pet);
      }
    } catch (error) {
      console.error('Error loading virtual pet:', error);
    } finally {
      setIsPetLoading(false);
    }
  }, [user?.id, isPetLoading, lastPetLoad]);

  const loadDailySpins = useCallback(async () => {
    if (isSpinLoading) return; // Prevent multiple simultaneous calls

    const now = Date.now();
    if (now - lastSpinLoad < 60000) return; // Debounce: don't call more than once every 60 seconds

    try {
      setIsSpinLoading(true);
      setLastSpinLoad(now);
      const response = await fetch(`/api/daily-spin?childId=${user!.id}`);
      if (response.ok) {
        const data = await response.json();
        setSpinsAvailable(data.spinsAvailable);
      }
    } catch (error) {
      console.error('Error loading daily spins:', error);
    } finally {
      setIsSpinLoading(false);
    }
  }, [user?.id, isSpinLoading, lastSpinLoad]);

  const handlePetFeed = async () => {
    try {
      const response = await fetch('/api/gamification/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: user!.id, action: 'feed' }),
      });
      if (response.ok) {
        const data = await response.json();
        setVirtualPet(data.pet);
      }
    } catch (error) {
      console.error('Error feeding pet:', error);
    }
  };

  const handlePetPlay = async () => {
    try {
      const response = await fetch('/api/gamification/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: user!.id, action: 'play' }),
      });
      if (response.ok) {
        const data = await response.json();
        setVirtualPet(data.pet);
      }
    } catch (error) {
      console.error('Error playing with pet:', error);
    }
  };

  const handlePetRename = async (newName: string) => {
    try {
      const response = await fetch('/api/gamification/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: user!.id, action: 'rename', petName: newName }),
      });
      if (response.ok) {
        const data = await response.json();
        setVirtualPet(data.pet);
      }
    } catch (error) {
      console.error('Error renaming pet:', error);
    }
  };

  const handleSpin = async () => {
    try {
      const response = await fetch('/api/daily-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: user!.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setSpinsAvailable(data.spinsRemaining);
        // Refresh points/XP display
        // This will be handled by the parent component's state management
        return data.reward;
      }
    } catch (error) {
      console.error('Error spinning:', error);
      throw error;
    }
  };

  // Load compliments from localStorage
  const loadCompliments = useCallback(() => {
    if (!user) return;

    const storedCompliments = JSON.parse(
      localStorage.getItem(`child_compliments_${user.id}`) || '[]'
    );

    // Convert stored compliments to the format expected by the hook
    storedCompliments.forEach((compliment: any) => {
      addCompliment(compliment.from, compliment.card);
    });
  }, [user, addCompliment]);

  // Load virtual pet, daily spins, and compliments
  useEffect(() => {
    if (user) {
      loadVirtualPet();
      loadDailySpins();
      loadCompliments();
      checkForNewChampions();
    }
  }, [user?.id]); // Remove function dependencies to prevent infinite loops

  // Check for new weekly champions and show celebration
  const checkForNewChampions = useCallback(async () => {
    if (!user || !family) return;

    try {
      // Check if user became champion this week
      const response = await fetch(`/api/rankings?action=check_champion&childId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.isNewChampion && data.category) {
          setChampionCelebration({
            isOpen: true,
            championName: user.name,
            category: data.category,
            rewards: ['golden_crown', 'extra_spin', 'golden_pet', 'xp_bonus']
          });
        }

        // Check if user currently has golden pet effect
        setIsGoldenPet(data.isGoldenPet || false);
      }
    } catch (error) {
      console.error('Error checking for champions:', error);
    }
  }, [user, family]);

  // Listen for storage changes (when parent sends compliments)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('child_compliments_') && user && e.key.endsWith(user.id)) {
        // Only process new compliments, not all stored ones
        const newCompliments = JSON.parse(e.newValue || '[]');
        const oldCompliments = JSON.parse(e.oldValue || '[]');

        // Find new compliments that weren't in the old storage
        const addedCompliments = newCompliments.filter((newC: any) =>
          !oldCompliments.some((oldC: any) =>
            oldC.from === newC.from && oldC.timestamp === newC.timestamp
          )
        );

        // Only add the new compliments to avoid duplicates
        addedCompliments.forEach((compliment: any) => {
          addCompliment(compliment.from, compliment.card);
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, addCompliment]);

  // Enhanced authentication check - ensure both user and family exist
  if (!user || !family) return null;

  // Memoize expensive calculations to prevent re-renders
  const activeCause = useMemo(() => {
    const now = Timestamp.now();
    const nowMillis = now.toMillis();
    return goodCauses?.find((cause) => {
      const start = cause.startDate?.toMillis?.() ?? 0;
      const end = cause.endDate?.toMillis?.() ?? 0;
      return start <= nowMillis && nowMillis <= end;
    });
  }, [goodCauses]);

  const currentLevelInfo = useMemo(() =>
    calculateLevel(user.totalXpEver || 0),
    [user.totalXpEver]
  );
  
  const handleSubmissionStart = (choreId: string) => {
    setOptimisticallySubmittedChores(prev => new Set(prev).add(choreId));
  };

  const handleSubmissionSuccess = (choreId: string) => {
    // Keep it in optimistic set until state updates
  };

  const handleSubmissionError = (choreId: string) => {
    // Remove from optimistic set on error
    setOptimisticallySubmittedChores(prev => {
      const newSet = new Set(prev);
      newSet.delete(choreId);
      return newSet;
    });
  };

  const handleModalClose = (choreId: string | null) => {
    if (choreId) {
      // Remove from optimistic set if modal is closed without submission
      setOptimisticallySubmittedChores(prev => {
        const newSet = new Set(prev);
        newSet.delete(choreId);
        return newSet;
      });
    }
  };

  const openSubmitModal = (choreId: string) => {
    console.log('Opening submit modal for chore:', choreId);
    setSelectedChoreId(choreId);
    setSubmitChoreOpen(true);
  };

  const handleLogout = () => {
    logout();
  }

  // Handle receiving compliments from parents
  const handleReceiveCompliment = (from: string, card: any) => {
    addCompliment(from, card);
  };


  // Get available chores from family chores (created by parents)
  const availableChores = useMemo(() => {
    return family.chores.filter(c => {
      const isAvailable = c.status === 'available';
      // Check if this chore is assigned to this child (or assigned to everyone if assignedTo is empty)
      const isAssigned = !c.assignedTo || c.assignedTo.length === 0 || c.assignedTo.includes(user.id);
      const isOptimisticallySubmitted = optimisticallySubmittedChores.has(c.id);
      return isAvailable && isAssigned && !isOptimisticallySubmitted;
    });
  }, [family.chores, user.id, optimisticallySubmittedChores]);

  const submittedChores = useMemo(() =>
    family.chores.filter(c => c.status === 'submitted' && c.submittedBy === user.id),
    [family.chores, user.id]
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Professional Child Header */}
      <header className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2),transparent_50%)]" />
        </div>

        <div className="relative px-6 pt-8 pb-6">
          {/* Top Row - Avatar and Basic Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Professional Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-xs font-bold text-white">{currentLevelInfo.level}</span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">{user.name}</h1>
                <p className="text-white/90 font-medium">{currentLevelInfo.title}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white/80">Online</span>
                </div>
              </div>
            </div>

            {/* Points & Logout */}
            <div className="flex items-center space-x-3">
              {/* Enhanced Points Display */}
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{user.points}</div>
                    <div className="text-xs text-white/80">Punten</div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white hover:text-white transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* XP Progress Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="text-white font-semibold">Ervaringspunten</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{user.totalXpEver || 0} XP</div>
                <div className="text-xs text-white/80">Totaal verdiend</div>
              </div>
            </div>

            <XPProgressBar
              currentXP={user.xp % 100}
              xpToNextLevel={100}
              level={getLevelFromXp(user.totalXpEver || 0)}
              animated={true}
              showSoundEffect={true}
              className="text-sm"
            />

            <div className="flex justify-between items-center mt-3 text-sm">
              <span className="text-white/80">Level {currentLevelInfo.level}</span>
              <span className="text-white/80">{user.xp % 100}/100 XP naar level {currentLevelInfo.level + 1}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Compliment Notification Banner */}
      {compliments.length > 0 && (
        <div className="px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-200">
          <ComplimentNotification
            compliment={compliments[0]}
            onDismiss={dismissCompliment}
            className="max-w-2xl mx-auto"
          />
        </div>
      )}

      <ScrollArea className="flex-grow">
        <main className="p-6 space-y-8 pb-24">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Welkom terug, {user.name}! 👋</h2>
            <p className="text-gray-600">Laten we samen klusjes klaren en punten verdienen!</p>
          </div>

          {/* Primary Focus: Available Chores */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ListTodo className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Nieuwe Uitdagingen</h2>
                  <p className="text-sm text-gray-600">Klaar om te beginnen?</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-2 rounded-full">
                <span className="text-sm font-semibold text-blue-700">{availableChores.length} beschikbaar</span>
              </div>
            </div>

            {availableChores.length > 0 ? (
              <div className="grid gap-4">
                {availableChores.map((chore: Chore) => (
                  <QuestCard
                    key={chore.id}
                    chore={chore}
                    onComplete={openSubmitModal}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-dashed border-blue-200 shadow-lg">
                <div className="space-y-4">
                  <div className="text-6xl animate-bounce">🎯</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nieuwe klusjes komen eraan!</h3>
                    <p className="text-gray-600">Houd je telefoon in de gaten voor spannende uitdagingen.</p>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Secondary: Submitted Chores */}
          {submittedChores.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Hourglass className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Wachtend op Goedkeuring</h2>
                  <p className="text-sm text-gray-600">Goed gedaan! Je ouders controleren het nu.</p>
                </div>
              </div>
              <div className="grid gap-4">
                {submittedChores.map((chore: Chore) => (
                  <Card key={chore.id} className="p-5 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">✓</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{chore.name}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></span>
                            Wacht op goedkeuring van ouders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">+{chore.points}</div>
                        <div className="text-xs text-gray-500">punten</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Team Chores - Only show if there are any */}
          {family.teamChores && family.teamChores.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Team Klusjes
              </h2>
              <TeamChores />
            </div>
          )}

          {/* Fun Elements - Professional Design */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Extra Fun & Beloningen</h2>
              <p className="text-gray-600">Verdien nog meer punten met deze leuke activiteiten!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Spin - Enhanced */}
              {!isSpinLoading && spinsAvailable > 0 && (
                <Card className="p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => setIsSpinWheelOpen(true)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <span className="text-2xl">🎰</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Dagelijkse Spin</h3>
                      <p className="text-sm text-gray-600 mb-2">Draai voor gratis prijzen!</p>
                      <div className="flex items-center space-x-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {spinsAvailable} spin{spinsAvailable !== 1 ? 's' : ''} beschikbaar
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">🎁</div>
                      <div className="text-xs text-gray-500">Gratis</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Virtual Pet - Enhanced */}
              {virtualPet && !isPetLoading && (
                <Card
                  className={`p-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${isGoldenPet ? 'ring-2 ring-yellow-400 ring-opacity-75 shadow-yellow-200' : ''}`}
                  onClick={() => setIsVirtualPetOpen(true)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 ${isGoldenPet ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}>
                      <span className="text-2xl">{isGoldenPet ? '👑' : '🐾'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{virtualPet.name}</h3>
                        {isGoldenPet && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                            🏆 Kampioen!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Jouw trouwe huisdier</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Honger</span>
                          <span className="font-semibold text-green-600">{virtualPet.hunger}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${virtualPet.hunger}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePetFeed();
                        }}
                        size="sm"
                        className="w-10 h-10 p-0 bg-green-500 hover:bg-green-600 rounded-xl shadow-md"
                      >
                        🥕
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePetPlay();
                        }}
                        size="sm"
                        className="w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md"
                      >
                        ⚽
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Good Cause - Only show if active */}
          {activeCause && (
            <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🌍</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-rose-900">{activeCause.name}</h3>
                    <p className="text-sm text-rose-700">{activeCause.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </ScrollArea>
      
      {/* Professional Bottom Navigation - Mobile Optimized */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50 shadow-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-16 px-2 sm:px-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] p-1 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold mt-1">Klusjes</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setRewardShopOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] p-1 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-200 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold mt-1">Winkel</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsPowerKlusjesOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold mt-1">Power</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsGamesMenuOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-200 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold mt-1">Spelletjes</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setLevelsModalOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] p-1 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold mt-1">Prestaties</span>
          </Button>
        </div>
      </nav>
      
      <RewardShopModal isOpen={isRewardShopOpen} setIsOpen={setRewardShopOpen} />
      <SubmitChoreModal
        isOpen={isSubmitChoreOpen}
        setIsOpen={setSubmitChoreOpen}
        choreId={selectedChoreId}
        onSubmissionStart={handleSubmissionStart}
        onSubmissionSuccess={handleSubmissionSuccess}
        onSubmissionError={handleSubmissionError}
        onModalClose={handleModalClose}
      />
      <LevelsModal isOpen={isLevelsModalOpen} setIsOpen={setLevelsModalOpen} />
      <ChildOnboardingModal isOpen={isOnboardingOpen} setIsOpen={setIsOnboardingOpen} />

      {/* Game Modals - Mobile Optimized */}
      <Dialog open={isSpinWheelOpen} onOpenChange={setIsSpinWheelOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Dagelijkse Spin</DialogTitle>
          <SpinWheel
            spinsAvailable={spinsAvailable}
            onSpin={handleSpin}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isStickerAlbumOpen} onOpenChange={setIsStickerAlbumOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Sticker Album</DialogTitle>
          <StickerAlbum childId={user!.id} />
        </DialogContent>
      </Dialog>

      <Dialog open={isFamilyFeedOpen} onOpenChange={setIsFamilyFeedOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Familie Feed</DialogTitle>
          <FamilyFeed />
        </DialogContent>
      </Dialog>

      <Dialog open={isSeasonalEventsOpen} onOpenChange={setIsSeasonalEventsOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Seizoens Events</DialogTitle>
          <SeasonalEvents />
        </DialogContent>
      </Dialog>

      <Dialog open={isVirtualRoomOpen} onOpenChange={setIsVirtualRoomOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Virtuele Kamer</DialogTitle>
          <VirtualRoom />
        </DialogContent>
      </Dialog>

      <Dialog open={isAIPersonaOpen} onOpenChange={setIsAIPersonaOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>AI Helper</DialogTitle>
          <AIPersona />
        </DialogContent>
      </Dialog>

      {/* PowerKlusjes Modal */}
      <Dialog open={isPowerKlusjesOpen} onOpenChange={setIsPowerKlusjesOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center">
            <Share2 className="w-6 h-6 mr-2 text-green-600" />
            PowerKlusjes Uitnodiging
          </DialogTitle>
          <ChildInvitation childId={user!.id} childName={user!.name} />
        </DialogContent>
      </Dialog>

      {/* Family Ranking Modal */}
      <FamilyRanking
        isOpen={isFamilyRankingOpen}
        onClose={() => setIsFamilyRankingOpen(false)}
      />

      {/* Virtual Pet Modal */}
      <Dialog open={isVirtualPetOpen} onOpenChange={setIsVirtualPetOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center">
            <span className="mr-2">🐾</span>
            {virtualPet?.name}
            {isGoldenPet && <span className="ml-2 text-yellow-500 animate-pulse">👑 Kampioen!</span>}
          </DialogTitle>
          {virtualPet && (
            <div className="p-4 sm:p-6">
              {/* TODO: Create VirtualPet component */}
              <p className="text-center text-gray-600">
                Virtual pet details voor {virtualPet.name} worden binnenkort toegevoegd!
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => handlePetFeed()} className="min-h-[44px]">Voer {virtualPet.name}</Button>
                <Button onClick={() => handlePetPlay()} className="min-h-[44px]">Speel met {virtualPet.name}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Champion Celebration Modal */}
      {championCelebration && (
        <ChampionCelebration
          isOpen={championCelebration.isOpen}
          onClose={() => setChampionCelebration(null)}
          championName={championCelebration.championName}
          category={championCelebration.category}
          rewards={championCelebration.rewards}
        />
      )}

      {/* Games Menu Modal - Mobile Optimized */}
      <Dialog open={isGamesMenuOpen} onOpenChange={setIsGamesMenuOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Gamepad2 className="w-6 h-6 mr-2 text-purple-600" />
              Meer Spelletjes & Activiteiten
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 sm:space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto min-h-[56px] p-3 sm:p-4 active:scale-[0.98] transition-transform"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsStickerAlbumOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0">
                  🎟️
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base">Sticker Album</div>
                  <div className="text-xs sm:text-sm text-gray-600">Verzamel en ruil stickers</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto min-h-[56px] p-3 sm:p-4 active:scale-[0.98] transition-transform"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsFamilyFeedOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0">
                  📱
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base">Familie Feed</div>
                  <div className="text-xs sm:text-sm text-gray-600">Zie wat iedereen doet</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto min-h-[56px] p-3 sm:p-4 active:scale-[0.98] transition-transform"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsSeasonalEventsOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0">
                  🎄
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base">Seizoens Events</div>
                  <div className="text-xs sm:text-sm text-gray-600">Speciale feestdagen</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto min-h-[56px] p-3 sm:p-4 active:scale-[0.98] transition-transform"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsVirtualRoomOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0">
                  🏠
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base">Virtuele Kamer</div>
                  <div className="text-xs sm:text-sm text-gray-600">Ontwerp je eigen ruimte</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto min-h-[56px] p-3 sm:p-4 active:scale-[0.98] transition-transform"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsFamilyRankingOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0">
                  🏆
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base">Ranglijst</div>
                  <div className="text-xs sm:text-sm text-gray-600">Zie hoe je scoort</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto min-h-[56px] p-3 sm:p-4 active:scale-[0.98] transition-transform"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsAIPersonaOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white mr-3 flex-shrink-0">
                  🤖
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm sm:text-base">AI Helper</div>
                  <div className="text-xs sm:text-sm text-gray-600">Krijg hulp en tips</div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kobi AI Coach Widget */}
      {user && (
        <CoachWidget
          childId={user.id}
          childName={user.name}
        />
      )}
    </div>
  );
}
