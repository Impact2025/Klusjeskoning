'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Coins, Gift, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface SpinResult {
  type: 'points' | 'xp' | 'sticker' | 'avatar_item' | 'bonus';
  value: number | string;
  label: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface SpinWheelProps {
  spinsAvailable: number;
  onSpin: () => Promise<SpinResult>;
  className?: string;
}

const SPIN_REWARDS: SpinResult[] = [
  { type: 'points', value: 10, label: '10 Punten', rarity: 'common' },
  { type: 'xp', value: 25, label: '25 XP', rarity: 'common' },
  { type: 'points', value: 25, label: '25 Punten', rarity: 'rare' },
  { type: 'sticker', value: 'random', label: 'Sticker', rarity: 'rare' },
  { type: 'xp', value: 50, label: '50 XP', rarity: 'epic' },
  { type: 'avatar_item', value: 'random', label: 'Avatar Item', rarity: 'epic' },
  { type: 'points', value: 50, label: '50 Punten', rarity: 'legendary' },
  { type: 'bonus', value: 'double', label: 'Dubbele Punten!', rarity: 'legendary' },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'text-gray-600 border-gray-300';
    case 'rare': return 'text-blue-600 border-blue-400';
    case 'epic': return 'text-purple-600 border-purple-500';
    case 'legendary': return 'text-yellow-600 border-yellow-500';
    default: return 'text-gray-600 border-gray-300';
  }
};

const getRarityBg = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-50';
    case 'rare': return 'bg-blue-50';
    case 'epic': return 'bg-purple-50';
    case 'legendary': return 'bg-yellow-50';
    default: return 'bg-gray-50';
  }
};

export default function SpinWheel({ spinsAvailable, onSpin, className }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  const handleSpin = async () => {
    if (spinsAvailable <= 0 || isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);

    try {
      // Start spinning animation
      const spinDuration = 3000; // 3 seconds
      const totalRotations = 5 + Math.random() * 3; // 5-8 full rotations
      const finalRotation = rotation + (totalRotations * 360);

      setRotation(finalRotation);

      // Wait for spin to complete
      setTimeout(async () => {
        const result = await onSpin();
        setLastResult(result);
        setShowResult(true);

        // Trigger confetti for good rewards
        if (result.rarity === 'epic' || result.rarity === 'legendary') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }

        setIsSpinning(false);
      }, spinDuration);

    } catch (error) {
      console.error('Spin failed:', error);
      setIsSpinning(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'points': return <Coins className="h-4 w-4" />;
      case 'xp': return <Star className="h-4 w-4" />;
      case 'sticker': return <Gift className="h-4 w-4" />;
      case 'avatar_item': return <Sparkles className="h-4 w-4" />;
      case 'bonus': return <Zap className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn('relative overflow-hidden border border-slate-200 bg-white', className)}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl text-slate-900">
          Dagelijkse Spin
        </CardTitle>
        <div className="flex items-center justify-center mt-2">
          <Badge variant="outline" className="text-sm border-slate-300 text-slate-600">
            {spinsAvailable} spin{spinsAvailable !== 1 ? 's' : ''} beschikbaar
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Spin Wheel */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Wheel Container */}
            <div
              ref={wheelRef}
              className="relative w-48 h-48 rounded-full border-2 border-slate-300 bg-white shadow-lg"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
            >
              {/* Wheel Segments */}
              {SPIN_REWARDS.map((reward, index) => {
                const angle = (index / SPIN_REWARDS.length) * 360;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "absolute w-full h-full rounded-full flex items-center justify-center text-xs font-medium",
                      getRarityBg(reward.rarity),
                      isEven ? "clip-path-polygon-1" : "clip-path-polygon-2"
                    )}
                    style={{
                      transform: `rotate(${angle}deg)`,
                      clipPath: isEven
                        ? 'polygon(50% 50%, 0 0, 100% 0)'
                        : 'polygon(50% 50%, 100% 0, 100% 100%)'
                    }}
                  >
                    <div
                      className="absolute text-center"
                      style={{
                        transform: `rotate(${180 - angle}deg) translateY(-60px)`,
                        width: '60px'
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {getRewardIcon(reward.type)}
                        <span className={cn("text-xs font-medium", getRarityColor(reward.rarity))}>
                          {reward.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-slate-300 flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              </div>
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-slate-600"></div>
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="text-center">
          <Button
            onClick={handleSpin}
            disabled={spinsAvailable <= 0 || isSpinning}
            className={cn(
              "px-6 py-2 text-base font-medium bg-slate-900 hover:bg-slate-800 text-white border border-slate-200 transition-colors",
              (spinsAvailable <= 0 || isSpinning) && "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400"
            )}
          >
            {isSpinning ? (
              <>
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Bezig met spinnen...
              </>
            ) : spinsAvailable > 0 ? (
              'Spin uitvoeren'
            ) : (
              'Geen spins beschikbaar'
            )}
          </Button>
        </div>

        {/* Result Display */}
        {showResult && lastResult && (
          <div className={cn(
            "text-center p-4 rounded-lg border bg-slate-50",
            getRarityBg(lastResult.rarity)
          )}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {getRewardIcon(lastResult.type)}
              <span className="font-medium text-slate-900">Resultaat</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">{lastResult.label}</p>
            <Badge variant="outline" className={cn("mt-2 text-xs", getRarityColor(lastResult.rarity))}>
              {lastResult.rarity}
            </Badge>
          </div>
        )}
      </CardContent>

      <style jsx>{`
        .clip-path-polygon-1 {
          clip-path: polygon(50% 50%, 0 0, 100% 0);
        }
        .clip-path-polygon-2 {
          clip-path: polygon(50% 50%, 100% 0, 100% 100%);
        }
      `}</style>
    </Card>
  );
}