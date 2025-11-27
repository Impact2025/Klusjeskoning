'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { callAppApi } from '@/lib/api/app-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditTeamChoreModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teamChore: any;
}

export default function EditTeamChoreModal({ isOpen, setIsOpen, teamChore }: EditTeamChoreModalProps) {
  const { family, updateTeamChore } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalPoints, setTotalPoints] = useState(0);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teamChore && isOpen) {
      setName(teamChore.name || '');
      setDescription(teamChore.description || '');
      setTotalPoints(teamChore.totalPoints || 0);
      setSelectedChildren(teamChore.participatingChildren || []);
    }
  }, [teamChore, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || totalPoints <= 0 || selectedChildren.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Vul alle velden in en selecteer minstens één kind.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTeamChore(teamChore.id, {
        name: name.trim(),
        description: description.trim(),
        totalPoints,
        participatingChildren: selectedChildren,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update team chore:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon team klusje niet bijwerken.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChildToggle = (childId: string) => {
    setSelectedChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Team Klusje Bewerken
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Naam van het team klusje</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Keuken schoonmaken"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschrijf wat er gedaan moet worden..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="points">Totaal aantal punten</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={totalPoints || ''}
              onChange={(e) => setTotalPoints(parseInt(e.target.value) || 0)}
              placeholder="bijv. 150"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Deze punten worden verdeeld onder de deelnemers wanneer het klusje klaar is.
            </p>
          </div>

          <div>
            <Label>Deelnemende kinderen</Label>
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {family?.children.map((child) => (
                <div key={child.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`child-${child.id}`}
                    checked={selectedChildren.includes(child.id)}
                    onCheckedChange={() => handleChildToggle(child.id)}
                  />
                  <Label
                    htmlFor={`child-${child.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {child.name}
                  </Label>
                </div>
              ))}
            </div>
            {family?.children.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Voeg eerst kinderen toe voordat je team klusjes kunt maken.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}