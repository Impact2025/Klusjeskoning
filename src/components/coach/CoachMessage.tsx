'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KobiAvatar from './KobiAvatar';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachMessageProps {
  message: {
    id: string;
    messageType: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    contextData?: Record<string, unknown> | null;
  };
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
  className?: string;
}

const messageTypeConfig: Record<string, { mood: 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleeping'; label: string; bgClass: string }> = {
  greeting: { mood: 'happy', label: 'Begroeting', bgClass: 'bg-blue-50 border-blue-200' },
  encouragement: { mood: 'excited', label: 'Aanmoediging', bgClass: 'bg-green-50 border-green-200' },
  milestone: { mood: 'celebrating', label: 'Mijlpaal', bgClass: 'bg-purple-50 border-purple-200' },
  reminder: { mood: 'thinking', label: 'Herinnering', bgClass: 'bg-yellow-50 border-yellow-200' },
  tip: { mood: 'thinking', label: 'Tip', bgClass: 'bg-cyan-50 border-cyan-200' },
  motivation: { mood: 'happy', label: 'Motivatie', bgClass: 'bg-pink-50 border-pink-200' },
  explanation: { mood: 'thinking', label: 'Uitleg', bgClass: 'bg-indigo-50 border-indigo-200' },
  celebration: { mood: 'celebrating', label: 'Feest!', bgClass: 'bg-amber-50 border-amber-200' },
};

export default function CoachMessage({
  message,
  onDismiss,
  onMarkRead,
  compact = false,
  className,
}: CoachMessageProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const config = messageTypeConfig[message.messageType] || messageTypeConfig.greeting;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Zojuist';
    if (diffMins < 60) return `${diffMins} min geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const handleClick = () => {
    if (compact) {
      setIsExpanded(!isExpanded);
    }
    if (!message.isRead && onMarkRead) {
      onMarkRead(message.id);
    }
  };

  return (
    <Card
      className={cn(
        'relative border-2 transition-all duration-200',
        config.bgClass,
        !message.isRead && 'ring-2 ring-offset-2 ring-yellow-400',
        compact && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Kobi Avatar */}
          <KobiAvatar
            size={compact ? 'sm' : 'md'}
            mood={config.mood}
            animate={!message.isRead}
          />

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Kobi</span>
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                {!message.isRead && (
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">
                    Nieuw
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
            </div>

            {/* Message text */}
            <p
              className={cn(
                'text-gray-700',
                compact && !isExpanded && 'line-clamp-2'
              )}
            >
              {message.content}
            </p>

            {/* Context data if available */}
            {isExpanded && message.contextData && (
              <div className="mt-2 p-2 bg-white/50 rounded-lg text-xs text-gray-600">
                {(message.contextData as Record<string, string | number>).choreName && (
                  <span>Klusje: {String((message.contextData as Record<string, string | number>).choreName)}</span>
                )}
                {(message.contextData as Record<string, string | number>).points && (
                  <span className="ml-2">+{String((message.contextData as Record<string, string | number>).points)} punten</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-1">
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(message.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
