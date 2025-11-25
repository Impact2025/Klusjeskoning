'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Gift, Star, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonalEvent {
  id: string;
  name: string;
  theme: 'easter' | 'christmas' | 'halloween' | 'summer' | 'general';
  startDate: Date;
  endDate: Date;
  description: string;
  specialRewards: string[];
  quests: SeasonalQuest[];
  decorations: string[];
  isActive: boolean;
}

interface SeasonalQuest {
  id: string;
  name: string;
  description: string;
  points: number;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
  specialReward?: string;
}

interface SeasonalEventsProps {
  className?: string;
}

const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'easter-2024',
    name: 'Paas Avontuur',
    theme: 'easter',
    startDate: new Date('2024-03-24'),
    endDate: new Date('2024-04-07'),
    description: 'Help de Paashaas met speciale paasmissies!',
    specialRewards: ['Paasei Sticker Set', 'Gouden Ei Badge', 'Paashaas Outfit'],
    quests: [
      {
        id: 'find-eggs',
        name: 'Eieren Verzamelen',
        description: 'Zoek naar verborgen paaseieren door klusjes te doen',
        points: 50,
        xpReward: 100,
        progress: 0,
        target: 5,
        completed: false,
        specialReward: 'Gouden Paasei'
      },
      {
        id: 'decorate-basket',
        name: 'Mandje Decoreren',
        description: 'Maak een mooi paasmandje voor de familie',
        points: 25,
        xpReward: 50,
        progress: 0,
        target: 1,
        completed: false,
        specialReward: 'Paas Mandje'
      }
    ],
    decorations: ['🐣', '🥚', '🐰', '🌸'],
    isActive: false
  },
  {
    id: 'christmas-2024',
    name: 'Kerst Magie',
    theme: 'christmas',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-25'),
    description: 'Maak kerstmis extra speciaal met familie klusjes!',
    specialRewards: ['Kerstman Pet', 'Winter Sticker Pack', 'Kerstboom Decoraties'],
    quests: [
      {
        id: 'wrap-presents',
        name: 'Cadeaus Inpakken',
        description: 'Help mee met het inpakken van kerstcadeaus',
        points: 30,
        xpReward: 60,
        progress: 0,
        target: 3,
        completed: false,
        specialReward: 'Kerst Cadeau'
      },
      {
        id: 'decorate-tree',
        name: 'Boom Versieren',
        description: 'Versier de kerstboom met de familie',
        points: 40,
        xpReward: 80,
        progress: 0,
        target: 1,
        completed: false,
        specialReward: 'Kerstster'
      }
    ],
    decorations: ['🎄', '🎅', '❄️', '🎁'],
    isActive: false
  },
  {
    id: 'halloween-2024',
    name: 'Spookavond Avontuur',
    theme: 'halloween',
    startDate: new Date('2024-10-25'),
    endDate: new Date('2024-10-31'),
    description: 'Durf jij de griezelige halloween klusjes aan?',
    specialRewards: ['Spook Kostuum', 'Halloween Sticker Set', 'Pompoen Badge'],
    quests: [
      {
        id: 'carve-pumpkin',
        name: 'Pompoen Uitsnijden',
        description: 'Snijd een griezelige pompoen uit',
        points: 35,
        xpReward: 70,
        progress: 0,
        target: 1,
        completed: false,
        specialReward: 'Spookachtige Pompoen'
      },
      {
        id: 'ghost-stories',
        name: 'Spookverhalen Vertellen',
        description: 'Deel leuke (niet te enge) spookverhalen',
        points: 20,
        xpReward: 40,
        progress: 0,
        target: 2,
        completed: false,
        specialReward: 'Spook Badge'
      }
    ],
    decorations: ['🎃', '👻', '🦇', '🕷️'],
    isActive: false
  },
  {
    id: 'summer-2024',
    name: 'Zomer Fun',
    theme: 'summer',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-08-31'),
    description: 'Geniet van de zomer met buiten klusjes!',
    specialRewards: ['Zonnebril Outfit', 'Zomer Sticker Pack', 'Beach Ball Badge'],
    quests: [
      {
        id: 'garden-watering',
        name: 'Tuin Water Geven',
        description: 'Zorg dat de planten genoeg water krijgen',
        points: 15,
        xpReward: 30,
        progress: 0,
        target: 7,
        completed: false,
        specialReward: 'Waterkan'
      },
      {
        id: 'picnic-prep',
        name: 'Picknick Voorbereiden',
        description: 'Help met het klaarzetten van een zomerse picknick',
        points: 25,
        xpReward: 50,
        progress: 0,
        target: 2,
        completed: false,
        specialReward: 'Picknick Mand'
      }
    ],
    decorations: ['☀️', '🏖️', '🍦', '🌴'],
    isActive: false
  }
];

const THEME_CONFIG = {
  easter: {
    colors: 'from-yellow-400/10 via-pink-400/10 to-green-400/10',
    accentColor: 'text-yellow-600',
    emoji: '🐣'
  },
  christmas: {
    colors: 'from-red-400/10 via-green-400/10 to-blue-400/10',
    accentColor: 'text-red-600',
    emoji: '🎄'
  },
  halloween: {
    colors: 'from-orange-400/10 via-purple-400/10 to-black/10',
    accentColor: 'text-orange-600',
    emoji: '🎃'
  },
  summer: {
    colors: 'from-yellow-400/10 via-blue-400/10 to-green-400/10',
    accentColor: 'text-yellow-600',
    emoji: '☀️'
  },
  general: {
    colors: 'from-blue-400/10 via-purple-400/10 to-pink-400/10',
    accentColor: 'text-blue-600',
    emoji: '🎉'
  }
};

export default function SeasonalEvents({ className }: SeasonalEventsProps) {
  const { user } = useApp();
  const [activeEvent, setActiveEvent] = useState<SeasonalEvent | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Check for active seasonal events
    const now = new Date();
    const currentEvent = SEASONAL_EVENTS.find(event =>
      now >= event.startDate && now <= event.endDate
    );

    if (currentEvent) {
      setActiveEvent(currentEvent);
      updateTimeLeft(currentEvent.endDate);
    }

    // Update time left every minute
    const interval = setInterval(() => {
      if (currentEvent) {
        updateTimeLeft(currentEvent.endDate);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const updateTimeLeft = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft('Evenement afgelopen!');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      setTimeLeft(`${days}d ${hours}u resterend`);
    } else {
      setTimeLeft(`${hours}u resterend`);
    }
  };

  const completeQuest = (questId: string) => {
    if (!activeEvent) return;

    setActiveEvent(prev => {
      if (!prev) return null;

      const updatedQuests = prev.quests.map(quest => {
        if (quest.id === questId && !quest.completed) {
          return {
            ...quest,
            progress: quest.target,
            completed: true
          };
        }
        return quest;
      });

      return {
        ...prev,
        quests: updatedQuests
      };
    });
  };

  if (!activeEvent) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 via-blue-400/10 to-purple-400/10" />
        <CardHeader className="relative text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-gray-500" />
            Seizoen Events
          </CardTitle>
        </CardHeader>
        <CardContent className="relative text-center py-8">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-gray-600">Geen actief seizoen evenement...</p>
          <p className="text-sm text-gray-500 mt-2">Kom later terug voor speciale events! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  const themeConfig = THEME_CONFIG[activeEvent.theme];
  const totalQuests = activeEvent.quests.length;
  const completedQuests = activeEvent.quests.filter(q => q.completed).length;
  const progressPercentage = (completedQuests / totalQuests) * 100;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', themeConfig.colors)} />

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <span className="text-2xl">{themeConfig.emoji}</span>
          {activeEvent.name}
          <span className="text-2xl">{themeConfig.emoji}</span>
        </CardTitle>
        <div className="text-center text-sm text-gray-600 mt-1">
          {activeEvent.description}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Badge variant="outline" className={cn("text-xs", themeConfig.accentColor)}>
            <Calendar className="h-3 w-3 mr-1" />
            {timeLeft}
          </Badge>
          <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
            <Trophy className="h-3 w-3 mr-1" />
            {completedQuests}/{totalQuests} missies
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Evenement Voortgang</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Seasonal Quests */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Seizoen Missies
          </h3>

          {activeEvent.quests.map((quest) => (
            <Card key={quest.id} className={cn(
              "p-4 transition-all",
              quest.completed
                ? "bg-green-50 border-green-200"
                : "hover:shadow-md"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold">{quest.name}</h4>
                    {quest.completed && (
                      <Badge variant="default" className="bg-green-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        Voltooid!
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600">{quest.description}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{quest.points} punten</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span>{quest.xpReward} XP</span>
                    </div>
                  </div>

                  {!quest.completed && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Voortgang</span>
                        <span>{quest.progress}/{quest.target}</span>
                      </div>
                      <Progress
                        value={(quest.progress / quest.target) * 100}
                        className="h-1"
                      />
                    </div>
                  )}

                  {quest.specialReward && (
                    <div className="flex items-center gap-1 text-sm text-purple-600">
                      <Gift className="h-4 w-4" />
                      <span>Speciale beloning: {quest.specialReward}</span>
                    </div>
                  )}
                </div>

                {!quest.completed && (
                  <Button
                    size="sm"
                    onClick={() => completeQuest(quest.id)}
                    className="ml-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Trophy className="h-4 w-4 mr-1" />
                    Voltooien
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Special Rewards */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            Speciale Beloningen
          </h3>

          <div className="grid grid-cols-1 gap-2">
            {activeEvent.specialRewards.map((reward, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-white/20"
              >
                <div className="text-2xl">🎁</div>
                <span className="font-medium">{reward}</span>
                {completedQuests === totalQuests && (
                  <Badge variant="default" className="ml-auto bg-yellow-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Verdiend!
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Decorations */}
        <div className="text-center py-4">
          <div className="flex justify-center gap-2 text-2xl">
            {activeEvent.decorations.map((decoration, index) => (
              <span key={index} className="animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
                {decoration}
              </span>
            ))}
          </div>
        </div>

        {/* Completion Message */}
        {completedQuests === totalQuests && (
          <div className="text-center p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg border border-yellow-200">
            <div className="text-3xl mb-2">🎉</div>
            <h4 className="font-bold text-yellow-700 mb-1">
              Gefeliciteerd! Seizoen Event Voltooid! 🏆
            </h4>
            <p className="text-sm text-yellow-600">
              Alle speciale beloningen zijn nu van jou!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}