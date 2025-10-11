'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ChildSelector from '../ChildSelector';
import type { Chore } from '@/lib/types';

type EditChoreModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    chore: Chore;
};

export default function EditChoreModal({ isOpen, setIsOpen, chore }: EditChoreModalProps) {
  const { family, updateChore } = useApp();
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isEveryone, setIsEveryone] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (chore) {
        setName(chore.name);
        setPoints(chore.points.toString());
        if (chore.assignedTo && chore.assignedTo.length > 0) {
            setIsEveryone(false);
            setSelectedChildren(chore.assignedTo);
        } else {
            setIsEveryone(true);
            setSelectedChildren([]);
        }
    }
  }, [chore]);

  if (!family) return null;

  const handleUpdate = () => {
    const pointsNum = parseInt(points, 10);
    if (!name || isNaN(pointsNum) || pointsNum <= 0) {
      toast({ variant: "destructive", title: "Ongeldige invoer", description: "Vul een geldige naam en een positief aantal punten in." });
      return;
    }
    if (!isEveryone && selectedChildren.length === 0) {
      toast({ variant: "destructive", title: "Selecteer een kind", description: "Wijs het klusje toe aan 'Iedereen' of selecteer ten minste één kind." });
      return;
    }
    
    updateChore(chore.id, { name, points: pointsNum, assignedTo: isEveryone ? [] : selectedChildren });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Klusje Bewerken</DialogTitle>
          <DialogDescription>Pas de gegevens van "{chore.name}" aan.</DialogDescription>
        </DialogHeader>
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
          <Button onClick={handleUpdate}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
