'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SavingsPotProps {
  currentAmount: number; // in cents
  targetAmount: number; // in cents
  itemName: string;
  className?: string;
  animated?: boolean;
}

export function SavingsPot({
  currentAmount,
  targetAmount,
  itemName,
  className,
  animated = true
}: SavingsPotProps) {
  const [fillHeight, setFillHeight] = useState(0);
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setFillHeight(percentage);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setFillHeight(percentage);
      return undefined;
    }
  }, [percentage, animated]);

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className={cn('relative', className)}>
      {/* Pot Container */}
      <div className="relative w-48 h-48 mx-auto">
        {/* Pot Base */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-amber-800 to-amber-600 rounded-b-full border-4 border-amber-900 shadow-lg">
          {/* Pot Body */}
          <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-amber-700 to-amber-500 rounded-b-full">
            {/* Fill Animation */}
            <div
              className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-blue-300 rounded-b-full transition-all duration-1500 ease-out"
              style={{
                height: `${fillHeight * 0.8}%`,
                transition: animated ? 'height 1.5s ease-out' : 'none'
              }}
            />

            {/* Money Icons */}
            {percentage > 20 && (
              <div className="absolute bottom-2 left-2 text-yellow-400 text-lg animate-bounce">
                💰
              </div>
            )}
            {percentage > 50 && (
              <div className="absolute bottom-4 right-2 text-yellow-400 text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>
                🪙
              </div>
            )}
            {percentage > 80 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-lg animate-bounce" style={{ animationDelay: '0.4s' }}>
                💵
              </div>
            )}
          </div>

          {/* Pot Rim */}
          <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-full border-t-4 border-amber-800" />
        </div>

        {/* Pot Handle */}
        <div className="absolute top-8 right-2 w-6 h-12 bg-gradient-to-b from-amber-700 to-amber-800 rounded-full border-2 border-amber-900 transform rotate-12" />

        {/* Sparkles for full pot */}
        {percentage >= 100 && (
          <>
            <div className="absolute top-4 left-4 text-yellow-400 animate-ping">✨</div>
            <div className="absolute top-8 right-8 text-yellow-400 animate-ping" style={{ animationDelay: '0.3s' }}>✨</div>
            <div className="absolute bottom-16 left-6 text-yellow-400 animate-ping" style={{ animationDelay: '0.6s' }}>✨</div>
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-4 text-center">
        <h3 className="font-bold text-lg text-gray-800">{itemName}</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">Gespaard:</span>
          <span className="font-bold text-green-600">{formatCurrency(currentAmount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Doel:</span>
          <span className="font-bold text-blue-600">{formatCurrency(targetAmount)}</span>
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              transition: animated ? 'width 1s ease-out' : 'none'
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {percentage.toFixed(0)}% compleet
        </p>
      </div>
    </div>
  );
}