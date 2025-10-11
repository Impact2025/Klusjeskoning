'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/lib/types';
import { avatars } from '@/lib/avatars';
import { cn } from '@/lib/utils';


type EditChildModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    child: Child;
};

export default function EditChildModal({ isOpen, setIsOpen, child }: EditChildModalProps) {
  const { updateChild } = useApp();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (child) {
        setName(child.name);
        setPin(child.pin);
        setAvatar(child.avatar);
    }
  }, [child]);

  const handleUpdate = () => {
    if (!name || !pin || pin.length !== 4 || !/^\d{4}$/.test(pin) || !avatar) {
        toast({
            variant: "destructive",
            title: "Ongeldige invoer",
            description: "Vul een geldige naam, een 4-cijferige pincode en een avatar in.",
        });
      return;
    }
    updateChild(child.id, { name, pin, avatar });
    setIsOpen(false);
  };
  
  const handleClose = () => {
    if(child) {
        setName(child.name);
        setPin(child.pin);
        setAvatar(child.avatar);
    }
    setIsOpen(false);
  }

  if (!child) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Kind Bewerken</DialogTitle>
          <DialogDescription>Pas de gegevens van {child.name} aan.</DialogDescription>
        </DialogHeader>
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
          <Button onClick={handleUpdate}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
