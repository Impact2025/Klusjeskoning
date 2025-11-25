'use client';

import { useState } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Star, Trophy, Sparkles, ThumbsUp, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplimentCard {
  id: string;
  title: string;
  message: string;
  emoji: string;
  color: string;
  category: 'encouragement' | 'achievement' | 'effort' | 'kindness' | 'helpfulness';
}

interface ComplimentCardsProps {
  onSendCompliment?: (childId: string, card: ComplimentCard) => void;
  className?: string;
}

const COMPLIMENT_CARDS: ComplimentCard[] = [
  {
    id: 'super-hero',
    title: 'Superheld!',
    message: 'Je bent mijn superheld! Dankjewel voor je hulp! 🦸‍♂️',
    emoji: '🦸‍♂️',
    color: 'from-red-400 to-orange-500',
    category: 'helpfulness'
  },
  {
    id: 'star-performer',
    title: 'Sterren Prestatie!',
    message: 'Wat een sterrenprestatie! Ik ben zo trots op je! ⭐',
    emoji: '⭐',
    color: 'from-yellow-400 to-orange-500',
    category: 'achievement'
  },
  {
    id: 'kind-heart',
    title: 'Lief Hartje',
    message: 'Wat ben je lief voor je broertje/zusje! 💝',
    emoji: '💝',
    color: 'from-pink-400 to-red-500',
    category: 'kindness'
  },
  {
    id: 'effort-champion',
    title: 'Inspanning Kampioen',
    message: 'Ik zie hoeveel moeite je doet - geweldig gedaan! 💪',
    emoji: '💪',
    color: 'from-blue-400 to-purple-500',
    category: 'effort'
  },
  {
    id: 'family-hero',
    title: 'Familie Held',
    message: 'Je maakt ons gezin gelukkiger! Dankjewel! 👨‍👩‍👧‍👦',
    emoji: '👨‍👩‍👩‍👧‍👦',
    color: 'from-green-400 to-blue-500',
    category: 'helpfulness'
  },
  {
    id: 'brilliant-mind',
    title: 'Briljant Brein',
    message: 'Wat denk je slim na! Ik ben onder de indruk! 🧠',
    emoji: '🧠',
    color: 'from-purple-400 to-pink-500',
    category: 'achievement'
  },
  {
    id: 'creative-genius',
    title: 'Creatief Genie',
    message: 'Je creativiteit is ongelofelijk! Wat een mooi resultaat! 🎨',
    emoji: '🎨',
    color: 'from-indigo-400 to-purple-500',
    category: 'achievement'
  },
  {
    id: 'responsible-star',
    title: 'Verantwoordelijke Ster',
    message: 'Je neemt je verantwoordelijkheden serieus - top! 🌟',
    emoji: '🌟',
    color: 'from-cyan-400 to-blue-500',
    category: 'effort'
  }
];

const CATEGORY_CONFIG = {
  encouragement: { icon: Heart, label: 'Aanmoediging', color: 'text-red-600' },
  achievement: { icon: Trophy, label: 'Prestaties', color: 'text-yellow-600' },
  effort: { icon: ThumbsUp, label: 'Inspanning', color: 'text-blue-600' },
  kindness: { icon: Sparkles, label: 'Liefde', color: 'text-pink-600' },
  helpfulness: { icon: Star, label: 'Hulpvaardigheid', color: 'text-green-600' }
};

export default function ComplimentCards({ onSendCompliment, className }: ComplimentCardsProps) {
  const { family } = useApp();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sendingCard, setSendingCard] = useState<string | null>(null);

  if (!family) return null;

  const filteredCards = selectedCategory === 'all'
    ? COMPLIMENT_CARDS
    : COMPLIMENT_CARDS.filter(card => card.category === selectedCategory);

  const handleSendCompliment = async (card: ComplimentCard) => {
    if (!selectedChild) return;

    setSendingCard(card.id);

    // Simulate sending delay
    setTimeout(() => {
      // Store compliment in localStorage for the child to receive
      const complimentData = {
        id: Date.now().toString(),
        from: 'Ouder', // Could be customized based on parent name
        card,
        receivedAt: new Date().toISOString(),
        read: false
      };

      // Get existing compliments for this child
      const existingCompliments = JSON.parse(
        localStorage.getItem(`child_compliments_${selectedChild}`) || '[]'
      );

      // Add new compliment
      existingCompliments.unshift(complimentData);

      // Store back in localStorage (keep only last 10 compliments)
      localStorage.setItem(
        `child_compliments_${selectedChild}`,
        JSON.stringify(existingCompliments.slice(0, 10))
      );

      onSendCompliment?.(selectedChild, card);
      setSendingCard(null);

      // Reset selection
      setSelectedChild('');
    }, 1000);
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 via-red-400/10 to-yellow-400/10" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Heart className="h-5 w-5 text-pink-500" />
          Compliment Kaarten
          <Heart className="h-5 w-5 text-pink-500" />
        </CardTitle>
        <div className="text-center text-sm text-gray-600 mt-1">
          Stuur een liefdevol berichtje naar je kind! 💌
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Child Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Voor wie is het compliment?</label>
          <div className="flex gap-2 flex-wrap">
            {family.children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChild === child.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChild(child.id)}
                className="flex items-center gap-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {child.avatar || child.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {child.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categorie</label>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Alle
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                  className="flex items-center gap-1"
                >
                  <IconComponent className="h-4 w-4" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Compliment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCards.map((card) => {
            const isSending = sendingCard === card.id;
            const canSend = selectedChild && !isSending;

            return (
              <Card
                key={card.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all hover:scale-105",
                  isSending && "animate-pulse"
                )}
                onClick={() => canSend && handleSendCompliment(card)}
              >
                {/* Card background gradient */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-10',
                  card.color
                )} />

                <CardContent className="relative p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{card.emoji}</span>
                      <h3 className="font-bold text-sm">{card.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_CONFIG[card.category].label}
                    </Badge>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {card.message}
                  </p>

                  {/* Send Button */}
                  <Button
                    size="sm"
                    disabled={!canSend}
                    className={cn(
                      "w-full bg-gradient-to-r hover:scale-105 transition-all",
                      card.color,
                      !canSend && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSending ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Versturen...
                      </>
                    ) : !selectedChild ? (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Selecteer eerst een kind
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Verstuur Compliment
                      </>
                    )}
                  </Button>
                </CardContent>

                {/* Sending overlay */}
                {isSending && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl animate-bounce mb-2">💌</div>
                      <div className="text-sm font-medium">Compliment versturen...</div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-center gap-2 text-pink-700 mb-2">
            <Heart className="h-4 w-4" />
            <span className="font-medium">Waarom complimenten geven?</span>
          </div>
          <p className="text-xs text-pink-600 leading-relaxed">
            Positieve woorden motiveren kinderen enorm! Het bouwt zelfvertrouwen op
            en versterkt jullie band. Probeer dagelijks een compliment te geven! 💕
          </p>
        </div>

        {/* Recent Compliments */}
        <div className="space-y-2">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Recente Complimenten
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span>👍</span>
              <span><strong>Sarah</strong> kreeg "Superheld!" van mama</span>
              <span className="text-gray-400 ml-auto">2u geleden</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span>⭐</span>
              <span><strong>Mike</strong> kreeg "Sterren Prestatie!" van papa</span>
              <span className="text-gray-400 ml-auto">5u geleden</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for receiving compliments (for child dashboard)
export function useCompliments() {
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

  const markAsRead = (id: string) => {
    setCompliments(prev =>
      prev.map(c => c.id === id ? { ...c, read: true } : c)
    );
  };

  return { compliments, addCompliment, markAsRead };
}