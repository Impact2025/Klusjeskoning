'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ThumbsUp, Star, Trophy, Sparkles, MessageCircle, Clock, RefreshCw, Flame, Gift, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
}

interface FamilyFeedItem {
  id: string;
  familyId: string;
  childId: string | null;
  childName: string | null;
  childAvatar: string | null;
  type: string;
  message: string;
  data: Record<string, unknown> | null;
  reactions: FeedReaction[];
  createdAt: string;
}

interface FamilyFeedProps {
  className?: string;
  maxHeight?: string;
}

const FEED_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; emoji: string }> = {
  chore_completed: { icon: Trophy, color: 'text-green-600 bg-green-50', emoji: '✅' },
  level_up: { icon: Star, color: 'text-yellow-600 bg-yellow-50', emoji: '⬆️' },
  badge_earned: { icon: Trophy, color: 'text-purple-600 bg-purple-50', emoji: '🏆' },
  sticker_unlocked: { icon: Sparkles, color: 'text-pink-600 bg-pink-50', emoji: '🎨' },
  pet_evolved: { icon: Heart, color: 'text-red-600 bg-red-50', emoji: '🐾' },
  quest_chain_completed: { icon: Trophy, color: 'text-blue-600 bg-blue-50', emoji: '🎯' },
  streak_achieved: { icon: Flame, color: 'text-orange-600 bg-orange-50', emoji: '🔥' },
  reward_claimed: { icon: Gift, color: 'text-teal-600 bg-teal-50', emoji: '🎁' },
  weekly_champion: { icon: Crown, color: 'text-amber-600 bg-amber-50', emoji: '👑' },
};

const REACTION_OPTIONS = [
  { emoji: '👍', label: 'thumbs_up' },
  { emoji: '👑', label: 'crown' },
  { emoji: '🎉', label: 'party' },
  { emoji: '🌟', label: 'star' },
  { emoji: '❤️', label: 'heart' },
];

export default function FamilyFeed({ className, maxHeight = 'h-96' }: FamilyFeedProps) {
  const { user, family } = useApp();
  const [feedItems, setFeedItems] = useState<FamilyFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFamilyFeed = useCallback(async (showRefreshIndicator = false) => {
    if (!family?.id) return;

    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await fetch(`/api/family-feed?familyId=${family.id}&limit=30`);

      if (!response.ok) {
        throw new Error('Failed to load feed');
      }

      const data = await response.json();
      setFeedItems(data.feedItems || []);
      setError(null);
    } catch (err) {
      console.error('Error loading family feed:', err);
      setError('Kon feed niet laden');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [family?.id]);

  useEffect(() => {
    loadFamilyFeed();
  }, [loadFamilyFeed]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadFamilyFeed(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadFamilyFeed]);

  const handleReaction = async (feedItemId: string, emoji: string) => {
    if (!user) return;

    // Optimistic update
    setFeedItems(prev => prev.map(item => {
      if (item.id !== feedItemId) return item;

      const newReactions = [...item.reactions];
      const existingReaction = newReactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        const userIndex = existingReaction.users.findIndex(u => u.id === user.id);
        if (userIndex >= 0) {
          existingReaction.users.splice(userIndex, 1);
          existingReaction.count--;
          if (existingReaction.count <= 0) {
            const reactionIndex = newReactions.findIndex(r => r.emoji === emoji);
            newReactions.splice(reactionIndex, 1);
          }
        } else {
          existingReaction.users.push({ id: user.id, name: user.name });
          existingReaction.count++;
        }
      } else {
        newReactions.push({
          emoji,
          count: 1,
          users: [{ id: user.id, name: user.name }],
        });
      }

      return { ...item, reactions: newReactions };
    }));

    // Send to API
    try {
      await fetch('/api/family-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'react',
          feedItemId,
          emoji,
          userId: user.id,
          userName: user.name,
        }),
      });
    } catch (err) {
      console.error('Error adding reaction:', err);
      // Revert on error
      loadFamilyFeed(true);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Zojuist';
    if (diffInMinutes < 60) return `${diffInMinutes}m geleden`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u geleden`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d geleden`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const hasUserReacted = (reactions: FeedReaction[], emoji: string): boolean => {
    if (!user) return false;
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction ? reaction.users.some(u => u.id === user.id) : false;
  };

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-500" />
            Familie Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
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

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-indigo-500" />
            Familie Feed
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadFamilyFeed(true)}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <p className="text-xs text-gray-500">Zie wat iedereen bereikt! 👨‍👩‍👧‍👦</p>
      </CardHeader>

      <CardContent className="relative space-y-3 pt-0">
        {error && (
          <div className="text-center py-4 text-red-500 text-sm">
            {error}
            <Button variant="link" size="sm" onClick={() => loadFamilyFeed()}>
              Opnieuw proberen
            </Button>
          </div>
        )}

        <ScrollArea className={maxHeight}>
          <div className="space-y-3 pr-2">
            {feedItems.length > 0 ? feedItems.map((item) => {
              const config = FEED_TYPE_CONFIG[item.type] || FEED_TYPE_CONFIG.chore_completed;
              const IconComponent = config.icon;

              return (
                <Card key={item.id} className="p-3 hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-indigo-400">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="text-sm bg-gradient-to-br from-indigo-100 to-purple-100">
                        {item.childAvatar || item.childName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-grow min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm truncate">{item.childName || 'Onbekend'}</span>
                        <Badge variant="outline" className={cn("text-xs px-1.5 py-0", config.color)}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {config.emoji}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(item.createdAt)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 leading-snug">{item.message}</p>

                      {/* Reactions */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {/* Existing reactions */}
                        {item.reactions.map((reaction, index) => (
                          <Button
                            key={`${reaction.emoji}-${index}`}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-7 px-2 text-xs hover:scale-105 transition-transform rounded-full",
                              hasUserReacted(item.reactions, reaction.emoji) && "bg-indigo-100 border border-indigo-300"
                            )}
                            onClick={() => handleReaction(item.id, reaction.emoji)}
                            title={reaction.users.map(u => u.name).join(', ')}
                          >
                            {reaction.emoji} {reaction.count}
                          </Button>
                        ))}

                        {/* Add reaction buttons */}
                        <div className="flex gap-0.5 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                          {REACTION_OPTIONS.filter(opt =>
                            !item.reactions.some(r => r.emoji === opt.emoji)
                          ).slice(0, 3).map((option) => (
                            <Button
                              key={option.label}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
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
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Nog geen familie updates</p>
                <p className="text-xs mt-1 text-gray-400">
                  Voltooi taken om de feed te vullen! 🚀
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Motivational footer */}
        {feedItems.length > 0 && (
          <div className="text-center p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <div className="flex items-center justify-center gap-1.5 text-indigo-700">
              <Heart className="h-3.5 w-3.5" />
              <span className="font-medium text-xs">Familie trots!</span>
            </div>
            <p className="text-xs text-indigo-600/80 mt-0.5">
              Reageer op elkaars successen 💪
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
