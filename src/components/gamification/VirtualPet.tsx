'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Zap, Edit3, Bone, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VirtualPet {
  id: string;
  name: string;
  species: 'dragon' | 'unicorn' | 'phoenix' | 'wolf' | 'cat';
  level: number;
  xp: number;
  xpToNextLevel: number;
  hunger: number;
  happiness: number;
  emotion: 'happy' | 'sleepy' | 'proud' | 'bored' | 'hungry' | 'excited' | 'sad' | 'angry' | 'surprised' | 'loving' | 'playful' | 'tired';
  evolutionStage: number;
  lastFed?: Date | null;
}

interface VirtualPetProps {
  pet: VirtualPet;
  onFeed: () => void;
  onPlay: () => void;
  onRename: (newName: string) => void;
  className?: string;
  isGolden?: boolean; // For weekly champion golden pet effect
}

const PET_EMOJIS = {
  dragon: '🐉',
  unicorn: '🦄',
  phoenix: '🔥',
  wolf: '🐺',
  cat: '🐱',
};

const EMOTION_EMOJIS = {
  happy: '😊',
  sleepy: '😴',
  proud: '😎',
  bored: '😐',
  hungry: '😋',
  excited: '🤩',
  sad: '😢',
  angry: '😠',
  surprised: '😲',
  loving: '🥰',
  playful: '😜',
  tired: '🥱',
};

const EVOLUTION_STAGES = {
  1: 'Baby',
  2: 'Young',
  3: 'Teen',
  4: 'Adult',
  5: 'Legendary',
};

export default function VirtualPet({ pet, onFeed, onPlay, onRename, className, isGolden = false }: VirtualPetProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(pet.name);

  const xpPercentage = (pet.xp / pet.xpToNextLevel) * 100;
  const hungerColor = pet.hunger > 70 ? 'bg-green-500' : pet.hunger > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const happinessColor = pet.happiness > 70 ? 'bg-blue-500' : pet.happiness > 30 ? 'bg-yellow-500' : 'bg-gray-500';

  const handleFeed = async () => {
    await onFeed();
  };

  const handlePlay = async () => {
    await onPlay();
  };

  const handleRename = () => {
    if (newName.trim() && newName !== pet.name) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
  };

  return (
    <Card className={cn(
      'relative border bg-white transition-all duration-300',
      isGolden
        ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 shadow-lg shadow-yellow-200/50'
        : 'border-slate-200',
      className
    )}>
      {/* Golden sparkles effect for champions */}
      {isGolden && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-2 right-2 text-yellow-400 animate-pulse">✨</div>
          <div className="absolute bottom-2 left-2 text-yellow-500 animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-300 animate-ping" style={{ animationDelay: '1s' }}>💫</div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
              {PET_EMOJIS[pet.species]}
            </div>
            <div>
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-lg font-medium bg-transparent border-b border-slate-300 focus:border-slate-500 outline-none px-1"
                    maxLength={20}
                    onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                  />
                  <Button size="sm" onClick={handleRename} className="h-7 px-2">Opslaan</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg text-slate-900">{pet.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRenaming(true)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Badge variant="outline" className="text-xs border-slate-300">
                  Level {pet.level}
                </Badge>
                <Badge variant="outline" className="text-xs border-slate-300">
                  {EVOLUTION_STAGES[pet.evolutionStage as keyof typeof EVOLUTION_STAGES]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-slate-400" />
              Ervaringspunten
            </span>
            <span className="font-medium">{pet.xp}/{pet.xpToNextLevel}</span>
          </div>
          <Progress value={xpPercentage} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Honger</span>
              <span className="font-medium">{pet.hunger}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={cn('h-2 rounded-full transition-all duration-300', hungerColor)}
                style={{ width: `${pet.hunger}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Geluk</span>
              <span className="font-medium">{pet.happiness}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={cn('h-2 rounded-full transition-all duration-300', happinessColor)}
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleFeed}
            disabled={pet.hunger >= 90}
            className={cn(
              'transition-colors',
              pet.hunger >= 90 && 'opacity-50 cursor-not-allowed'
            )}
            size="sm"
            variant="outline"
          >
            <Bone className="h-4 w-4 mr-2" />
            {pet.hunger >= 90 ? 'Verzadigd' : 'Voeren'}
          </Button>

          <Button
            onClick={handlePlay}
            disabled={pet.happiness >= 90}
            className={cn(
              'transition-colors',
              pet.happiness >= 90 && 'opacity-50 cursor-not-allowed'
            )}
            size="sm"
            variant="outline"
          >
            <Gamepad2 className="h-4 w-4 mr-2" />
            {pet.happiness >= 90 ? 'Tevreden' : 'Spelen'}
          </Button>
        </div>

        {/* Evolution Progress */}
        {pet.evolutionStage < 5 && (
          <div className="text-center text-xs text-slate-500 bg-slate-50 rounded-md py-2 px-3">
            Nog {pet.xpToNextLevel - pet.xp} XP tot volgende ontwikkelingsfase
          </div>
        )}
      </CardContent>
    </Card>
  );
}