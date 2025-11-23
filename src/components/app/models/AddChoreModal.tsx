'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import ChildSelector from '../ChildSelector';
import type { RecurrenceType } from '@/lib/types';

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
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(['monday', 'wednesday', 'friday']);
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
    
    addChore(name, pointsNum, isEveryone ? [] : selectedChildren, {
      recurrenceType,
      recurrenceDays: recurrenceType === 'weekly' ? JSON.stringify(recurrenceDays) : null,
    });
    setName('');
    setPoints('');
    setSelectedChildren([]);
    setIsEveryone(true);
    setRecurrenceType('none');
    setRecurrenceDays(['monday', 'wednesday', 'friday']);
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recurrence-type" className="text-right">Herhaling</Label>
            <Select value={recurrenceType} onValueChange={(value: RecurrenceType) => setRecurrenceType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecteer herhaling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Eenmalig</SelectItem>
                <SelectItem value="daily">Dagelijks</SelectItem>
                <SelectItem value="weekly">Wekelijks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {recurrenceType === 'weekly' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Dagen</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={recurrenceDays.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRecurrenceDays([...recurrenceDays, day]);
                        } else {
                          setRecurrenceDays(recurrenceDays.filter(d => d !== day));
                        }
                      }}
                    />
                    <Label htmlFor={`day-${day}`} className="text-sm capitalize">
                      {day === 'monday' ? 'Ma' :
                       day === 'tuesday' ? 'Di' :
                       day === 'wednesday' ? 'Wo' :
                       day === 'thursday' ? 'Do' :
                       day === 'friday' ? 'Vr' :
                       day === 'saturday' ? 'Za' : 'Zo'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
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
