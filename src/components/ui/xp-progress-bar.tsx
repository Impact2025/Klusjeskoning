'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface XpProgressBarProps {
  current: number;
  max: number;
  className?: string;
  showText?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function XpProgressBar({
  current,
  max,
  className,
  showText = true,
  animated = true,
  size = 'md'
}: XpProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((current / max) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out',
            animated && 'transform origin-left'
          )}
          style={{
            width: `${displayValue}%`,
            transition: animated ? 'width 1s ease-out' : 'none'
          }}
        />
      </div>
      {showText && (
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{current} XP</span>
          <span>{max} XP</span>
        </div>
      )}
    </div>
  );
}

interface LevelProgressBarProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  className?: string;
}

export function LevelProgressBar({
  level,
  currentXp,
  nextLevelXp,
  className
}: LevelProgressBarProps) {
  const progressInLevel = currentXp - (level > 1 ? nextLevelXp - (nextLevelXp - (level - 1) * 100) : 0);
  const xpNeeded = nextLevelXp - (level > 1 ? nextLevelXp - (level - 1) * 100 : 0);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Level {level}</span>
        <span className="text-sm text-gray-600">
          {progressInLevel} / {xpNeeded} XP
        </span>
      </div>
      <XpProgressBar
        current={progressInLevel}
        max={xpNeeded}
        size="md"
        showText={false}
      />
    </div>
  );
}