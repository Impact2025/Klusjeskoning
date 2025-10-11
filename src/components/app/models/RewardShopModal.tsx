'use client';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Gamepad2, Users, Coins, Heart, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { RewardType } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type RewardShopModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

const iconMap: Record<RewardType, React.ReactNode> = {
    privilege: <Gamepad2 className="text-purple-500" />,
    experience: <Users className="text-teal-500" />,
    money: <Coins className="text-green-500" />,
    donation: <Heart className="text-red-500" />,
};

export default function RewardShopModal({ isOpen, setIsOpen }: RewardShopModalProps) {
  const { user, family, redeemReward } = useApp();
  const { toast } = useToast();

  if (!user || !family) return null;

  const availableRewards = family.rewards.filter(r => !r.assignedTo || r.assignedTo.length === 0 || r.assignedTo.includes(user.id));
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="h-[90vh] max-w-lg p-0 flex flex-col animate-slide-in-bottom">
        <DialogHeader className="p-4 border-b-2">
          <DialogTitle className="font-brand text-2xl text-accent">Beloningswinkel</DialogTitle>
          <DialogDescription>Gebruik je punten om beloningen te kopen!</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
            <div className="p-4 space-y-3">
                {availableRewards.length > 0 ? availableRewards.map(reward => {
                    const canAfford = user.points >= reward.points;
                    return (
                        <div key={reward.id} className={cn("bg-white p-3 rounded-xl shadow-md flex items-center justify-between border-l-4", canAfford ? 'border-green-400' : 'border-red-400')}>
                            <div className="flex items-center">
                                <div className="text-2xl w-10 text-center">{iconMap[reward.type] || <Gift />}</div>
                                <div className="ml-3">
                                    <p className="font-bold text-lg">{reward.name}</p>
                                    <p className="font-bold text-yellow-500 flex items-center">{reward.points} <Star className="h-4 w-4 ml-1" /></p>
                                </div>
                            </div>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button disabled={!canAfford} className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 disabled:bg-gray-300 disabled:cursor-not-allowed">Kopen</Button>
                                </AlertDialogTrigger>
                                {canAfford && (
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Beloning kopen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Weet je zeker dat je "{reward.name}" wilt kopen voor {reward.points} punten?
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => redeemReward(reward.id)}>Ja, kopen!</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                )}
                            </AlertDialog>
                        </div>
                    )
                }) : <p className="text-muted-foreground italic text-center p-4">Geen beloningen in de winkel.</p>}
            </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t-2 text-center flex-row justify-center">
            <p className="font-bold text-lg">Jouw punten: <span className="text-accent">{user.points}</span></p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
