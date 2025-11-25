'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Crown, Star, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  childId: string;
  childName: string;
  avatar: string;
  points: number;
  tasksCompleted: number;
  streak: number;
  rank: number;
  isCurrentUser?: boolean;
}

interface WeeklyLeaderboardsProps {
  familyId: string;
  currentChildId: string;
  className?: string;
}

const RANK_ICONS = {
  1: Crown,
  2: Medal,
  3: Award,
  default: Star,
};

const RANK_COLORS = {
  1: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  2: 'text-gray-400 bg-gray-50 border-gray-200',
  3: 'text-amber-600 bg-amber-50 border-amber-200',
  default: 'text-blue-500 bg-blue-50 border-blue-200',
};

export default function WeeklyLeaderboards({
  familyId,
  currentChildId,
  className
}: WeeklyLeaderboardsProps) {
  const [leaderboards, setLeaderboards] = useState<{
    points: LeaderboardEntry[];
    tasks: LeaderboardEntry[];
    streaks: LeaderboardEntry[];
  }>({
    points: [],
    tasks: [],
    streaks: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('points');
  const [weekInfo, setWeekInfo] = useState<{
    startDate: string;
    endDate: string;
    daysLeft: number;
  } | null>(null);

  useEffect(() => {
    loadLeaderboards();
  }, [familyId]);

  const loadLeaderboards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leaderboards/weekly?familyId=${familyId}&currentChildId=${currentChildId}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboards(data.leaderboards);
        setWeekInfo(data.weekInfo);
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    const IconComponent = RANK_ICONS[rank as keyof typeof RANK_ICONS] || RANK_ICONS.default;
    return <IconComponent className="h-5 w-5" />;
  };

  const getRankColor = (rank: number) => {
    return RANK_COLORS[rank as keyof typeof RANK_COLORS] || RANK_COLORS.default;
  };

  const LeaderboardTable = ({ entries, metric }: { entries: LeaderboardEntry[], metric: string }) => (
    <ScrollArea className="h-80">
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const RankIcon = getRankIcon(entry.rank);
          const rankColor = getRankColor(entry.rank);

          return (
            <Card
              key={entry.childId}
              className={cn(
                "p-3 transition-all duration-200",
                entry.isCurrentUser
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2",
                    rankColor
                  )}>
                    {entry.rank <= 3 ? (
                      RankIcon
                    ) : (
                      <span className="text-sm font-bold">{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {entry.avatar || entry.childName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div>
                    <div className="font-medium text-sm">
                      {entry.childName}
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Jij
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {metric === 'points' && `${entry.points} punten`}
                      {metric === 'tasks' && `${entry.tasksCompleted} taken`}
                      {metric === 'streaks' && `${entry.streak} dagen streak`}
                    </div>
                  </div>
                </div>

                {/* Metric Value */}
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {metric === 'points' && entry.points}
                    {metric === 'tasks' && entry.tasksCompleted}
                    {metric === 'streaks' && entry.streak}
                  </div>
                  {entry.rank <= 3 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Trophy className="h-3 w-3" />
                      Top {entry.rank}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-blue-400/10 to-green-400/10" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Wekelijkse Kampioenen
          <Trophy className="h-5 w-5 text-yellow-500" />
        </CardTitle>

        {weekInfo && (
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="text-center">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Week van {new Date(weekInfo.startDate).toLocaleDateString('nl-NL')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Nog {weekInfo.daysLeft} dagen tot reset
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Rankings
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points" className="text-xs">
              Punten
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              Taken
            </TabsTrigger>
            <TabsTrigger value="streaks" className="text-xs">
              Streaks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1">Meeste Punten</h3>
              <p className="text-sm text-gray-600">Wie heeft deze week de meeste punten verdiend?</p>
            </div>
            <LeaderboardTable entries={leaderboards.points} metric="points" />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1">Meeste Taken</h3>
              <p className="text-sm text-gray-600">Wie heeft deze week de meeste taken voltooid?</p>
            </div>
            <LeaderboardTable entries={leaderboards.tasks} metric="tasks" />
          </TabsContent>

          <TabsContent value="streaks" className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg mb-1">Langste Streak</h3>
              <p className="text-sm text-gray-600">Wie heeft de langste dagelijkse streak?</p>
            </div>
            <LeaderboardTable entries={leaderboards.streaks} metric="streaks" />
          </TabsContent>
        </Tabs>

        {/* Weekly Champion Celebration */}
        {leaderboards.points.length > 0 && leaderboards.points[0].rank === 1 && (
          <div className="text-center p-4 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-lg border border-yellow-200">
            <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h4 className="font-bold text-yellow-700 mb-1">
              {leaderboards.points[0].childName} leidt deze week! 👑
            </h4>
            <p className="text-sm text-yellow-600">
              {leaderboards.points[0].points} punten - Geweldig gedaan!
            </p>
          </div>
        )}

        {/* Motivational Message */}
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
            <Star className="h-4 w-4" />
            <span className="font-medium">Komende week winnaars krijgen speciale badges!</span>
          </div>
          <p className="text-xs text-blue-600">
            Blijf taken voltooien om hoger op het leaderboard te komen
          </p>
        </div>
      </CardContent>
    </Card>
  );
}