'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Zap, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestCelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
  xpGained?: number;
  pointsGained?: number;
  badgeEarned?: string;
  className?: string;
}

export default function QuestCelebration({
  isVisible,
  onComplete,
  xpGained = 0,
  pointsGained = 0,
  badgeEarned,
  className
}: QuestCelebrationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Step 1: Mega confetti explosion
      setCurrentStep(1);
      triggerMegaConfetti();

      // Step 2: Show celebration text
      setTimeout(() => {
        setCurrentStep(2);
      }, 500);

      // Step 3: Show stats
      setTimeout(() => {
        setCurrentStep(3);
        setShowStats(true);
      }, 1500);

      // Step 4: Show badge if earned
      if (badgeEarned) {
        setTimeout(() => {
          setCurrentStep(4);
        }, 2500);
      }

      // Complete celebration
      setTimeout(() => {
        onComplete();
        setCurrentStep(0);
        setShowStats(false);
      }, badgeEarned ? 4000 : 3000);
    }
  }, [isVisible, onComplete, badgeEarned]);

  const triggerMegaConfetti = () => {
    // Main explosion
    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.6, x: 0.5 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#9B59B6', '#E74C3C'],
      gravity: 0.8,
      drift: 0.1,
      shapes: ['circle', 'square'],
      scalar: 1.2,
    });

    // Side explosions
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.8 },
        colors: ['#FFD700', '#FF6B6B', '#F39C12'],
        shapes: ['circle'],
        scalar: 0.8,
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.8 },
        colors: ['#4ECDC4', '#45B7D1', '#3498DB'],
        shapes: ['square'],
        scalar: 0.8,
      });
    }, 400);

    // Top celebration
    setTimeout(() => {
      confetti({
        particleCount: 150,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 0 },
        colors: ['#E91E63', '#9C27B0', '#673AB7'],
        gravity: 0.6,
        drift: 0.2,
      });
    }, 600);

    // Heart rain
    setTimeout(() => {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 1,
            angle: Math.random() * 360,
            spread: 0,
            origin: { x: Math.random(), y: 0 },
            colors: ['#FF69B4', '#FF1493', '#DC143C'],
            shapes: ['circle'],
            gravity: 0.3,
            drift: (Math.random() - 0.5) * 0.4,
            scalar: 2,
          });
        }, i * 100);
      }
    }, 800);
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm screen-shake',
      className
    )}
    style={{
      animation: 'screenShake 0.5s ease-in-out',
    }}
    >
      {/* Rainbow overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-500/10 via-green-500/10 via-blue-500/10 via-purple-500/10 animate-pulse" />

      {/* Dynamic background bursts */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-pink-400/20 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-blue-400/20 rounded-full animate-ping" style={{ animationDuration: '1.8s', animationDelay: '1s' }} />
      </div>

      <div className="relative text-center space-y-6 p-8 animate-bounce">
        {/* Step 1: Celebration Text */}
        {currentStep >= 1 && (
          <div className={cn(
            'transition-all duration-500',
            currentStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}>
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-2 animate-pulse">
              Fantastisch!
            </h2>
            <p className="text-xl text-white/90 animate-fade-in">
              Je hebt een klus voltooid! 🚀
            </p>
          </div>
        )}

        {/* Step 2: Stats Display */}
        {currentStep >= 3 && showStats && (
          <div className={cn(
            'grid grid-cols-2 gap-4 transition-all duration-500',
            currentStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}>
            {xpGained > 0 && (
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <Star className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <div className="text-2xl font-bold">+{xpGained}</div>
                <div className="text-sm opacity-90">XP Verdiend</div>
              </div>
            )}

            {pointsGained > 0 && (
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <Zap className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <div className="text-2xl font-bold">+{pointsGained}</div>
                <div className="text-sm opacity-90">Punten</div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Badge Earned */}
        {currentStep >= 4 && badgeEarned && (
          <div className={cn(
            'transition-all duration-500 animate-bounce',
            currentStep >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}>
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6 inline-block">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mt-4">
              Badge Verdiend! 🏆
            </h3>
            <p className="text-lg text-white/90">{badgeEarned}</p>
          </div>
        )}

        {/* Floating celebration elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main celebration icons */}
          <Sparkles className="absolute top-10 left-10 h-6 w-6 text-yellow-400 animate-ping" />
          <Heart className="absolute top-20 right-16 h-5 w-5 text-pink-400 animate-pulse" />
          <Star className="absolute bottom-20 left-16 h-4 w-4 text-blue-400 animate-bounce" />
          <Trophy className="absolute bottom-10 right-10 h-5 w-5 text-yellow-500 animate-spin" />

          {/* Additional floating elements */}
          <div className="absolute top-1/4 left-1/4 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎊</div>
          <div className="absolute top-1/3 right-1/3 text-xl animate-pulse" style={{ animationDelay: '1s' }}>🎈</div>
          <div className="absolute bottom-1/4 left-1/3 text-lg animate-spin" style={{ animationDelay: '1.5s' }}>🎆</div>
          <div className="absolute bottom-1/3 right-1/4 text-2xl animate-bounce" style={{ animationDelay: '2s' }}>🎇</div>

          {/* Emoji rain */}
          <div className="absolute top-0 left-1/6 text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>⭐</div>
          <div className="absolute top-0 right-1/6 text-lg animate-bounce" style={{ animationDelay: '0.7s' }}>🌟</div>
          <div className="absolute top-0 left-1/2 text-lg animate-bounce" style={{ animationDelay: '1.2s' }}>💫</div>

          {/* Side sparkles */}
          <div className="absolute top-1/2 left-0 text-xl animate-ping" style={{ animationDelay: '0.8s' }}>✨</div>
          <div className="absolute top-1/2 right-0 text-xl animate-ping" style={{ animationDelay: '1.3s' }}>💎</div>
          <div className="absolute bottom-0 left-1/2 text-lg animate-pulse" style={{ animationDelay: '1.8s' }}>🎉</div>
        </div>
      </div>
    </div>
  );
}

// Add screen shake keyframes
const screenShakeKeyframes = `
@keyframes screenShake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-0.5deg); }
  50% { transform: translateX(5px) rotate(0.5deg); }
  75% { transform: translateX(-3px) rotate(-0.25deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
`;

// Inject the keyframes into the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = screenShakeKeyframes;
  document.head.appendChild(style);
}

// Hook for easy usage
export function useQuestCelebration() {
  const [isCelebrating, setIsCelebrating] = useState(false);

  const celebrate = (xpGained = 0, pointsGained = 0, badgeEarned?: string) => {
    return new Promise<void>((resolve) => {
      setIsCelebrating(true);

      // Play celebration sound (if available)
      if (typeof window !== 'undefined') {
        // Could add audio here
      }

      const onComplete = () => {
        setIsCelebrating(false);
        resolve();
      };

      // The component will handle the rest
      setTimeout(onComplete, badgeEarned ? 4000 : 3000);
    });
  };

  return { isCelebrating, celebrate };
}