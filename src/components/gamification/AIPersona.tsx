'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Star, Trophy, Lightbulb, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIPersonaProps {
  className?: string;
}

interface PersonaMessage {
  id: string;
  type: 'encouragement' | 'tip' | 'celebration' | 'reminder' | 'question';
  message: string;
  emoji: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

const PERSONA_AVATAR = '🤖';
const PERSONA_NAME = 'KlusjesBot';

export default function AIPersona({ className }: AIPersonaProps) {
  const { user } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<PersonaMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<PersonaMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Generate contextual messages based on user state
  useEffect(() => {
    if (user) {
      generateMessages();
    }
  }, [user]);

  // Show messages periodically
  useEffect(() => {
    const showMessageInterval = setInterval(() => {
      if (messageQueue.length > 0 && !isVisible) {
        showNextMessage();
      }
    }, 30000); // Show a message every 30 seconds if available

    return () => clearInterval(showMessageInterval);
  }, [messageQueue, isVisible]);

  const generateMessages = () => {
    if (!user) return;

    const messages: PersonaMessage[] = [];

    // Welcome message for new users
    if (user.totalXpEver < 50) {
      messages.push({
        id: 'welcome',
        type: 'encouragement',
        message: `Welkom ${user.name}. Ik ben ${PERSONA_NAME}, je digitale assistent voor dagelijkse taken. Ik help je om georganiseerd te blijven en je doelen te bereiken.`,
        emoji: '👋',
        actions: [{
          label: 'Begrepen',
          action: () => dismissMessage()
        }]
      });
    }

    // Progress encouragement
    messages.push({
      id: 'progress',
      type: 'encouragement',
      message: `${user.name}, je maakt goede voortgang. Nog ${Math.max(0, 100 - (user.xp % 100))} XP tot je volgende niveau.`,
      emoji: '📊',
    });

    // Practical tips
    messages.push({
      id: 'tip',
      type: 'tip',
      message: 'Tip: Maak foto\'s van voltooide taken voor extra punten en betere documentatie.',
      emoji: '💡',
    });

    // Achievement recognition
    if (user.points > 50) {
      messages.push({
        id: 'achievement',
        type: 'celebration',
        message: `Goed werk, ${user.name}. Je hebt ${user.points} punten verdiend door consistent bij te dragen.`,
        emoji: '✓',
      });
    }

    // Maintenance reminder
    messages.push({
      id: 'maintenance',
      type: 'reminder',
      message: 'Vergeet niet je virtuele huisdier te verzorgen. Regelmatige aandacht helpt bij de ontwikkeling.',
      emoji: '🔧',
    });

    // Goal setting encouragement
    messages.push({
      id: 'goals',
      type: 'encouragement',
      message: 'Er zijn gestructureerde takenreeksen beschikbaar. Het voltooien ervan levert speciale erkenning op.',
      emoji: '🎯',
    });

    // Collaboration tip
    messages.push({
      id: 'collaboration',
      type: 'tip',
      message: 'Gebruik de familie feed om feedback te geven op elkaars werk. Dit versterkt de teamdynamiek.',
      emoji: '🤝',
    });

    // Professional encouragement messages
    const encouragementMessages = [
      {
        id: 'consistency',
        type: 'encouragement' as const,
        message: 'Consistentie is de sleutel tot succes. Blijf gefocust op je dagelijkse verantwoordelijkheden.',
        emoji: '📈',
      },
      {
        id: 'reflection',
        type: 'question' as const,
        message: 'Welke taak geeft je het meeste voldoening? Dit helpt bij het optimaliseren van je routine.',
        emoji: '🤔',
        actions: [{
          label: 'Bedenken',
          action: () => dismissMessage()
        }]
      },
      {
        id: 'growth',
        type: 'encouragement' as const,
        message: 'Elke voltooide taak draagt bij aan je persoonlijke ontwikkeling en helpt je familie.',
        emoji: '📈',
      }
    ];

    messages.push(...encouragementMessages);

    setMessageQueue(messages);
  };

  const showNextMessage = () => {
    if (messageQueue.length === 0) return;

    const nextMessage = messageQueue[Math.floor(Math.random() * messageQueue.length)];
    setCurrentMessage(nextMessage);
    setIsVisible(true);
    setIsTyping(true);

    // Simulate typing effect
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const dismissMessage = () => {
    setIsVisible(false);
    setCurrentMessage(null);

    // Remove this message from queue to avoid repetition
    if (currentMessage) {
      setMessageQueue(prev => prev.filter(msg => msg.id !== currentMessage.id));
    }
  };

  const handleAction = (action: () => void) => {
    action();
    dismissMessage();
  };

  if (!isVisible || !currentMessage) return null;

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-40 animate-in slide-in-from-right-2 duration-300',
      className
    )}>
      <Card className="w-96 shadow-lg border border-slate-200 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                {PERSONA_AVATAR}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">{PERSONA_NAME}</div>
                <div className="text-xs text-slate-500">AI Assistent</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissMessage}
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              ✕
            </Button>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm flex-shrink-0">
                {currentMessage.emoji}
              </div>
              <div className="flex-grow">
                {isTyping ? (
                  <div className="flex items-center gap-1 py-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-slate-500 ml-3">Aan het typen...</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed">{currentMessage.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isTyping && currentMessage.actions && currentMessage.actions.length > 0 && (
              <div className="flex gap-2 pt-2">
                {currentMessage.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    onClick={() => handleAction(action.action)}
                    variant="outline"
                    className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {!isTyping && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Automatisch sluiten over</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
                  <span>10s</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for triggering persona messages from other components
export function useAIPersona() {
  const triggerMessage = (message: PersonaMessage) => {
    // This would need to be implemented with a global state management solution
    // For now, this is a placeholder
    console.log('AI Persona message triggered:', message);
  };

  return { triggerMessage };
}