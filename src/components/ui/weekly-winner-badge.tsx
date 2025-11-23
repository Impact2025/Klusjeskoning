'use client';

import { useApp } from '@/components/app/AppProvider';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WeeklyWinnerBadge() {
  const { user, family } = useApp();
  const [isWinner, setIsWinner] = useState(false);
  const [winnerCriteria, setWinnerCriteria] = useState<string>('');

  useEffect(() => {
    if (!user || !family) return;

    // Find current week's winner
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    // For now, simulate weekly winner logic
    // In production, this would come from the database
    // Use a deterministic approach to avoid infinite re-renders
    const weekSeed = Math.floor(startOfWeek.getTime() / (7 * 24 * 60 * 60 * 1000)); // Week-based seed

    const weeklyWinners = family.children.map((child, index) => {
      // Use deterministic "random" based on child ID and week to avoid re-renders
      const seed = parseInt(child.id.slice(-4), 16) + weekSeed;
      const points = (seed % 100) + 50; // Deterministic mock data
      const criteriaIndex = seed % 3;
      const criteria = ['most_chores', 'fastest', 'most_unpaid'][criteriaIndex];

      return {
        childId: child.id,
        points,
        criteria
      };
    });

    const winner = weeklyWinners.reduce((prev, current) =>
      prev.points > current.points ? prev : current
    );

    setIsWinner(winner.childId === user.id);
    setWinnerCriteria(winner.criteria);
  }, [user, family]);

  if (!isWinner) return null;

  const getCriteriaText = (criteria: string) => {
    switch (criteria) {
      case 'most_chores': return 'Meeste klusjes';
      case 'fastest': return 'Snelste klusser';
      case 'most_unpaid': return 'Meeste niet-betaalde taken';
      default: return 'Held van de Week';
    }
  };

  return (
    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg animate-pulse">
      <Crown className="w-4 h-4 mr-1" />
      <Trophy className="w-4 h-4 mr-1" />
      {getCriteriaText(winnerCriteria)}
    </Badge>
  );
}