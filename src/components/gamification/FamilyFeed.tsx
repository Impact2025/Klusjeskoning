'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Heart, ThumbsUp, Star, Trophy, Sparkles, MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from '@/lib/timestamp';

interface FamilyFeedItem {
  id: string;
  childId: string;
  childName: string;
  childAvatar: string;
  type: 'chore_completed' | 'level_up' | 'badge_earned' | 'sticker_unlocked' | 'pet_evolved' | 'quest_chain_completed';
  message: string;
  data?: any;
  reactions: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  createdAt: Date;
}

interface FamilyFeedProps {
  className?: string;
}

const FEED_TYPE_CONFIG = {
  chore_completed: {
    icon: Trophy,
    color: 'text-green-600 bg-green-50',
    emoji: '✅'
  },
  level_up: {
    icon: Star,
    color: 'text-yellow-600 bg-yellow-50',
    emoji: '⬆️'
  },
  badge_earned: {
    icon: Trophy,
    color: 'text-purple-600 bg-purple-50',
    emoji: '🏆'
  },
  sticker_unlocked: {
    icon: Sparkles,
    color: 'text-pink-600 bg-pink-50',
    emoji: '🎨'
  },
  pet_evolved: {
    icon: Heart,
    color: 'text-red-600 bg-red-50',
    emoji: '🐾'
  },
  quest_chain_completed: {
    icon: Trophy,
    color: 'text-blue-600 bg-blue-50',
    emoji: '🎯'
  }
};

const REACTION_OPTIONS = [
  { emoji: '👍', label: 'thumbs_up' },
  { emoji: '👑', label: 'crown' },
  { emoji: '🎉', label: 'party' },
  { emoji: '🌟', label: 'star' }
];

export default function FamilyFeed({ className }: FamilyFeedProps) {
  const { user, family } = useApp();
  const [feedItems, setFeedItems] = useState<FamilyFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (family) {
      loadFamilyFeed();
    }
  }, [family]);

  const loadFamilyFeed = async () => {
    try {
      setIsLoading(true);
      // In production, this would fetch from the API
      // For now, generate some sample data
      const sampleFeed: FamilyFeedItem[] = [
        {
          id: '1',
          childId: family?.children[0]?.id || 'sample',
          childName: family?.children[0]?.name || 'Sample Child',
          childAvatar: family?.children[0]?.avatar || '👤',
          type: 'chore_completed',
          message: 'heeft de keuken opgeruimd! Wat een held! 🏠✨',
          reactions: [
            { emoji: '👍', count: 2, users: ['parent1', 'sibling1'] },
            { emoji: '👑', count: 1, users: ['parent2'] }
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
        {
          id: '2',
          childId: family?.children[1]?.id || 'sample2',
          childName: family?.children[1]?.name || 'Another Child',
          childAvatar: family?.children[1]?.avatar || '👤',
          type: 'level_up',
          message: 'is opgegaan naar level 5! Sterrenstatus bereikt! ⭐⭐⭐⭐⭐',
          reactions: [
            { emoji: '🎉', count: 3, users: ['parent1', 'sibling1', 'sibling2'] }
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          id: '3',
          childId: family?.children[0]?.id || 'sample',
          childName: family?.children[0]?.name || 'Sample Child',
          childAvatar: family?.children[0]?.avatar || '👤',
          type: 'badge_earned',
          message: 'heeft de "Keuken Kampioen" badge verdiend! 🏆',
          reactions: [
            { emoji: '🌟', count: 1, users: ['parent2'] }
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        }
      ];

      setFeedItems(sampleFeed);
    } catch (error) {
      console.error('Error loading family feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (feedItemId: string, emoji: string) => {
    // In production, this would send to the API
    setFeedItems(prev => prev.map(item => {
      if (item.id === feedItemId) {
        const existingReaction = item.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          // Toggle reaction
          const hasUserReacted = existingReaction.users.includes(user?.id || 'current');
          if (hasUserReacted) {
            // Remove reaction
            existingReaction.count--;
            existingReaction.users = existingReaction.users.filter(u => u !== (user?.id || 'current'));
          } else {
            // Add reaction
            existingReaction.count++;
            existingReaction.users.push(user?.id || 'current');
          }
        } else {
          // Add new reaction
          item.reactions.push({
            emoji,
            count: 1,
            users: [user?.id || 'current']
          });
        }
      }
      return item;
    }));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Zojuist';
    if (diffInMinutes < 60) return `${diffInMinutes}m geleden`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u geleden`;
    return `${Math.floor(diffInMinutes / 1440)}d geleden`;
  };

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 via-purple-400/10 to-pink-400/10" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <MessageCircle className="h-5 w-5 text-indigo-500" />
          Familie Feed
          <MessageCircle className="h-5 w-5 text-indigo-500" />
        </CardTitle>
        <div className="text-center text-sm text-gray-600 mt-1">
          Zie wat iedereen bereikt! 👨‍👩‍👧‍👦
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {feedItems.length > 0 ? feedItems.map((item) => {
              const config = FEED_TYPE_CONFIG[item.type];
              const IconComponent = config.icon;

              return (
                <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">
                        {item.childAvatar}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{item.childName}</span>
                        <Badge variant="outline" className={cn("text-xs", config.color)}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {config.emoji}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(item.createdAt)}
                        </div>
                      </div>

                      <p className="text-sm">{item.message}</p>

                      {/* Reactions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.reactions.map((reaction, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-7 px-2 text-xs hover:scale-110 transition-transform",
                              reaction.users.includes(user?.id || 'current') && "bg-blue-50 border-blue-200"
                            )}
                            onClick={() => handleReaction(item.id, reaction.emoji)}
                          >
                            {reaction.emoji} {reaction.count}
                          </Button>
                        ))}

                        {/* Add reaction button */}
                        <div className="flex gap-1 ml-2">
                          {REACTION_OPTIONS.map((option) => (
                            <Button
                              key={option.label}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:scale-110 transition-transform"
                              onClick={() => handleReaction(item.id, option.emoji)}
                            >
                              {option.emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Nog geen familie updates...</p>
                <p className="text-xs mt-1">Voltooi taken om de feed te vullen! 🚀</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Motivational message */}
        <div className="text-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-center gap-2 text-indigo-700 mb-1">
            <Heart className="h-4 w-4" />
            <span className="font-medium text-sm">Familie trots!</span>
          </div>
          <p className="text-xs text-indigo-600">
            Reageer op elkaars successen om elkaar te motiveren 💪
          </p>
        </div>
      </CardContent>
    </Card>
  );
}