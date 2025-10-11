'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ChildSelector from '../ChildSelector';

type AddChoreModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

export default function AddChoreModal({ isOpen, setIsOpen }: AddChoreModalProps) {
  const { family, addChore, planDefinition, monthlyChoreUsage } = useApp();
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isEveryone, setIsEveryone] = useState(true);
  const { toast } = useToast();
  const choreQuota = planDefinition.limits.monthlyChoreQuota;
  const quotaReached = typeof choreQuota === 'number' && monthlyChoreUsage >= choreQuota;
  
  if (!family) return null;

  const handleAdd = () => {
    if (quotaReached) {
      toast({ variant: 'destructive', title: 'Upgrade nodig', description: 'Je hebt het maximum aantal klusjes voor deze maand bereikt.' });
      return;
    }

    const pointsNum = parseInt(points, 10);
    if (!name || isNaN(pointsNum) || pointsNum <= 0) {
      toast({ variant: "destructive", title: "Ongeldige invoer", description: "Vul een geldige naam en een positief aantal punten in." });
      return;
    }
    if (!isEveryone && selectedChildren.length === 0) {
      toast({ variant: "destructive", title: "Selecteer een kind", description: "Wijs het klusje toe aan 'Iedereen' of selecteer ten minste één kind." });
      return;
    }
    
    addChore(name, pointsNum, isEveryone ? [] : selectedChildren);
    setName('');
    setPoints('');
    setSelectedChildren([]);
    setIsEveryone(true);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Klusje Toevoegen</DialogTitle>
          <DialogDescription>Voeg een nieuw klusje toe en wijs het toe aan je kinderen.</DialogDescription>
        </DialogHeader>
        {quotaReached && (
          <p className="text-sm text-amber-600 bg-amber-100 px-3 py-2 rounded-lg">
            Je hebt deze maand al {monthlyChoreUsage} klusje(s) aangemaakt. Upgrade naar Gezin+ voor onbeperkte klusjes.
          </p>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chore-name" className="text-right">Naam</Label>
            <Input id="chore-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Naam van klusje"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chore-points" className="text-right">Punten</Label>
            <Input id="chore-points" type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="col-span-3" placeholder="Aantal punten"/>
          </div>
          <div className="col-span-4">
            <ChildSelector children={family.children} selectedChildren={selectedChildren} setSelectedChildren={setSelectedChildren} isEveryone={isEveryone} setIsEveryone={setIsEveryone} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Annuleren</Button>
          <Button onClick={handleAdd} disabled={quotaReached}>Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
