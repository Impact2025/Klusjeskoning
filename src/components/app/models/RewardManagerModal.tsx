'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Star, Gamepad2, Users, Coins, Heart, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RewardType } from '@/lib/types';
import { getRewardSuggestionsForFamily } from '@/lib/reward-suggestions';

type RewardManagerModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const iconMap: Record<RewardType, React.ReactNode> = {
  privilege: <Gamepad2 className="text-purple-500" />,
  experience: <Users className="text-teal-500" />,
  money: <Coins className="text-green-500" />,
  donation: <Heart className="text-red-500" />,
};

export default function RewardManagerModal({ isOpen, setIsOpen }: RewardManagerModalProps) {
  const { family, createReward, updateReward, deleteReward } = useApp();
  const { toast } = useToast();
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    points: 50,
    type: 'privilege' as RewardType,
  });

  if (!family) return null;

  const resetForm = () => {
    setFormData({ name: '', points: 50, type: 'privilege' });
    setIsAddingReward(false);
    setEditingReward(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Fout",
        description: "Geef een naam voor de beloning op.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingReward) {
        await updateReward(editingReward, formData);
        toast({
          title: "Beloning bijgewerkt",
          description: `"${formData.name}" is succesvol bijgewerkt.`,
        });
      } else {
        await createReward(formData);
        toast({
          title: "Beloning toegevoegd",
          description: `"${formData.name}" is toegevoegd aan jullie beloningen.`,
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (rewardId: string) => {
    const reward = family.rewards.find(r => r.id === rewardId);
    if (reward) {
      setFormData({
        name: reward.name,
        points: reward.points,
        type: reward.type,
      });
      setEditingReward(rewardId);
      setIsAddingReward(true);
    }
  };

  const handleDelete = async (rewardId: string) => {
    const reward = family.rewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (confirm(`Weet je zeker dat je "${reward.name}" wilt verwijderen?`)) {
      try {
        await deleteReward(rewardId);
        toast({
          title: "Beloning verwijderd",
          description: `"${reward.name}" is verwijderd.`,
        });
      } catch (error) {
        toast({
          title: "Fout",
          description: "Kon beloning niet verwijderen.",
          variant: "destructive",
        });
      }
    }
  };

  const suggestedRewards = getRewardSuggestionsForFamily(family.children);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="h-[90vh] max-w-4xl p-0 flex flex-col animate-slide-in-bottom">
        <DialogHeader className="p-4 border-b-2">
          <DialogTitle className="font-brand text-2xl text-accent">Beloningen Beheren</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Add/Edit Form */}
          {isAddingReward && (
            <div className="p-4 border-b bg-gray-50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reward-name">Naam</Label>
                    <Input
                      id="reward-name"
                      placeholder="Bijv. Extra schermtijd"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward-points">Punten</Label>
                    <Input
                      id="reward-points"
                      type="number"
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 50 }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward-type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as RewardType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="privilege">Privilege</SelectItem>
                        <SelectItem value="experience">Ervaring</SelectItem>
                        <SelectItem value="money">Geld</SelectItem>
                        <SelectItem value="donation">Donatie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingReward ? 'Bijwerken' : 'Toevoegen'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuleren
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {/* Action Bar */}
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Jullie Beloningen ({family.rewards.length})</h3>
                <p className="text-sm text-muted-foreground">Beheer welke beloningen jullie kinderen kunnen verdienen</p>
              </div>
              <Button onClick={() => setIsAddingReward(true)} disabled={isAddingReward}>
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Beloning
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Current Rewards */}
                {family.rewards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-lg">Huidige Beloningen</h4>
                    <div className="grid gap-3">
                      {family.rewards.map((reward) => (
                        <Card key={reward.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{iconMap[reward.type] || <Gift />}</div>
                                <div>
                                  <h5 className="font-medium">{reward.name}</h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {reward.points} <Star className="w-3 h-3 ml-1" />
                                    </Badge>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {reward.type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(reward.id)}
                                  disabled={isAddingReward}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(reward.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-lg">Suggesties</h4>
                  <p className="text-sm text-muted-foreground">
                    Hier zijn enkele beloningen die goed passen bij jullie gezin:
                  </p>
                  <div className="grid gap-3">
                    {suggestedRewards.slice(0, 6).map((suggestion) => {
                      const alreadyExists = family.rewards.some(r => r.name === suggestion.name);
                      return (
                        <Card key={suggestion.name} className={`border-l-4 ${alreadyExists ? 'border-l-green-400 bg-green-50' : 'border-l-blue-400'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{iconMap[suggestion.type] || <Gift />}</div>
                                <div className="flex-1">
                                  <h5 className="font-medium">{suggestion.name}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {suggestion.points} <Star className="w-3 h-3 ml-1" />
                                    </Badge>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {suggestion.category.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {!alreadyExists && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setFormData({
                                      name: suggestion.name,
                                      points: suggestion.points,
                                      type: suggestion.type,
                                    });
                                    setIsAddingReward(true);
                                  }}
                                  disabled={isAddingReward}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Toevoegen
                                </Button>
                              )}
                              {alreadyExists && (
                                <Badge className="bg-green-100 text-green-800">
                                  Al toegevoegd
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-4 border-t-2">
          <Button onClick={() => setIsOpen(false)}>Sluiten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}