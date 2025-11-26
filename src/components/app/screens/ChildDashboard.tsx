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
import { getLevelFromXp, LEVEL_BADGES } from '@/lib/xp-utils';
import { QUEST_CHAIN_CHORES } from '@/lib/quest-utils';
import XPProgressBar from '@/components/ui/xp-progress-bar';
import { Timestamp } from '@/lib/timestamp';
import ComplimentNotification, { useComplimentNotifications } from '@/components/gamification/ComplimentNotification';
import { ChildInvitation } from '@/components/powerklusjes/ChildInvitation';

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

  const currentLevel = useMemo(() =>
    LEVEL_BADGES.find(badge => badge.level <= getLevelFromXp(user.totalXpEver || 0)) || LEVEL_BADGES[0],
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


  // Get all chores from quest chains
  const allQuestChores = useMemo(() =>
    Object.values(QUEST_CHAIN_CHORES).flat(),
    []
  );

  const availableChores = useMemo(() => {
    return allQuestChores.filter(c => {
      const isAvailable = c.status === 'available';
      const isAssigned = !c.assignedTo || c.assignedTo.length === 0 || c.assignedTo.includes(user.id);
      const hasSubmitted = family.chores.some(familyChore =>
        familyChore.id === c.id &&
        familyChore.status === 'submitted' &&
        familyChore.submittedBy === user.id
      );
      const isOptimisticallySubmitted = optimisticallySubmittedChores.has(c.id);
      const result = isAvailable && isAssigned && !hasSubmitted && !isOptimisticallySubmitted;
      return result;
    });
  }, [allQuestChores, family.chores, user.id, optimisticallySubmittedChores]);

  const submittedChores = useMemo(() =>
    family.chores.filter(c => c.status === 'submitted' && c.submittedBy === user.id),
    [family.chores, user.id]
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Clean Modern Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-600">Level {getLevelFromXp(user.totalXpEver || 0)} • {currentLevel.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Points Display */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full font-bold text-sm flex items-center">
              <Star className="w-4 h-4 mr-1" />
              {user.points}
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-3">
          <XPProgressBar
            currentXP={user.xp % 100}
            xpToNextLevel={100}
            level={getLevelFromXp(user.totalXpEver || 0)}
            animated={true}
            showSoundEffect={true}
            className="text-xs"
          />
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
        <main className="p-4 space-y-6 pb-24">
          {/* Primary Focus: Available Chores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <ListTodo className="w-6 h-6 mr-2 text-blue-600" />
                Beschikbare Klusjes
              </h2>
              <div className="text-sm text-gray-600">
                {availableChores.length} beschikbaar
              </div>
            </div>

            {availableChores.length > 0 ? (
              <div className="grid gap-3">
                {availableChores.map((chore: Chore) => (
                  <QuestCard
                    key={chore.id}
                    chore={chore}
                    onComplete={openSubmitModal}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-200">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">Geen klusjes beschikbaar</h3>
                <p className="text-gray-600 text-sm">Nieuwe klusjes verschijnen snel!</p>
              </Card>
            )}
          </div>

          {/* Secondary: Submitted Chores */}
          {submittedChores.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Hourglass className="w-5 h-5 mr-2 text-orange-600" />
                Wachtend op Goedkeuring
              </h2>
              <div className="grid gap-3">
                {submittedChores.map((chore: Chore) => (
                  <Card key={chore.id} className="p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{chore.name}</p>
                        <p className="text-sm text-gray-600">Ingediend voor beoordeling</p>
                      </div>
                      <div className="text-orange-600">
                        <Hourglass className="w-5 h-5" />
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

          {/* Fun Elements - Keep minimal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Spin - Compact */}
            {!isSpinLoading && spinsAvailable > 0 && (
              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Dagelijkse Spin</h3>
                    <p className="text-sm text-gray-600">{spinsAvailable} spin{spinsAvailable !== 1 ? 's' : ''} beschikbaar</p>
                  </div>
                  <Button
                    onClick={() => setIsSpinWheelOpen(true)}
                    size="sm"
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                  >
                    Spinnen
                  </Button>
                </div>
              </Card>
            )}

            {/* Virtual Pet - Compact */}
            {virtualPet && !isPetLoading && (
              <Card
                className={`p-4 bg-gradient-to-br from-green-50 to-blue-50 border-green-200 cursor-pointer hover:shadow-md transition-all duration-200 ${isGoldenPet ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
                onClick={() => setIsVirtualPetOpen(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{virtualPet.name}</h3>
                      {isGoldenPet && (
                        <div className="text-yellow-500 animate-pulse">👑</div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Honger: {virtualPet.hunger}/100</p>
                    {isGoldenPet && (
                      <p className="text-xs text-yellow-600 font-medium">🎉 Kampioen Huisdier!</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePetFeed();
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      🥕
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePetPlay();
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      ⚽
                    </Button>
                  </div>
                </div>
              </Card>
            )}
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
      
      {/* Clean Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 h-auto flex-1 text-blue-600"
          >
            <ListTodo className="h-5 w-5" />
            <span className="text-xs font-medium">Klusjes</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setRewardShopOpen(true)}
            className="flex flex-col items-center space-y-1 h-auto flex-1 text-gray-600 hover:text-gray-900"
          >
            <Store className="h-5 w-5" />
            <span className="text-xs font-medium">Winkel</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsPowerKlusjesOpen(true)}
            className="flex flex-col items-center space-y-1 h-auto flex-1 text-green-600 hover:text-green-700"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-xs font-medium">PowerKlusjes</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsGamesMenuOpen(true)}
            className="flex flex-col items-center space-y-1 h-auto flex-1 text-purple-600 hover:text-purple-700"
          >
            <Gamepad2 className="h-5 w-5" />
            <span className="text-xs font-medium">Spelletjes</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setLevelsModalOpen(true)}
            className="flex flex-col items-center space-y-1 h-auto flex-1 text-gray-600 hover:text-gray-900"
          >
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-medium">Prestaties</span>
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

      {/* Game Modals */}
      <Dialog open={isSpinWheelOpen} onOpenChange={setIsSpinWheelOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Dagelijkse Spin</DialogTitle>
          <SpinWheel
            spinsAvailable={spinsAvailable}
            onSpin={handleSpin}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isStickerAlbumOpen} onOpenChange={setIsStickerAlbumOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>Sticker Album</DialogTitle>
          <StickerAlbum childId={user!.id} />
        </DialogContent>
      </Dialog>

      <Dialog open={isFamilyFeedOpen} onOpenChange={setIsFamilyFeedOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>Familie Feed</DialogTitle>
          <FamilyFeed />
        </DialogContent>
      </Dialog>

      <Dialog open={isSeasonalEventsOpen} onOpenChange={setIsSeasonalEventsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>Seizoens Events</DialogTitle>
          <SeasonalEvents />
        </DialogContent>
      </Dialog>

      <Dialog open={isVirtualRoomOpen} onOpenChange={setIsVirtualRoomOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>Virtuele Kamer</DialogTitle>
          <VirtualRoom />
        </DialogContent>
      </Dialog>

      <Dialog open={isAIPersonaOpen} onOpenChange={setIsAIPersonaOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>AI Helper</DialogTitle>
          <AIPersona />
        </DialogContent>
      </Dialog>

      {/* PowerKlusjes Modal */}
      <Dialog open={isPowerKlusjesOpen} onOpenChange={setIsPowerKlusjesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center">
            <span className="mr-2">🐾</span>
            {virtualPet?.name}
            {isGoldenPet && <span className="ml-2 text-yellow-500 animate-pulse">👑 Kampioen!</span>}
          </DialogTitle>
          {virtualPet && (
            <VirtualPet
              pet={virtualPet}
              onFeed={handlePetFeed}
              onPlay={handlePetPlay}
              onRename={handlePetRename}
              isGolden={isGoldenPet}
            />
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

      {/* Games Menu Modal */}
      <Dialog open={isGamesMenuOpen} onOpenChange={setIsGamesMenuOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Gamepad2 className="w-6 h-6 mr-2 text-purple-600" />
              Meer Spelletjes & Activiteiten
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsStickerAlbumOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center text-white mr-3">
                  🎟️
                </div>
                <div className="text-left">
                  <div className="font-semibold">Sticker Album</div>
                  <div className="text-sm text-gray-600">Verzamel en ruil stickers</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsFamilyFeedOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center text-white mr-3">
                  📱
                </div>
                <div className="text-left">
                  <div className="font-semibold">Familie Feed</div>
                  <div className="text-sm text-gray-600">Zie wat iedereen doet</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsSeasonalEventsOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-white mr-3">
                  🎄
                </div>
                <div className="text-left">
                  <div className="font-semibold">Seizoens Events</div>
                  <div className="text-sm text-gray-600">Speciale feestdagen</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsVirtualRoomOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white mr-3">
                  🏠
                </div>
                <div className="text-left">
                  <div className="font-semibold">Virtuele Kamer</div>
                  <div className="text-sm text-gray-600">Ontwerp je eigen ruimte</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsFamilyRankingOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white mr-3">
                  🏆
                </div>
                <div className="text-left">
                  <div className="font-semibold">Ranglijst</div>
                  <div className="text-sm text-gray-600">Zie hoe je scoort</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setIsGamesMenuOpen(false);
                setIsAIPersonaOpen(true);
              }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white mr-3">
                  🤖
                </div>
                <div className="text-left">
                  <div className="font-semibold">AI Helper</div>
                  <div className="text-sm text-gray-600">Krijg hulp en tips</div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
