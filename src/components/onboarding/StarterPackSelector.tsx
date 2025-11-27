'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ChoreTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  basePoints: number;
  baseXp: number;
  frequency: string;
  difficulty: string;
}

interface StarterPack {
  id: string;
  name: string;
  description: string | null;
  difficultyLevel: string;
  choreCount: number;
  isDefault: boolean;
  recommendedFor: string | null;
  chores: ChoreTemplate[];
}

interface StarterPackSelectorProps {
  childId: string;
  childName: string;
  childAge: number;
  onSelect: (packId: string) => void;
  onBack?: () => void;
}

export default function StarterPackSelector({
  childId,
  childName,
  childAge,
  onSelect,
  onBack,
}: StarterPackSelectorProps) {
  const [packs, setPacks] = useState<StarterPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await fetch(`/api/starter-packs?age=${childAge}`);
        const data = await response.json();
        if (data.packs) {
          setPacks(data.packs);
          // Pre-select recommended pack
          const recommended = data.packs.find((p: StarterPack) => p.isDefault);
          if (recommended) {
            setSelectedPackId(recommended.id);
            setExpandedPackId(recommended.id);
          }
        }
      } catch (error) {
        console.error('Error fetching starter packs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, [childAge]);

  const handleContinue = () => {
    if (selectedPackId) {
      onSelect(selectedPackId);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'minimal':
        return 'bg-green-100 text-green-800';
      case 'easy':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'minimal':
        return 'Minimaal';
      case 'easy':
        return 'Makkelijk';
      case 'medium':
        return 'Gemiddeld';
      case 'hard':
        return 'Uitdagend';
      default:
        return level;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Kies een startpakket voor {childName}
        </h2>
        <p className="mt-2 text-gray-600">
          Gebaseerd op leeftijd {childAge} jaar. Kies het pakket dat het beste past.
        </p>
      </div>

      <div className="space-y-3">
        {packs.map((pack) => (
          <Card
            key={pack.id}
            className={`cursor-pointer transition-all ${
              selectedPackId === pack.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setSelectedPackId(pack.id);
              setExpandedPackId(expandedPackId === pack.id ? null : pack.id);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  {pack.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Aanbevolen
                    </Badge>
                  )}
                </div>
                <Badge className={getDifficultyColor(pack.difficultyLevel)}>
                  {getDifficultyLabel(pack.difficultyLevel)}
                </Badge>
              </div>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{pack.choreCount} klusjes</span>
                <span className="text-xs text-gray-500">{pack.recommendedFor}</span>
              </div>

              {/* Expanded chore list */}
              {expandedPackId === pack.id && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Klusjes in dit pakket:
                  </p>
                  <div className="grid gap-2">
                    {pack.chores.map((chore) => (
                      <div
                        key={chore.id}
                        className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2"
                      >
                        <span className="text-lg">{chore.icon}</span>
                        <span className="flex-1">{chore.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {chore.basePoints} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle hint */}
              <button
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedPackId(expandedPackId === pack.id ? null : pack.id);
                }}
              >
                {expandedPackId === pack.id ? '▲ Verberg klusjes' : '▼ Bekijk klusjes'}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Terug
          </Button>
        )}
        <Button
          onClick={handleContinue}
          disabled={!selectedPackId}
          className="flex-1"
        >
          Doorgaan
        </Button>
      </div>
    </div>
  );
}
