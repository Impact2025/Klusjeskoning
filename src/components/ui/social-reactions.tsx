'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/app/AppProvider';
import { Heart, ThumbsUp, Star, Trophy, Zap } from 'lucide-react';

interface SocialReactionsProps {
  choreId: string;
  onReaction?: (reactionType: string) => void;
}

const reactionOptions = [
  { type: 'thumbs_up', icon: ThumbsUp, label: '👍', color: 'text-blue-500' },
  { type: 'heart', icon: Heart, label: '❤️', color: 'text-red-500' },
  { type: 'star', icon: Star, label: '⭐', color: 'text-yellow-500' },
  { type: 'trophy', icon: Trophy, label: '🏆', color: 'text-orange-500' },
  { type: 'fire', icon: Zap, label: '🔥', color: 'text-orange-600' },
];

export default function SocialReactions({ choreId, onReaction }: SocialReactionsProps) {
  const { user, family } = useApp();
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const handleReaction = (reactionType: string) => {
    if (!user || !family) return;

    // Find siblings (other children in the family)
    const siblings = family.children.filter(child => child.id !== user.id);

    if (siblings.length === 0) return;

    // For now, simulate sending reaction to all siblings
    // In production, this would send to the database
    setSelectedReaction(reactionType);

    // Call the callback if provided
    onReaction?.(reactionType);

    // Reset after animation
    setTimeout(() => setSelectedReaction(null), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-gray-500 mr-2">Reageer:</span>
      <div className="flex gap-1">
        {reactionOptions.map((reaction) => {
          const Icon = reaction.icon;
          return (
            <Button
              key={reaction.type}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 hover:scale-110 transition-transform ${
                selectedReaction === reaction.type ? 'animate-bounce' : ''
              }`}
              onClick={() => handleReaction(reaction.type)}
            >
              <Icon className={`h-4 w-4 ${reaction.color}`} />
            </Button>
          );
        })}
      </div>
    </div>
  );
}