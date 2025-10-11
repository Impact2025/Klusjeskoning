'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { avatars } from '@/lib/avatars';
import { cn } from '@/lib/utils';

type AddChildModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

export default function AddChildModal({ isOpen, setIsOpen }: AddChildModalProps) {
  const { addChild, family, planDefinition } = useApp();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState('');
  const { toast } = useToast();
  const maxChildren = planDefinition.limits.maxChildren;
  const currentChildren = family?.children.length ?? 0;
  const canAddMore = typeof maxChildren !== 'number' || currentChildren < maxChildren;

  const handleAdd = () => {
    if (!name || !pin || pin.length !== 4 || !/^\d{4}$/.test(pin) || !avatar) {
        toast({
            variant: "destructive",
            title: "Ongeldige invoer",
            description: "Vul een naam, een 4-cijferige pincode en een avatar in.",
        });
      return;
    }
    if (!canAddMore) {
        toast({
            variant: "destructive",
            title: "Upgrade nodig",
            description: "Je hebt het maximum aantal kinderen bereikt voor dit plan.",
        });
        return;
    }

    addChild(name, pin, avatar);
    setName('');
    setPin('');
    setAvatar('');
    setIsOpen(false);
  };
  
  const handleClose = () => {
    setName('');
    setPin('');
    setAvatar('');
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Kind Toevoegen</DialogTitle>
        </DialogHeader>
        {!canAddMore && (
          <p className="text-sm text-amber-600 bg-amber-100 px-3 py-2 rounded-lg">
            Je hebt al {currentChildren} kind(eren). Upgrade naar Gezin+ voor onbeperkte kinderen.
          </p>
        )}
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam van kind"/>
          </div>
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg justify-center">
              {avatars.map((av) => (
                <button 
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={cn("text-3xl p-2 rounded-lg transition-transform hover:scale-110", avatar === av && "bg-blue-200 ring-2 ring-blue-500")}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">Pincode</Label>
            <Input id="pin" type="number" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} placeholder="4-cijferige pincode"/>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Annuleren</Button>
          <Button onClick={handleAdd}>Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
