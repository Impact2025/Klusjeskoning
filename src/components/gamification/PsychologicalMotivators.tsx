'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
  Star,
  Target,
  Users,
  Trophy,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MotivationalMessage {
  type: 'autonomy' | 'mastery' | 'purpose' | 'competence' | 'relatedness';
  title: string;
  message: string;
  emoji: string;
  color: string;
  choices?: string[];
}

interface PsychologicalMotivatorsProps {
  triggerType?: 'autonomy' | 'mastery' | 'purpose' | 'competence' | 'relatedness' | 'random';
  showChoices?: boolean;
  compact?: boolean;
  className?: string;
}

const MOTIVATIONAL_MESSAGES: MotivationalMessage[] = [
  // Autonomy - Choice and Control
  {
    type: 'autonomy',
    title: 'Jouw Keuze!',
    message: 'Je mag zelf kiezen hoe je deze klus wilt doen. Welke manier lijkt je het leukst?',
    emoji: '🎯',
    color: 'from-blue-500 to-cyan-500',
    choices: [
      'Met mijn favoriete muziek aan',
      'Samen met een broertje/zusje',
      'Zo snel mogelijk (als een race!)',
      'Extra netjes en perfect'
    ]
  },
  {
    type: 'autonomy',
    title: 'Jouw Plan',
    message: 'Jij bent de baas! Hoe wil je deze taak aanpakken?',
    emoji: '🗺️',
    color: 'from-indigo-500 to-purple-500',
    choices: [
      'Stap voor stap volgens mijn lijstje',
      'Eerst de moeilijke delen',
      'Eerst de leuke delen bewaren',
      'Op mijn eigen creatieve manier'
    ]
  },

  // Mastery - Progress and Skill Building
  {
    type: 'mastery',
    title: 'Word een Expert!',
    message: 'Elke keer dat je dit doet, word je er beter in. Je bent al een professional!',
    emoji: '🏆',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    type: 'mastery',
    title: 'Nieuwe Vaardigheid',
    message: 'Kijk eens hoe goed je dit onder de knie hebt! Je leert supersnel.',
    emoji: '📈',
    color: 'from-green-500 to-emerald-500'
  },

  // Purpose - Meaning and Impact
  {
    type: 'purpose',
    title: 'Jouw Superkracht',
    message: 'Door deze klus te doen, help je je familie enorm. Jij bent de held van het huis!',
    emoji: '🦸‍♂️',
    color: 'from-red-500 to-pink-500'
  },
  {
    type: 'purpose',
    title: 'Voor Elkaar',
    message: 'Dit helpt iedereen in het gezin. Samen maken we ons huis gezelliger!',
    emoji: '👨‍👩‍👧‍👦',
    color: 'from-purple-500 to-violet-500'
  },

  // Competence - Feeling Capable
  {
    type: 'competence',
    title: 'Jij Kunt Dit!',
    message: 'Je hebt dit al eerder gedaan en het ging geweldig. Je bent er klaar voor!',
    emoji: '💪',
    color: 'from-orange-500 to-red-500'
  },
  {
    type: 'competence',
    title: 'Trots op Jezelf',
    message: 'Kijk eens hoe ver je al gekomen bent! Je kunt trots zijn op jezelf.',
    emoji: '🌟',
    color: 'from-cyan-500 to-blue-500'
  },

  // Relatedness - Connection and Belonging
  {
    type: 'relatedness',
    title: 'Samen Sterk',
    message: 'We doen dit samen als gezin. Iedereen helpt elkaar en dat maakt ons sterk!',
    emoji: '🤝',
    color: 'from-pink-500 to-rose-500'
  },
  {
    type: 'relatedness',
    title: 'Familie Team',
    message: 'Jouw bijdrage maakt ons team compleet. We hebben elkaar nodig!',
    emoji: '❤️',
    color: 'from-rose-500 to-pink-500'
  }
];

export default function PsychologicalMotivators({
  triggerType = 'random',
  showChoices = false,
  compact = false,
  className
}: PsychologicalMotivatorsProps) {
  const { user } = useApp();
  const [currentMessage, setCurrentMessage] = useState<MotivationalMessage | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const messages = triggerType === 'random'
      ? MOTIVATIONAL_MESSAGES
      : MOTIVATIONAL_MESSAGES.filter(m => m.type === triggerType);

    if (messages.length > 0) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
    }
  }, [triggerType]);

  const handleChoiceSelect = (choice: string) => {
    setSelectedChoice(choice);
    setShowResult(true);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowResult(false);
      setSelectedChoice('');
    }, 3000);
  };

  if (!currentMessage) return null;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r text-white text-sm',
        currentMessage.color,
        className
      )}>
        <span className="text-lg">{currentMessage.emoji}</span>
        <span className="font-medium">{currentMessage.title}</span>
      </div>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-10',
        currentMessage.color
      )} />

      <CardContent className="relative p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl',
            currentMessage.color
          )}>
            {currentMessage.emoji}
          </div>

          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{currentMessage.title}</h3>
              <Badge variant="outline" className="text-xs capitalize">
                {currentMessage.type}
              </Badge>
            </div>

            <p className="text-gray-700 leading-relaxed">
              {currentMessage.message}
            </p>

            {/* Choice Options */}
            {showChoices && currentMessage.choices && !showResult && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-gray-600">Kies je aanpak:</p>
                <div className="grid grid-cols-1 gap-2">
                  {currentMessage.choices.map((choice, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleChoiceSelect(choice)}
                      className="justify-start text-left h-auto py-2 px-3"
                    >
                      <ArrowRight className="h-3 w-3 mr-2 text-blue-500" />
                      {choice}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Choice Result */}
            {showResult && selectedChoice && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Goede keuze!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  "{selectedChoice}" - Dat klinkt als een perfect plan! 🚀
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator for Mastery */}
        {currentMessage.type === 'mastery' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Jouw Voortgang</span>
              <span>{user?.xp || 0} XP</span>
            </div>
            <Progress value={((user?.xp || 0) % 100)} className="h-2" />
            <p className="text-xs text-gray-500">
              Blijf doorgaan om een echte expert te worden! 💪
            </p>
          </div>
        )}

        {/* Relatedness Connection */}
        {currentMessage.type === 'relatedness' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-700">Familie Band</p>
              <p className="text-xs text-blue-600">
                Samen maken we elke dag bijzonder! 👨‍👩‍👧‍👦
              </p>
            </div>
          </div>
        )}

        {/* Floating motivational elements */}
        <div className="absolute top-2 right-2 opacity-20">
          <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for easy integration
export function usePsychologicalMotivators() {
  const [motivators, setMotivators] = useState<{
    type: string;
    message: string;
    timestamp: Date;
  }[]>([]);

  const addMotivator = (type: string, message: string) => {
    setMotivators(prev => [...prev, {
      type,
      message,
      timestamp: new Date()
    }]);
  };

  const getMotivatorByType = (type: string) => {
    return motivators.filter(m => m.type === type);
  };

  return {
    motivators,
    addMotivator,
    getMotivatorByType
  };
}

// Quick motivator components for different contexts
export function AutonomyChoice({ children, onChoice }: {
  children: React.ReactNode;
  onChoice?: (choice: string) => void;
}) {
  return (
    <div className="space-y-2">
      <PsychologicalMotivators
        triggerType="autonomy"
        showChoices={true}
        compact={true}
      />
      {children}
    </div>
  );
}

export function MasteryProgress({ skill, progress }: {
  skill: string;
  progress: number;
}) {
  return (
    <div className="space-y-2">
      <PsychologicalMotivators
        triggerType="mastery"
        compact={true}
      />
      <div className="text-sm text-gray-600">
        {skill}: {progress}% compleet
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

export function PurposeReminder({ impact }: {
  impact: string;
}) {
  return (
    <PsychologicalMotivators
      triggerType="purpose"
      compact={true}
    />
  );
}