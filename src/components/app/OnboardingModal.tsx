'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { OnboardingCarousel } from './OnboardingCarousel';

type UserType = 'child' | 'parent';

type OnboardingModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userType: UserType;
};

export default function OnboardingModal({ isOpen, setIsOpen, userType }: OnboardingModalProps) {

  const title = userType === 'child' ? "Uitleg voor Kinderen" : "Uitleg voor Ouders";
  const description = userType === 'child' ? "Ontdek hoe jij een KlusjesKoning wordt!" : "Ontdek hoe je de app instelt en gebruikt.";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-brand text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <OnboardingCarousel userType={userType} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
