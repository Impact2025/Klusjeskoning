'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Star, Trophy, CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Chore } from '@/lib/types';
import SocialReactions from './social-reactions';

interface QuestCardProps {
  chore: Chore;
  onComplete: (choreId: string) => void;
  isCompleted?: boolean;
  isSubmitted?: boolean;
  className?: string;
}

export function QuestCard({
  chore,
  onComplete,
  isCompleted = false,
  isSubmitted = false,
  className
}: QuestCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getQuestTypeColor = () => {
    if (chore.isMainQuest) return 'border-yellow-400 bg-yellow-50';
    if (chore.questChainId) return 'border-blue-400 bg-blue-50';
    return 'border-gray-200 bg-white';
  };

  const getQuestTypeIcon = () => {
    if (chore.isMainQuest) return <Trophy className="h-4 w-4 text-yellow-600" />;
    if (chore.questChainId) return <Star className="h-4 w-4 text-blue-600" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer',
        getQuestTypeColor(),
        isCompleted && 'opacity-75',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getQuestTypeIcon()}
            <CardTitle className="text-lg">{chore.name}</CardTitle>
          </div>
          {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
          {isSubmitted && <Clock className="h-5 w-5 text-orange-500" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rewards */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-yellow-600">{chore.points}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-blue-600">XP</span>
            <span className="font-bold text-blue-600">+{chore.xpReward}</span>
          </div>
        </div>

        {/* Quest Type Badge */}
        {chore.isMainQuest && (
          <Badge variant="outline" className="text-yellow-700 border-yellow-400">
            Hoofdmissie
          </Badge>
        )}
        {chore.questChainId && !chore.isMainQuest && (
          <Badge variant="outline" className="text-blue-700 border-blue-400">
            Deel van reeks
          </Badge>
        )}

        {/* Action Button */}
        {!isCompleted && !isSubmitted && (
          <Button
            onClick={() => {
              // Trigger confetti animation
              confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 } });
              onComplete(chore.id);
            }}
            className={cn(
              'w-full transition-all duration-200',
              isHovered && 'scale-105'
            )}
            size="sm"
          >
            Klaar! 🎉
          </Button>
        )}

        {isSubmitted && (
          <div className="text-center text-sm text-orange-600 font-medium">
            Wacht op goedkeuring...
          </div>
        )}

        {isCompleted && (
          <div className="space-y-2">
            <div className="text-center text-sm text-green-600 font-medium">
              Voltooid! ✅
            </div>
            <SocialReactions choreId={chore.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuestChainProgressProps {
  chainName: string;
  completedSteps: number;
  totalSteps: number;
  className?: string;
}

export function QuestChainProgress({
  chainName,
  completedSteps,
  totalSteps,
  className
}: QuestChainProgressProps) {
  const percentage = (completedSteps / totalSteps) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{chainName}</span>
        <span className="text-sm text-gray-600">
          {completedSteps} / {totalSteps}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}