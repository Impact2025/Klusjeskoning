'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Target, Heart, Flame, Crown, Medal, Award } from 'lucide-react';
import type { RankingEntry, RankingType, RankingCategory } from '@/lib/ranking-utils';

interface FamilyRankingProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryConfig = {
  xp: {
    icon: Star,
    label: 'XP Punten',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  chores: {
    icon: Target,
    label: 'Klusjes',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  powerpoints: {
    icon: Crown,
    label: 'PowerKlusjes',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  streak: {
    icon: Flame,
    label: 'Streak',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  pet_care: {
    icon: Heart,
    label: 'Huisdier Zorg',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  }
};

const tierConfig = {
  diamond: {
    icon: Crown,
    label: 'Diamond',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  },
  gold: {
    icon: Trophy,
    label: 'Goud',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  silver: {
    icon: Medal,
    label: 'Zilver',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  bronze: {
    icon: Award,
    label: 'Brons',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
};

export default function FamilyRanking({ isOpen, onClose }: FamilyRankingProps) {
  const { user } = useApp();
  const [rankings, setRankings] = useState<Record<RankingCategory, RankingEntry[]>>({
    xp: [],
    chores: [],
    powerpoints: [],
    streak: [],
    pet_care: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<RankingType>('family');
  const [selectedCategory, setSelectedCategory] = useState<RankingCategory>('xp');

  useEffect(() => {
    if (isOpen) {
      loadRankings();
    }
  }, [isOpen, selectedType, selectedCategory]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rankings?type=${selectedType}&category=${selectedCategory}`);
      if (response.ok) {
        const data = await response.json();
        setRankings(prev => ({
          ...prev,
          [selectedCategory]: data.entries || []
        }));
      }
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getCurrentUserEntry = () => {
    return rankings[selectedCategory]?.find(entry => entry.childId === user?.id);
  };

  const currentUserEntry = getCurrentUserEntry();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8" />
              <div>
                <CardTitle className="text-xl">KlusjesKoning Ranglijst</CardTitle>
                <p className="text-blue-100 text-sm">Wie is deze week de beste helper?</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Ranking Type Selector */}
          <div className="p-4 border-b bg-gray-50">
            <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as RankingType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="family" className="text-sm">
                  👨‍👩‍👧 Gezin
                </TabsTrigger>
                <TabsTrigger value="friends" className="text-sm">
                  👫 Vrienden
                </TabsTrigger>
                <TabsTrigger value="powerklusjes" className="text-sm">
                  ⚡ PowerKlusjes
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Selector */}
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(key as RankingCategory)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{config.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Current User Highlight */}
          {currentUserEntry && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getRankEmoji(currentUserEntry.rank)}</div>
                  <div>
                    <p className="font-semibold text-gray-900">Jouw positie</p>
                    <p className="text-sm text-gray-600">
                      {currentUserEntry.score} {categoryConfig[selectedCategory].label.toLowerCase()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>{tierConfig[currentUserEntry.tier].label}</span>
                  <span>{currentUserEntry.title}</span>
                </Badge>
              </div>
            </div>
          )}

          {/* Rankings List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Ranglijst laden...</p>
              </div>
            ) : rankings[selectedCategory]?.length > 0 ? (
              <div className="divide-y">
                {rankings[selectedCategory].map((entry, index) => {
                  const Icon = tierConfig[entry.tier].icon;
                  const isCurrentUser = entry.childId === user?.id;

                  return (
                    <div
                      key={entry.childId}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="text-xl font-bold text-gray-900 w-8 text-center">
                              {getRankEmoji(entry.rank)}
                            </div>

                            {/* Avatar */}
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {entry.avatar ? (
                                <img
                                  src={entry.avatar}
                                  alt={entry.childName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                entry.childName.charAt(0).toUpperCase()
                              )}
                            </div>

                            {/* Name and Title */}
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold truncate ${
                                isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {entry.childName} {isCurrentUser && '(Jij)'}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                {entry.title}
                              </p>
                            </div>
                          </div>

                          {/* Score and Tier */}
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{entry.score}</p>
                              <p className="text-xs text-gray-600">
                                {categoryConfig[selectedCategory].label.toLowerCase()}
                              </p>
                            </div>

                            <Badge
                              variant="outline"
                              className={`flex items-center space-x-1 ${tierConfig[entry.tier].bgColor} ${tierConfig[entry.tier].borderColor}`}
                            >
                              <Icon className={`w-3 h-3 ${tierConfig[entry.tier].color}`} />
                              <span className={`text-xs ${tierConfig[entry.tier].color}`}>
                                {tierConfig[entry.tier].label}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Nog geen rankings</h3>
                <p className="text-gray-600 text-sm">
                  Wees de eerste die punten scoort deze week!
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>🏆 Word wekelijks kampioen voor speciale beloningen!</p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Sluiten
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}