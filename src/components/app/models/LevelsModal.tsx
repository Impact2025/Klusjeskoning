'use client';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type LevelsModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

const levels = [
  { points: 0, name: 'Ei', icon: '🥚', description: "Je bent net begonnen aan je avontuur." },
  { points: 50, name: 'Kuiken', icon: '🐣', description: "Je eerste klusjes gedaan, nog klein maar ondernemend!" },
  { points: 150, name: 'Kleine Dino', icon: '🐤', description: "Je groeit, wordt sterker en ontdekt nieuwe dingen." },
  { points: 300, name: 'Grote Dino', icon: '🦖', description: "Je bent stoer en doet al veel klusjes zelfstandig." },
  { points: 500, name: 'Gouden Draak', icon: '🐲', description: "Een zeldzame en krachtige status, bijna koning." },
  { points: 1000, name: 'KlusjesKoning', icon: '👑', description: "De ultieme heerser van alle klusjes!" },
];

export default function LevelsModal({ isOpen, setIsOpen }: LevelsModalProps) {
  const { user } = useApp();

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="h-[90vh] max-w-lg p-0 flex flex-col animate-slide-in-bottom">
        <DialogHeader className="p-4 border-b-2">
          <DialogTitle className="font-brand text-2xl text-yellow-500 flex items-center">
            <Trophy className="mr-2" /> Jouw Groei naar Koning!
          </DialogTitle>
          <DialogDescription>Verdien punten en groei van Ei tot KlusjesKoning!</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
            <div className="p-4 space-y-3">
                {levels.map((level) => {
                    const isAchieved = user.totalPointsEver >= level.points;
                    return (
                        <div key={level.name} className={cn(
                            "bg-white p-4 rounded-xl shadow-md flex items-center border-l-4 transition-all", 
                            isAchieved ? 'border-green-400' : 'border-gray-300 opacity-60'
                        )}>
                            <div className="text-4xl w-12 text-center">{level.icon}</div>
                            <div className="ml-4 flex-grow">
                                <p className="font-bold text-lg">{level.name}</p>
                                <p className="text-sm italic text-gray-600">{level.description}</p>
                            </div>
                             <div className="text-right">
                                <p className={cn("font-bold flex items-center justify-end", isAchieved ? "text-yellow-500" : "text-gray-400")}>
                                  {level.points} <Star className="h-4 w-4 ml-1" />
                                </p>
                                {isAchieved && (
                                    <p className="text-xs font-bold text-green-600">Behaald!</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t-2 text-center flex-col justify-center items-center space-y-1">
            <p className="font-bold text-lg">Totaal verdiend: <span className="text-accent">{user.totalPointsEver} punten</span></p>
            <p className="text-sm text-muted-foreground">Blijf klusjes doen om het volgende level te bereiken!</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
