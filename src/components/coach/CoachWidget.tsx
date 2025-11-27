'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import KobiAvatar from './KobiAvatar';
import CoachMessage from './CoachMessage';
import { MessageCircle, X, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  messageType: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  contextData?: Record<string, unknown> | null;
}

interface CoachWidgetProps {
  childId: string;
  childName: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function CoachWidget({
  childId,
  childName,
  isExpanded: controlledExpanded,
  onToggle,
  className,
}: CoachWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { toast } = useToast();

  const isExpanded = controlledExpanded ?? internalExpanded;
  const handleToggle = onToggle ?? (() => setInternalExpanded(!internalExpanded));

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/coach/messages?childId=${childId}&limit=10`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch coach messages:', error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMarkRead = async (messageId: string) => {
    try {
      await fetch('/api/coach/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, messageIds: [messageId] }),
      });
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, isRead: true } : m)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/coach/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, markAllRead: true }),
      });
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const generateGreeting = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/coach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          messageType: 'greeting',
          context: { trigger: 'user_request' },
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        toast({
          title: 'Dagelijkse limiet bereikt',
          description: 'Kobi heeft vandaag al genoeg berichten gestuurd. Probeer morgen weer!',
          variant: 'destructive',
        });
        return;
      }

      if (data.message) {
        setMessages(prev => [data.message, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast({
          title: 'Nieuw bericht van Kobi!',
          description: 'Kobi heeft een bericht voor je.',
        });
      }
    } catch (error) {
      console.error('Failed to generate greeting:', error);
      toast({
        title: 'Oeps!',
        description: 'Kobi kon geen bericht maken. Probeer het later opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Minimized view
  if (!isExpanded) {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'fixed bottom-20 right-4 md:bottom-6 z-50',
          'flex items-center gap-2 p-3 rounded-full',
          'bg-gradient-to-r from-yellow-400 to-orange-400',
          'shadow-lg hover:shadow-xl transition-all duration-300',
          'hover:scale-105 active:scale-95',
          className
        )}
      >
        <KobiAvatar size="sm" mood={unreadCount > 0 ? 'excited' : 'happy'} />
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
            {unreadCount}
          </Badge>
        )}
      </button>
    );
  }

  // Expanded view
  return (
    <Card
      className={cn(
        'fixed bottom-20 right-4 md:bottom-6 z-50',
        'w-80 md:w-96 max-h-[70vh]',
        'shadow-2xl border-2 border-yellow-200',
        'bg-gradient-to-b from-yellow-50 to-white',
        className
      )}
    >
      <CardHeader className="pb-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KobiAvatar size="md" mood="happy" />
            <div>
              <CardTitle className="text-white text-lg">Kobi</CardTitle>
              <p className="text-white/80 text-xs">Jouw persoonlijke coach</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={generateGreeting}
              disabled={generating}
              className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Unread indicator */}
        {unreadCount > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-yellow-100 border-b border-yellow-200">
            <span className="text-sm text-yellow-800">
              {unreadCount} nieuw{unreadCount !== 1 ? 'e' : ''} bericht{unreadCount !== 1 ? 'en' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-yellow-700 hover:text-yellow-900 h-6 px-2"
            >
              Alles gelezen
            </Button>
          </div>
        )}

        {/* Messages list */}
        <ScrollArea className="h-[300px] md:h-[400px]">
          <div className="p-4 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : messages.length > 0 ? (
              messages.map(message => (
                <CoachMessage
                  key={message.id}
                  message={message}
                  onMarkRead={handleMarkRead}
                  compact
                />
              ))
            ) : (
              <div className="text-center py-8">
                <KobiAvatar size="lg" mood="happy" className="mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Hoi {childName}!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ik ben Kobi, jouw persoonlijke coach! Ik help je met tips en aanmoediging.
                </p>
                <Button
                  onClick={generateGreeting}
                  disabled={generating}
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Even wachten...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Zeg hoi!
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50/50 text-center">
          <p className="text-xs text-gray-500">
            Kobi is je persoonlijke AI coach
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Floating trigger button component
export function CoachTriggerButton({
  childId,
  unreadCount = 0,
  onClick,
}: {
  childId: string;
  unreadCount?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 md:bottom-6 z-50',
        'flex items-center gap-2 p-3 rounded-full',
        'bg-gradient-to-r from-yellow-400 to-orange-400',
        'shadow-lg hover:shadow-xl transition-all duration-300',
        'hover:scale-105 active:scale-95'
      )}
      aria-label="Open Kobi Coach"
    >
      <KobiAvatar size="sm" mood={unreadCount > 0 ? 'excited' : 'happy'} />
      {unreadCount > 0 && (
        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
          {unreadCount}
        </Badge>
      )}
    </button>
  );
}
