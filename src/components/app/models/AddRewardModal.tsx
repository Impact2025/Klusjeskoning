'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { RewardType } from '@/lib/types';
import ChildSelector from '../ChildSelector';

type AddRewardModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

export default function AddRewardModal({ isOpen, setIsOpen }: AddRewardModalProps) {
  const { family, addReward, canAccessFeature } = useApp();
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [type, setType] = useState<RewardType>('privilege');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isEveryone, setIsEveryone] = useState(true);
  const { toast } = useToast();
  const donationsAllowed = canAccessFeature('donations');

  if (!family) return null;

  const handleAdd = () => {
    const pointsNum = parseInt(points, 10);
    if (!name || isNaN(pointsNum) || pointsNum <= 0) {
      toast({ variant: "destructive", title: "Ongeldige invoer", description: "Vul een geldige naam en kostprijs in." });
      return;
    }
    if (!isEveryone && selectedChildren.length === 0) {
        toast({ variant: "destructive", title: "Selecteer een kind", description: "Wijs de beloning toe aan 'Iedereen' of selecteer ten minste één kind." });
        return;
    }

    if (type === 'donation' && !donationsAllowed) {
      toast({ variant: 'destructive', title: 'Premium nodig', description: 'Donaties zijn onderdeel van het Gezin+ abonnement.' });
      return;
    }

    addReward(name, pointsNum, type, isEveryone ? [] : selectedChildren);
    setName('');
    setPoints('');
    setType('privilege');
    setSelectedChildren([]);
    setIsEveryone(true);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Beloning Toevoegen</DialogTitle>
          <DialogDescription>Creëer een nieuwe beloning die kinderen kunnen verdienen.</DialogDescription>
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
                    <SelectItem value="donation" disabled={!donationsAllowed}>Goed Doel {donationsAllowed ? '' : '(Premium)'}</SelectItem>
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
          <Button onClick={handleAdd}>Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
