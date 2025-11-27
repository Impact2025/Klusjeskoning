'use client';
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import FamilyProfileStep from './FamilyProfileStep';
import StarterPackSelector from './StarterPackSelector';
import AddOnSelector from './AddOnSelector';

interface Child {
  id: string;
  name: string;
  birthdate?: string;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  hasGarden?: boolean;
  hasPets?: boolean;
  onComplete?: () => void;
}

type Step = 'profile' | 'starter-pack' | 'addons' | 'complete';

export default function OnboardingWizard({
  isOpen,
  onClose,
  child,
  hasGarden: initialHasGarden = false,
  hasPets: initialHasPets = false,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>('profile');
  const [hasGarden, setHasGarden] = useState(initialHasGarden);
  const [hasPets, setHasPets] = useState(initialHasPets);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Calculate child age
  const childAge = child.birthdate
    ? Math.floor(
        (new Date().getTime() - new Date(child.birthdate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : 8; // Default to 8 if no birthdate

  const getProgress = () => {
    switch (step) {
      case 'profile':
        return 25;
      case 'starter-pack':
        return 50;
      case 'addons':
        return 75;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'profile':
        return 'Stap 1: Gezinsprofiel';
      case 'starter-pack':
        return 'Stap 2: Kies een startpakket';
      case 'addons':
        return 'Stap 3: Extra klusjes';
      case 'complete':
        return 'Klaar!';
      default:
        return 'Onboarding';
    }
  };

  const handleProfileComplete = async (profile: { hasGarden: boolean; hasPets: boolean }) => {
    setHasGarden(profile.hasGarden);
    setHasPets(profile.hasPets);

    // Save profile to API
    try {
      await fetch('/api/onboarding/family-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
    }

    setStep('starter-pack');
  };

  const handlePackSelect = (packId: string) => {
    setSelectedPackId(packId);
    setStep('addons');
  };

  const handleAddonsComplete = async (addonIds: string[]) => {
    if (!selectedPackId) {
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Geen startpakket geselecteerd',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/apply-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: child.id,
          starterPackId: selectedPackId,
          addonPackIds: addonIds,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Klusjes toegevoegd!',
          description: `${data.choresCreated} klusjes zijn toegevoegd voor ${child.name}`,
        });
        setStep('complete');

        // Call onComplete callback after short delay
        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Error applying pack:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon de klusjes niet toevoegen. Probeer het opnieuw.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-brand text-xl">{getStepTitle()}</DialogTitle>
          <Progress value={getProgress()} className="mt-2" />
        </DialogHeader>

        <div className="py-4">
          {step === 'profile' && (
            <FamilyProfileStep
              initialHasGarden={hasGarden}
              initialHasPets={hasPets}
              onComplete={handleProfileComplete}
            />
          )}

          {step === 'starter-pack' && (
            <StarterPackSelector
              childId={child.id}
              childName={child.name}
              childAge={childAge}
              onSelect={handlePackSelect}
              onBack={() => setStep('profile')}
            />
          )}

          {step === 'addons' && (
            <AddOnSelector
              childAge={childAge}
              hasGarden={hasGarden}
              hasPets={hasPets}
              onComplete={handleAddonsComplete}
              onBack={() => setStep('starter-pack')}
            />
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Klusjes toegevoegd!
              </h3>
              <p className="text-gray-600">
                {child.name} is helemaal klaar om te beginnen met klusjes doen.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
