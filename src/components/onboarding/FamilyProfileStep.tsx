'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FamilyProfileStepProps {
  initialHasGarden?: boolean;
  initialHasPets?: boolean;
  onComplete: (profile: { hasGarden: boolean; hasPets: boolean }) => void;
  onBack?: () => void;
}

export default function FamilyProfileStep({
  initialHasGarden = false,
  initialHasPets = false,
  onComplete,
  onBack,
}: FamilyProfileStepProps) {
  const [hasGarden, setHasGarden] = useState(initialHasGarden);
  const [hasPets, setHasPets] = useState(initialHasPets);

  const handleContinue = () => {
    onComplete({ hasGarden, hasPets });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Vertel ons over je gezin</h2>
        <p className="mt-2 text-gray-600">
          We passen de klusjes aan op basis van je woonsituatie
        </p>
      </div>

      <div className="grid gap-4">
        {/* Garden Question */}
        <Card
          className={`cursor-pointer transition-all ${
            hasGarden
              ? 'ring-2 ring-green-500 bg-green-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => setHasGarden(!hasGarden)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="text-4xl">
              {hasGarden ? '🏡' : '🏠'}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {hasGarden ? 'Ja, we hebben een tuin!' : 'Hebben jullie een tuin?'}
              </CardTitle>
              <CardDescription>
                Met een tuin kunnen we tuinklusjes zoals planten water geven, bladeren harken en onkruid wieden aanbevelen
              </CardDescription>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                hasGarden ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}
            >
              {hasGarden && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pets Question */}
        <Card
          className={`cursor-pointer transition-all ${
            hasPets
              ? 'ring-2 ring-orange-500 bg-orange-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => setHasPets(!hasPets)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="text-4xl">
              {hasPets ? '🐕' : '🐾'}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {hasPets ? 'Ja, we hebben huisdieren!' : 'Hebben jullie huisdieren?'}
              </CardTitle>
              <CardDescription>
                Met huisdieren kunnen we dierenverzorgingstaken zoals voeren, uitlaten en kooi schoonmaken aanbevelen
              </CardDescription>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                hasPets ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
              }`}
            >
              {hasPets && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Terug
          </Button>
        )}
        <Button onClick={handleContinue} className="flex-1">
          Doorgaan
        </Button>
      </div>
    </div>
  );
}
