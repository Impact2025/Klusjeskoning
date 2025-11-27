'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ChoreTemplate {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  basePoints: number;
  baseXp: number;
  difficulty: string;
  icon: string;
  estimatedMinutes: number;
  tips: string | null;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface Suggestion {
  id: string;
  triggerReason: string;
  triggerData: Record<string, unknown>;
  priority: number;
  suggestedAt: string;
  expiresAt: string | null;
  template: ChoreTemplate;
}

interface SuggestionBannerProps {
  childId: string;
  childName: string;
  onAccept?: () => void;
}

export default function SuggestionBanner({ childId, childName, onAccept }: SuggestionBannerProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuggestions();
  }, [childId]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/suggestions?childId=${childId}`);
      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (suggestionId: string, action: 'accept' | 'dismiss' | 'snooze') => {
    setResponding(suggestionId);
    try {
      const response = await fetch('/api/suggestions/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: action === 'accept' ? 'Klusje toegevoegd!' : action === 'dismiss' ? 'Afgewezen' : 'Uitgesteld',
          description: data.message,
        });

        // Remove from list
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

        if (action === 'accept') {
          onAccept?.();
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error responding to suggestion:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon niet reageren op suggestie',
      });
    } finally {
      setResponding(null);
    }
  };

  const getTriggerMessage = (suggestion: Suggestion) => {
    switch (suggestion.triggerReason) {
      case 'streak':
        const streak = (suggestion.triggerData as { streak?: number })?.streak ?? 0;
        return `${childName} heeft een streak van ${streak} dagen! Tijd voor een nieuw klusje?`;
      case 'completion_rate':
        const rate = (suggestion.triggerData as { rate?: number })?.rate ?? 0;
        return `${childName} heeft ${rate}% van de klusjes voltooid. Klaar voor meer?`;
      case 'age_milestone':
        return `${childName} is oud genoeg voor dit nieuwe klusje!`;
      case 'time_based':
        return `Het is een tijdje geleden dat ${childName} een nieuw klusje kreeg.`;
      default:
        return `Nieuwe suggestie voor ${childName}`;
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <span>💡</span> Suggesties voor {childName}
      </h3>
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: suggestion.template.category.color + '20' }}
              >
                {suggestion.template.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{suggestion.template.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.template.basePoints} pts
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {getTriggerMessage(suggestion)}
                </p>
                <p className="text-xs text-gray-500">
                  {suggestion.template.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRespond(suggestion.id, 'dismiss')}
                disabled={responding === suggestion.id}
              >
                Nee bedankt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRespond(suggestion.id, 'snooze')}
                disabled={responding === suggestion.id}
              >
                Later
              </Button>
              <Button
                size="sm"
                onClick={() => handleRespond(suggestion.id, 'accept')}
                disabled={responding === suggestion.id}
              >
                {responding === suggestion.id ? 'Bezig...' : 'Toevoegen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
