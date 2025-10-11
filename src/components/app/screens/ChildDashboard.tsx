'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { LogOut, Star, ListTodo, Store, Hourglass, Trophy, Heart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RewardShopModal from '../models/RewardShopModal';
import SubmitChoreModal from '../models/SubmitChoreModal';
import LevelsModal from '../models/LevelsModal';
import type { Chore } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

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
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
  
  if (!user || !family) return null;

  const now = Timestamp.now();
  const activeCause = goodCauses?.find(c => c.startDate <= now && c.endDate >= now);

  const currentLevel = getLevel(user.totalPointsEver);
  
  const openSubmitModal = (choreId: string) => {
    setSelectedChoreId(choreId);
    setSubmitChoreOpen(true);
  };

  const handleLogout = () => {
    logout();
  }

  const availableChores = family.chores.filter(c => c.status === 'available' && (!c.assignedTo || c.assignedTo.length === 0 || c.assignedTo.includes(user.id)));
  const submittedChores = family.chores.filter(c => c.status === 'submitted' && c.submittedBy === user.id);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <header className="p-4 flex justify-between items-center bg-accent text-accent-foreground shadow-md">
        <div className="text-center">
          <div className="text-4xl">{currentLevel.icon}</div>
          <div className="text-xs font-bold">{currentLevel.name}</div>
        </div>
        <div className="text-center">
          <h2 className="font-brand text-2xl">{user.name}</h2>
          <div className="flex items-center justify-center font-bold text-lg bg-white/30 text-gray-800 px-3 py-1 rounded-full">
            <Star className="text-yellow-400 mr-2 h-5 w-5" />
            <span>{user.points}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-accent-foreground">
          <LogOut />
        </Button>
      </header>

      <ScrollArea className="flex-grow">
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
                    <CardTitle>Jouw Klusjes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {availableChores.length > 0 ? availableChores.map((chore: Chore) => (
                        <div key={chore.id} className="bg-white p-3 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="font-bold text-lg">{chore.name}</p>
                                <p className="font-bold text-yellow-500 flex items-center">{chore.points} <Star className="h-4 w-4 ml-1" /></p>
                            </div>
                            <Button onClick={() => openSubmitModal(chore.id)} className="bg-success hover:bg-success/90 text-white font-bold">Klaar!</Button>
                        </div>
                    )) : <p className="text-muted-foreground italic text-center p-4">Geen klusjes beschikbaar.</p>}
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
        </main>
      </ScrollArea>
      
      <nav className="flex justify-around bg-white p-2 border-t-2">
        <Button variant="ghost" className="text-primary flex flex-col items-center h-auto w-full">
            <ListTodo className="h-6 w-6" />
            <span className="text-xs">Klusjes</span>
        </Button>
        <Button variant="ghost" onClick={() => setRewardShopOpen(true)} className="text-gray-500 flex flex-col items-center h-auto w-full">
            <Store className="h-6 w-6" />
            <span className="text-xs">Winkel</span>
        </Button>
        <Button variant="ghost" onClick={() => setLevelsModalOpen(true)} className="text-gray-500 flex flex-col items-center h-auto w-full">
            <Trophy className="h-6 w-6" />
            <span className="text-xs">Levels</span>
        </Button>
      </nav>
      
      <RewardShopModal isOpen={isRewardShopOpen} setIsOpen={setRewardShopOpen} />
      <SubmitChoreModal isOpen={isSubmitChoreOpen} setIsOpen={setSubmitChoreOpen} choreId={selectedChoreId} />
      <LevelsModal isOpen={isLevelsModalOpen} setIsOpen={setLevelsModalOpen} />
    </div>
  );
}
