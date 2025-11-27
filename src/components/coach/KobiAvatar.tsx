'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface KobiAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleeping';
  animate?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const moodEmojis = {
  happy: '😊',
  excited: '🤩',
  thinking: '🤔',
  celebrating: '🎉',
  sleeping: '😴',
};

const moodColors = {
  happy: 'from-yellow-400 to-orange-400',
  excited: 'from-pink-400 to-purple-500',
  thinking: 'from-blue-400 to-indigo-500',
  celebrating: 'from-green-400 to-emerald-500',
  sleeping: 'from-gray-400 to-slate-500',
};

export default function KobiAvatar({
  size = 'md',
  mood = 'happy',
  animate = true,
  className,
}: KobiAvatarProps) {
  const [currentMood, setCurrentMood] = useState(mood);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setCurrentMood(mood);
    if (animate && mood === 'celebrating') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mood, animate]);

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center',
        'bg-gradient-to-br shadow-lg',
        moodColors[currentMood],
        sizeClasses[size],
        animate && 'transition-all duration-300',
        isAnimating && 'animate-bounce',
        className
      )}
    >
      {/* Inner circle */}
      <div
        className={cn(
          'absolute inset-1 rounded-full bg-white/90 flex items-center justify-center',
          animate && 'transition-all duration-300'
        )}
      >
        {/* Kobi face */}
        <span
          className={cn(
            'select-none',
            size === 'sm' && 'text-lg',
            size === 'md' && 'text-2xl',
            size === 'lg' && 'text-3xl',
            size === 'xl' && 'text-5xl',
            animate && 'transition-transform duration-300',
            isAnimating && 'scale-110'
          )}
        >
          {moodEmojis[currentMood]}
        </span>
      </div>

      {/* Sparkle effects for celebrating */}
      {currentMood === 'celebrating' && (
        <>
          <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
          <span className="absolute -bottom-1 -left-1 text-xs animate-ping delay-100">✨</span>
        </>
      )}

      {/* Notification dot */}
      {/* Can be enabled by parent component */}
    </div>
  );
}

// Export a simple Kobi icon for use in buttons etc.
export function KobiIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400',
        'flex items-center justify-center text-xs',
        className
      )}
    >
      <span className="select-none">🤖</span>
    </div>
  );
}
