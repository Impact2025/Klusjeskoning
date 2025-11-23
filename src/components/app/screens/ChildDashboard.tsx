'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { LogOut, Star, ListTodo, Store, Hourglass, Trophy, Heart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RewardShopModal from '../models/RewardShopModal';
import SubmitChoreModal from '../models/SubmitChoreModal';
import LevelsModal from '../models/LevelsModal';
import ChildOnboardingModal from '../models/ChildOnboardingModal';
// import AvatarCustomizerModal from '../models/AvatarCustomizerModal';
import { QuestCard } from '@/components/ui/quest-card';
import WeeklyWinnerBadge from '@/components/ui/weekly-winner-badge';
import TeamChores from '@/components/ui/team-chores';
import type { Chore } from '@/lib/types';
import { Timestamp } from '@/lib/timestamp';
import { getLevelFromXp, LEVEL_BADGES } from '@/lib/xp-utils';
import { SAMPLE_QUEST_CHAINS, QUEST_CHAIN_CHORES } from '@/lib/quest-utils';

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
  const [isAvatarCustomizerOpen, setAvatarCustomizerOpen] = useState(false);
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);

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

  if (!user || !family) return null;

  const now = Timestamp.now();
  const nowMillis = now.toMillis();
  const activeCause = goodCauses?.find((cause) => {
    const start = cause.startDate?.toMillis?.() ?? 0;
    const end = cause.endDate?.toMillis?.() ?? 0;
    return start <= nowMillis && nowMillis <= end;
  });

  const currentLevel = LEVEL_BADGES.find(badge => badge.level <= getLevelFromXp(user.totalXpEver || 0)) || LEVEL_BADGES[0];
  
  const openSubmitModal = (choreId: string) => {
    setSelectedChoreId(choreId);
    setSubmitChoreOpen(true);
  };

  const handleLogout = () => {
    logout();
  }

  // For now, use sample quest chains - in production this would come from the database
  const availableQuestChains = SAMPLE_QUEST_CHAINS.map(chain => ({
    ...chain,
    familyId: family.id, // Set the actual family ID
  }));

  // Get all chores from quest chains
  const allQuestChores = Object.values(QUEST_CHAIN_CHORES).flat();

  const availableChores = allQuestChores.filter(c => {
    const isAvailable = c.status === 'available';
    const isAssigned = !c.assignedTo || c.assignedTo.length === 0 || c.assignedTo.includes(user.id);
    const hasSubmitted = family.chores.some(familyChore =>
      familyChore.id === c.id &&
      familyChore.status === 'submitted' &&
      familyChore.submittedBy === user.id
    );
    return isAvailable && isAssigned && !hasSubmitted;
  });
  const submittedChores = family.chores.filter(c => c.status === 'submitted' && c.submittedBy === user.id);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <header className="p-4 flex justify-between items-center bg-accent text-accent-foreground shadow-md">
        <div className="text-center">
          <div className="text-4xl">{currentLevel.icon}</div>
          <div className="text-xs font-bold">{currentLevel.name} (Level {getLevelFromXp(user.totalXpEver || 0)})</div>
        </div>
        <div className="text-center">
          <h2 className="font-brand text-2xl">{user.name}</h2>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center font-bold text-lg bg-white/30 text-gray-800 px-3 py-1 rounded-full">
              <Star className="text-yellow-400 mr-2 h-4 w-4" />
              <span>{user.points}</span>
            </div>
            <div className="flex items-center font-bold text-sm bg-blue-500/30 text-white px-2 py-1 rounded-full">
              <span className="mr-1">XP</span>
              <span>{user.xp}</span>
            </div>
          </div>
          <WeeklyWinnerBadge />
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-accent-foreground">
          <LogOut />
        </Button>
      </header>

      <ScrollArea className="flex-grow [&>div>div]:!block [&>div>div]:scrollbar-thin [&>div>div]:scrollbar-thumb-primary/60 [&>div>div]:scrollbar-track-slate-100/50">
        <main className="p-4 space-y-6">
            {activeCause && (
                 <Card className="bg-rose-50 border-rose-400 border-l-4 animate-pop">
                    <CardHeader>
                        <CardTitle className="flex items-center text-rose-800"><Heart className="mr-2"/> Goed Doel!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold text-lg">{activeCause.name}</p>
                        <p className="text-sm text-gray-700 mb-2">{activeCause.description}</p>
                        <CardDescription>
                            Doneer je punten aan dit doel in de winkel!
                        </CardDescription>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Jouw Quests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {availableChores.length > 0 ? availableChores.map((chore: Chore) => (
                        <QuestCard
                            key={chore.id}
                            chore={chore}
                            onComplete={openSubmitModal}
                        />
                    )) : <p className="text-muted-foreground italic text-center p-4">Geen quests beschikbaar.</p>}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Ingediende Klusjes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {submittedChores.length > 0 ? submittedChores.map((chore: Chore) => (
                         <div key={chore.id} className="bg-gray-100 p-3 rounded-xl opacity-70 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-600">{chore.name}</p>
                                <p className="text-sm text-gray-500">Wacht op goedkeuring...</p>
                            </div>
                            <Hourglass className="text-gray-500"/>
                        </div>
                    )) : <p className="text-muted-foreground italic text-center p-4">Je hebt geen klusjes ingediend.</p>}
                </CardContent>
            </Card>

            <TeamChores />
        </main>
      </ScrollArea>
      
      <nav className="flex justify-around bg-white p-2 border-t-2">
        <Button variant="ghost" className="text-primary flex flex-col items-center h-auto w-full">
            <ListTodo className="h-6 w-6" />
            <span className="text-xs">Quests</span>
        </Button>
        <Button variant="ghost" onClick={() => setRewardShopOpen(true)} className="text-gray-500 flex flex-col items-center h-auto w-full">
            <Store className="h-6 w-6" />
            <span className="text-xs">Winkel</span>
        </Button>
        {/* <Button variant="ghost" onClick={() => setAvatarCustomizerOpen(true)} className="text-gray-500 flex flex-col items-center h-auto w-full">
            <Star className="h-6 w-6" />
            <span className="text-xs">Avatar</span>
        </Button> */}
        <Button variant="ghost" onClick={() => setLevelsModalOpen(true)} className="text-gray-500 flex flex-col items-center h-auto w-full">
            <Trophy className="h-6 w-6" />
            <span className="text-xs">Levels</span>
        </Button>
      </nav>
      
      <RewardShopModal isOpen={isRewardShopOpen} setIsOpen={setRewardShopOpen} />
      <SubmitChoreModal isOpen={isSubmitChoreOpen} setIsOpen={setSubmitChoreOpen} choreId={selectedChoreId} />
      <LevelsModal isOpen={isLevelsModalOpen} setIsOpen={setLevelsModalOpen} />
      <ChildOnboardingModal isOpen={isOnboardingOpen} setIsOpen={setIsOnboardingOpen} />
      {/* <AvatarCustomizerModal isOpen={isAvatarCustomizerOpen} setIsOpen={setAvatarCustomizerOpen} /> */}
    </div>
  );
}
