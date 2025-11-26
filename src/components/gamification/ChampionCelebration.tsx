'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Crown, Star, Sparkles, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChampionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  championName: string;
  category: string;
  rewards: string[];
}

export default function ChampionCelebration({
  isOpen,
  onClose,
  championName,
  category,
  rewards
}: ChampionCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      setShowConfetti(true);

      const fireConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min;
        };

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            particleCount,
            startVelocity: randomInRange(50, 100),
            spread: randomInRange(50, 70),
            origin: {
              x: randomInRange(0.1, 0.3),
              y: Math.random() - 0.2
            },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1']
          });

          confetti({
            particleCount,
            startVelocity: randomInRange(50, 100),
            spread: randomInRange(50, 70),
            origin: {
              x: randomInRange(0.7, 0.9),
              y: Math.random() - 0.2
            },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1']
          });
        }, 250);
      };

      fireConfetti();

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'xp': return '⭐';
      case 'chores': return '🧹';
      case 'powerpoints': return '💰';
      case 'streak': return '🔥';
      case 'pet_care': return '🐾';
      default: return '🏆';
    }
  };

  const getRewardIcon = (reward: string) => {
    switch (reward) {
      case 'golden_crown': return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'extra_spin': return <Zap className="w-6 h-6 text-blue-500" />;
      case 'golden_pet': return <Sparkles className="w-6 h-6 text-purple-500" />;
      case 'xp_bonus': return <Star className="w-6 h-6 text-orange-500" />;
      default: return <Trophy className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRewardLabel = (reward: string) => {
    switch (reward) {
      case 'golden_crown': return 'Gouden Kroon Badge';
      case 'extra_spin': return 'Extra Spin';
      case 'golden_pet': return 'Gouden Huisdier (24u)';
      case 'xp_bonus': return '50 XP Bonus';
      default: return reward;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-4 border-yellow-300">
        <div className="text-center space-y-6 py-8">
          {/* Champion Crown */}
          <div className="relative">
            <div className="text-8xl animate-bounce">👑</div>
            <div className="absolute -top-2 -right-2 text-4xl animate-pulse">✨</div>
            <div className="absolute -bottom-2 -left-2 text-4xl animate-pulse">🌟</div>
          </div>

          {/* Champion Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              🎉 Kampioen! 🎉
            </h1>
            <h2 className="text-xl font-semibold text-gray-800">
              {championName}
            </h2>
            <div className="flex items-center justify-center space-x-2 text-lg">
              <span>{getCategoryEmoji(category)}</span>
              <span className="font-medium">
                {category === 'xp' ? 'XP Kampioen' :
                 category === 'chores' ? 'Klusjes Kampioen' :
                 category === 'powerpoints' ? 'PowerKlusjes Kampioen' :
                 category === 'streak' ? 'Streak Kampioen' :
                 category === 'pet_care' ? 'Huisdier Kampioen' :
                 'Super Kampioen'}
              </span>
              <span>{getCategoryEmoji(category)}</span>
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-white/80 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span>Je Beloningen:</span>
            </h3>

            <div className="space-y-2">
              {rewards.map((reward, index) => (
                <div
                  key={reward}
                  className="flex items-center space-x-3 p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {getRewardIcon(reward)}
                  <span className="font-medium text-gray-800">
                    {getRewardLabel(reward)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Celebration Message */}
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4">
            <p className="text-gray-800 font-medium">
              "Wauw! Je bent deze week de absolute kampioen!
              <br />
              Iedereen in het gezin is trots op je! 🏆"
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Yeeew! 🎊
          </Button>
        </div>

        {/* Floating sparkles animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 text-2xl animate-ping">✨</div>
          <div className="absolute top-20 right-15 text-2xl animate-ping" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute bottom-20 left-20 text-2xl animate-ping" style={{ animationDelay: '1s' }}>🌟</div>
          <div className="absolute bottom-10 right-10 text-2xl animate-ping" style={{ animationDelay: '1.5s' }}>💫</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}