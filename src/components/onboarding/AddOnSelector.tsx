'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface ChoreTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  basePoints: number;
  baseXp: number;
}

interface AddonPack {
  id: string;
  name: string;
  description: string | null;
  minAge: number;
  requiresGarden: boolean;
  requiresPet: boolean;
  chores: ChoreTemplate[];
}

interface AddOnSelectorProps {
  childAge: number;
  hasGarden: boolean;
  hasPets: boolean;
  onComplete: (selectedAddonIds: string[]) => void;
  onBack?: () => void;
}

export default function AddOnSelector({
  childAge,
  hasGarden,
  hasPets,
  onComplete,
  onBack,
}: AddOnSelectorProps) {
  const [packs, setPacks] = useState<AddonPack[]>([]);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await fetch(`/api/addon-packs?age=${childAge}`);
        const data = await response.json();
        if (data.packs) {
          setPacks(data.packs);
        }
      } catch (error) {
        console.error('Error fetching addon packs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, [childAge]);

  const togglePack = (packId: string) => {
    setSelectedPackIds((prev) =>
      prev.includes(packId)
        ? prev.filter((id) => id !== packId)
        : [...prev, packId]
    );
  };

  const handleContinue = () => {
    onComplete(selectedPackIds);
  };

  const getPackIcon = (pack: AddonPack) => {
    if (pack.requiresPet) return '🐕';
    if (pack.requiresGarden) return '🌳';
    return '📦';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // Filter packs based on what family has
  const availablePacks = packs.filter((pack) => {
    if (pack.requiresGarden && !hasGarden) return false;
    if (pack.requiresPet && !hasPets) return false;
    return true;
  });

  // Group packs by type
  const petPacks = availablePacks.filter((p) => p.requiresPet);
  const gardenPacks = availablePacks.filter((p) => p.requiresGarden && !p.requiresPet);
  const otherPacks = availablePacks.filter((p) => !p.requiresGarden && !p.requiresPet);

  const hasAnyPacks = availablePacks.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Extra klusjes toevoegen?</h2>
        <p className="mt-2 text-gray-600">
          {hasAnyPacks
            ? 'Kies optionele uitbreidingspakketten voor extra klusjes'
            : 'Er zijn geen extra pakketten beschikbaar voor jouw situatie'}
        </p>
      </div>

      {!hasAnyPacks && (
        <Card className="bg-gray-50">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              {!hasGarden && !hasPets
                ? 'Voeg een tuin of huisdieren toe aan je gezinsprofiel om extra klusjes te ontgrendelen!'
                : 'Alle beschikbare klusjes zijn al opgenomen in je startpakket.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pet Packs */}
      {petPacks.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>🐕</span> Huisdier Klusjes
          </h3>
          {petPacks.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              isSelected={selectedPackIds.includes(pack.id)}
              isExpanded={expandedPackId === pack.id}
              onToggle={() => togglePack(pack.id)}
              onExpand={() => setExpandedPackId(expandedPackId === pack.id ? null : pack.id)}
            />
          ))}
        </div>
      )}

      {/* Garden Packs */}
      {gardenPacks.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>🌳</span> Tuin Klusjes
          </h3>
          {gardenPacks.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              isSelected={selectedPackIds.includes(pack.id)}
              isExpanded={expandedPackId === pack.id}
              onToggle={() => togglePack(pack.id)}
              onExpand={() => setExpandedPackId(expandedPackId === pack.id ? null : pack.id)}
            />
          ))}
        </div>
      )}

      {/* Other Packs */}
      {otherPacks.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>📦</span> Extra Pakketten
          </h3>
          {otherPacks.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              isSelected={selectedPackIds.includes(pack.id)}
              isExpanded={expandedPackId === pack.id}
              onToggle={() => togglePack(pack.id)}
              onExpand={() => setExpandedPackId(expandedPackId === pack.id ? null : pack.id)}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {selectedPackIds.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-sm text-primary font-medium">
            {selectedPackIds.length} extra pakket(ten) geselecteerd
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Terug
          </Button>
        )}
        <Button onClick={handleContinue} className="flex-1">
          {selectedPackIds.length > 0 ? 'Afronden' : 'Overslaan'}
        </Button>
      </div>
    </div>
  );
}

// Sub-component for individual pack cards
function PackCard({
  pack,
  isSelected,
  isExpanded,
  onToggle,
  onExpand,
}: {
  pack: AddonPack;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle()}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{pack.name}</h4>
              <Badge variant="outline" className="text-xs">
                {pack.chores.length} klusjes
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{pack.description}</p>

            {/* Expanded chore list */}
            {isExpanded && (
              <div className="mt-3 border-t pt-3">
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

            {/* Toggle button */}
            <button
              className="text-xs text-gray-500 hover:text-gray-700 mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
            >
              {isExpanded ? '▲ Verberg' : '▼ Bekijk klusjes'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
