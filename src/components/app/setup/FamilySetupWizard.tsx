'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { getChoresForAge, getDefaultAllowanceForAge } from '@/lib/age-based-chores';
import { getDefaultRewardsForFamily, getRewardSuggestionsForFamily } from '@/lib/reward-suggestions';
import { RewardType } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';

interface ChildInfo {
  name: string;
  age: number;
}

interface FamilySetupWizardProps {
  onComplete: (data: {
    children: ChildInfo[];
    model: 'linked' | 'separate';
    chores: any[];
    allowances: { [childName: string]: number };
    rewards: Array<{
      name: string;
      points: number;
      type: RewardType;
      assignedTo: string[];
    }>;
  }) => void;
}

export default function FamilySetupWizard({ onComplete }: FamilySetupWizardProps) {
  const [step, setStep] = useState(1);
  const [numChildren, setNumChildren] = useState(1);
  const [children, setChildren] = useState<ChildInfo[]>([{ name: '', age: 8 }]);
  const [model, setModel] = useState<'linked' | 'separate'>('linked');
  const [selectedRewards, setSelectedRewards] = useState<Set<string>>(new Set());

  const totalSteps = 4;

  const handleNumChildrenChange = (num: number) => {
    setNumChildren(num);
    setChildren(Array.from({ length: num }, (_, i) => ({
      name: children[i]?.name || '',
      age: children[i]?.age || 8
    })));
  };

  const handleChildChange = (index: number, field: keyof ChildInfo, value: string | number) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Generate chores and allowances
      const chores = children.flatMap(child =>
        getChoresForAge(child.age, 5).map(chore => ({
          ...chore,
          assignedTo: [child.name], // Will be converted to IDs later
        }))
      );

      const allowances = children.reduce((acc, child) => ({
        ...acc,
        [child.name]: getDefaultAllowanceForAge(child.age)
      }), {});

      // Generate default rewards based on selected rewards
      const rewards = Array.from(selectedRewards).map(rewardName => {
        const suggestion = getRewardSuggestionsForFamily(children).find(r => r.name === rewardName);
        return {
          name: suggestion?.name || rewardName,
          points: suggestion?.points || 50,
          type: suggestion?.type || 'privilege' as RewardType,
          assignedTo: [] // Available to all children
        };
      });

      onComplete({
        children,
        model,
        chores,
        allowances,
        rewards
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return numChildren >= 1 && numChildren <= 5;
      case 2:
        return children.every(child => child.name.trim() && child.age >= 4 && child.age <= 18);
      case 3:
        return model === 'linked' || model === 'separate';
      case 4:
        return selectedRewards.size > 0; // At least one reward selected
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Welkom bij KlusjesKoning! 👑
          </CardTitle>
          <div className="flex justify-center mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full mx-1 ${
                  i + 1 <= step ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Hoeveel kinderen?</h3>
                <p className="text-sm text-gray-600">Selecteer het aantal kinderen in jullie gezin</p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <Button
                    key={num}
                    variant={numChildren === num ? "default" : "outline"}
                    className="h-12 text-lg font-bold"
                    onClick={() => handleNumChildrenChange(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Vertel ons over jullie kinderen</h3>
                <p className="text-sm text-gray-600">We gebruiken dit om geschikte klusjes voor te stellen</p>
              </div>

              {children.map((child, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-medium">Kind {index + 1}</h4>
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Naam</Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="Voornaam"
                      value={child.name}
                      onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`age-${index}`}>Leeftijd</Label>
                    <Input
                      id={`age-${index}`}
                      type="number"
                      min="4"
                      max="18"
                      value={child.age}
                      onChange={(e) => handleChildChange(index, 'age', parseInt(e.target.value) || 8)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Hoe werken jullie zakgeld?</h3>
                <p className="text-sm text-gray-600">Kies het model dat bij jullie gezin past</p>
              </div>

              <RadioGroup value={model} onValueChange={(value) => setModel(value as 'linked' | 'separate')}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="linked" id="linked" />
                    <div>
                      <Label htmlFor="linked" className="font-medium cursor-pointer">
                        Zakgeld gekoppeld aan klusjes
                      </Label>
                      <p className="text-sm text-gray-600">
                        Kinderen verdienen zakgeld door klusjes te doen
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="separate" id="separate" />
                    <div>
                      <Label htmlFor="separate" className="font-medium cursor-pointer">
                        Zakgeld los van klusjes
                      </Label>
                      <p className="text-sm text-gray-600">
                        Klusjes geven punten, zakgeld is apart
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">We stellen voor:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {children.map((child, index) => (
                    <li key={index}>
                      • {child.name} ({child.age} jaar): €{(getDefaultAllowanceForAge(child.age) / 100).toFixed(2)} per week
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  We hebben {children.reduce((sum, child) => sum + getChoresForAge(child.age, 5).length, 0)} klusjes voorgesteld gebaseerd op hun leeftijden.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Kies jullie beloningen</h3>
                <p className="text-sm text-gray-600">Selecteer welke beloningen jullie kinderen kunnen verdienen</p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {getRewardSuggestionsForFamily(children).map((reward) => (
                  <div key={reward.name} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={reward.name}
                      checked={selectedRewards.has(reward.name)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedRewards);
                        if (checked) {
                          newSelected.add(reward.name);
                        } else {
                          newSelected.delete(reward.name);
                        }
                        setSelectedRewards(newSelected);
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={reward.name} className="font-medium cursor-pointer">
                        {reward.name}
                      </Label>
                      <p className="text-sm text-gray-600">{reward.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-yellow-600">{reward.points} punten</span>
                        <span className="text-xs text-gray-500 capitalize">{reward.category.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">💡 Tip:</h4>
                <p className="text-sm text-green-700">
                  Begin met 4-6 beloningen. Je kunt altijd meer toevoegen later in de ouder dashboard.
                  Beloningen motiveren kinderen om klusjes te doen!
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Terug
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="ml-auto"
            >
              {step === totalSteps ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Start!
                </>
              ) : (
                <>
                  Volgende
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}