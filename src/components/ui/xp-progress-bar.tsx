'use client';

import { useState, useEffect } from 'react';
import { Progress } from './progress';
import { Badge } from './badge';
import { Star, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPProgressBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  showLevelUp?: boolean;
  onLevelUp?: () => void;
  className?: string;
  animated?: boolean;
  showSoundEffect?: boolean;
}

export default function XPProgressBar({
  currentXP,
  xpToNextLevel,
  level,
  showLevelUp = true,
  onLevelUp,
  className,
  animated = true,
  showSoundEffect = true
}: XPProgressBarProps) {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);

  const progressPercentage = (displayXP / xpToNextLevel) * 100;

  useEffect(() => {
    if (animated && currentXP !== displayXP) {
      // Animate XP increase
      const difference = currentXP - displayXP;
      const steps = 20;
      const increment = difference / steps;
      let currentStep = 0;

      const animateXP = () => {
        currentStep++;
        setDisplayXP(prev => {
          const newXP = prev + increment;
          if (currentStep >= steps) {
            // Check if we leveled up
            if (newXP >= xpToNextLevel) {
              setIsLevelingUp(true);
              setShowLevelUpEffect(true);
              onLevelUp?.();

              // Play level up sound effect (if supported)
              if (showSoundEffect && typeof window !== 'undefined') {
                // Could add audio here
                console.log('🎉 LEVEL UP! 🎉');
              }

              setTimeout(() => {
                setIsLevelingUp(false);
                setShowLevelUpEffect(false);
              }, 2000);
            }
            return currentXP;
          }
          return newXP;
        });

        if (currentStep < steps) {
          setTimeout(animateXP, 50);
        }
      };

      animateXP();
    } else {
      setDisplayXP(currentXP);
    }
  }, [currentXP, animated, xpToNextLevel, onLevelUp, showSoundEffect]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Level and XP Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
            <Star className="h-3 w-3 mr-1" />
            Level {level}
          </Badge>
          {showLevelUp && isLevelingUp && (
            <Badge variant="default" className="bg-green-500 animate-bounce">
              <Trophy className="h-3 w-3 mr-1" />
              LEVEL UP!
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {Math.round(displayXP)} / {xpToNextLevel} XP
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress
          value={Math.min(progressPercentage, 100)}
          className={cn(
            'h-3 transition-all duration-300',
            isLevelingUp && 'animate-pulse'
          )}
        />

        {/* Level up sparkles */}
        {showLevelUpEffect && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 text-yellow-400 animate-ping">✨</div>
            <div className="absolute top-0 right-1/4 text-yellow-400 animate-ping" style={{ animationDelay: '0.2s' }}>⭐</div>
            <div className="absolute bottom-0 left-1/3 text-yellow-400 animate-ping" style={{ animationDelay: '0.4s' }}>💫</div>
            <div className="absolute bottom-0 right-1/3 text-yellow-400 animate-ping" style={{ animationDelay: '0.6s' }}>🌟</div>
          </div>
        )}

        {/* XP gain indicator */}
        {animated && displayXP < currentXP && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-green-600 font-bold text-sm animate-bounce">
            +{currentXP - Math.floor(displayXP)} XP
          </div>
        )}
      </div>

      {/* Level up celebration */}
      {showLevelUpEffect && (
        <div className="text-center py-2">
          <div className="text-2xl animate-bounce">🎉</div>
          <div className="text-sm font-bold text-green-600 animate-pulse">
            Gefeliciteerd! Je bent level {level + 1} geworden!
          </div>
          <div className="flex justify-center gap-1 mt-1">
            <Zap className="h-4 w-4 text-yellow-500 animate-spin" />
            <span className="text-xs text-gray-600">Nieuwe krachten ontgrendeld!</span>
            <Zap className="h-4 w-4 text-yellow-500 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for XP animations
export function useXPAnimation() {
  const [xpQueue, setXpQueue] = useState<Array<{ amount: number; delay: number }>>([]);

  const addXP = (amount: number, delay = 0) => {
    setXpQueue(prev => [...prev, { amount, delay }]);
  };

  const processXPQueue = (currentXP: number, onXPChange: (newXP: number) => void) => {
    xpQueue.forEach(({ amount, delay }) => {
      setTimeout(() => {
        onXPChange(currentXP + amount);
      }, delay);
    });
    setXpQueue([]);
  };

  return { addXP, processXPQueue };
}