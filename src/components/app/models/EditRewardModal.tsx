'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Reward, RewardType } from '@/lib/types';
import ChildSelector from '../ChildSelector';

type EditRewardModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    reward: Reward;
};

export default function EditRewardModal({ isOpen, setIsOpen, reward }: EditRewardModalProps) {
  const { family, updateReward } = useApp();
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [type, setType] = useState<RewardType>('privilege');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isEveryone, setIsEveryone] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (reward) {
        setName(reward.name);
        setPoints(reward.points.toString());
        setType(reward.type);
        if (reward.assignedTo && reward.assignedTo.length > 0) {
            setIsEveryone(false);
            setSelectedChildren(reward.assignedTo);
        } else {
            setIsEveryone(true);
            setSelectedChildren([]);
        }
    }
  }, [reward]);

  if (!family) return null;

  const handleUpdate = () => {
    const pointsNum = parseInt(points, 10);
    if (!name || isNaN(pointsNum) || pointsNum <= 0) {
      toast({ variant: "destructive", title: "Ongeldige invoer", description: "Vul een geldige naam en kostprijs in." });
      return;
    }
    if (!isEveryone && selectedChildren.length === 0) {
        toast({ variant: "destructive", title: "Selecteer een kind", description: "Wijs de beloning toe aan 'Iedereen' of selecteer ten minste één kind." });
        return;
    }

    updateReward(reward.id, { name, points: pointsNum, type, assignedTo: isEveryone ? [] : selectedChildren });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Beloning Bewerken</DialogTitle>
          <DialogDescription>Pas de gegevens van "{reward.name}" aan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reward-name" className="text-right">Naam</Label>
            <Input id="reward-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Naam van beloning"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reward-points" className="text-right">Kost</Label>
            <Input id="reward-points" type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="col-span-3" placeholder="Aantal punten"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reward-type" className="text-right">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as RewardType)}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecteer een type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="privilege">Extra Privilege</SelectItem>
                    <SelectItem value="experience">Tijd met elkaar</SelectItem>
                    <SelectItem value="donation">Goed Doel</SelectItem>
                    <SelectItem value="money">Zakgeld</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="col-span-4">
            <ChildSelector children={family.children} selectedChildren={selectedChildren} setSelectedChildren={setSelectedChildren} isEveryone={isEveryone} setIsEveryone={setIsEveryone} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Annuleren</Button>
          <Button onClick={handleUpdate}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
