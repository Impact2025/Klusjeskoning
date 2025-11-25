'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Add CSS animations
const styles = `
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}

.animate-shrink {
  animation: shrink linear;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

interface ComplimentCard {
  id: string;
  title: string;
  message: string;
  emoji: string;
  color: string;
  category: 'encouragement' | 'achievement' | 'effort' | 'kindness' | 'helpfulness';
}

interface ComplimentNotificationProps {
  compliment: {
    id: string;
    from: string;
    card: ComplimentCard;
    receivedAt: Date;
    read: boolean;
  };
  onDismiss: (id: string) => void;
  className?: string;
}

export default function ComplimentNotification({
  compliment,
  onDismiss,
  className
}: ComplimentNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Auto-hide after 10 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(compliment.id);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 shadow-lg transition-all duration-300",
        compliment.card.color,
        isAnimating && "animate-fade-out",
        className
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r opacity-20 animate-pulse" />

      {/* Floating hearts animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-4 animate-bounce" style={{ animationDelay: '0s' }}>
          <Heart className="h-3 w-3 text-white/60" />
        </div>
        <div className="absolute top-1 right-8 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Sparkles className="h-3 w-3 text-white/60" />
        </div>
        <div className="absolute bottom-2 left-8 animate-bounce" style={{ animationDelay: '1s' }}>
          <Heart className="h-2 w-2 text-white/60" />
        </div>
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Large emoji */}
            <div className="text-4xl animate-bounce">
              {compliment.card.emoji}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-bold text-white text-lg drop-shadow-sm">
                  {compliment.card.title}
                </h3>
                <span className="text-white/90 text-sm font-medium">
                  van {compliment.from}
                </span>
              </div>

              <p className="text-white/95 text-sm leading-relaxed drop-shadow-sm mb-2">
                {compliment.card.message}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-white/80 text-xs">
                  {new Date(compliment.receivedAt).toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 h-auto w-auto flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
        <div
          className="h-full bg-white/80 transition-all duration-100 ease-linear animate-shrink"
          style={{
            animationDuration: '10s',
            animationFillMode: 'forwards'
          }}
        />
      </div>
    </Card>
  );
}

// Hook for managing compliment notifications
export function useComplimentNotifications() {
  const [compliments, setCompliments] = useState<Array<{
    id: string;
    from: string;
    card: ComplimentCard;
    receivedAt: Date;
    read: boolean;
  }>>([]);

  const addCompliment = (from: string, card: ComplimentCard) => {
    const newCompliment = {
      id: Date.now().toString(),
      from,
      card,
      receivedAt: new Date(),
      read: false
    };
    setCompliments(prev => [newCompliment, ...prev]);
  };

  const dismissCompliment = (id: string) => {
    setCompliments(prev => prev.filter(c => c.id !== id));
  };

  const markAsRead = (id: string) => {
    setCompliments(prev =>
      prev.map(c => c.id === id ? { ...c, read: true } : c)
    );
  };

  return {
    compliments,
    addCompliment,
    dismissCompliment,
    markAsRead
  };
}