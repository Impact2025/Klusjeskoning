'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger?: boolean;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  duration?: number;
  colors?: string[];
}

export function Confetti({
  trigger = false,
  particleCount = 150,
  spread = 120,
  origin = { x: 0.5, y: 0.6 },
  duration = 3000,
  colors
}: ConfettiProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);

      // Fire confetti
      confetti({
        particleCount,
        spread,
        origin,
        colors: colors || ['#fbbf24', '#f59e0b', '#d97706', '#3b82f6', '#8b5cf6', '#ec4899'],
        gravity: 0.8,
        drift: 0.1,
        ticks: 200,
      });

      // Reset after duration
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, isActive, particleCount, spread, origin, duration]);

  return null; // This component doesn't render anything visible
}

// Preset confetti effects
export function LevelUpConfetti() {
  return <Confetti particleCount={200} spread={150} duration={4000} />;
}

export function BadgeUnlockConfetti() {
  return <Confetti particleCount={100} spread={90} origin={{ x: 0.5, y: 0.3 }} />;
}

export function QuestCompleteConfetti() {
  return <Confetti particleCount={120} spread={100} colors={['#10b981', '#059669', '#047857']} />;
}

export function SavingsGoalConfetti() {
  return (
    <Confetti
      particleCount={300}
      spread={180}
      origin={{ x: 0.5, y: 0.8 }}
      duration={5000}
    />
  );
}