'use client';
import Image from 'next/image';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

type QrCodeModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

export default function QrCodeModal({ isOpen, setIsOpen }: QrCodeModalProps) {
  const { family } = useApp();

  if (!family) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(family.familyCode)}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Deel Gezinscode</DialogTitle>
          <DialogDescription>Laat je kind deze QR code scannen om in te loggen.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-4 p-4 bg-white rounded-lg">
            <Image
                src={qrCodeUrl}
                width={200}
                height={200}
                alt={`QR Code for family code ${family.familyCode}`}
            />
        </div>
        <p className="font-mono text-2xl bg-gray-100 p-2 rounded-lg mb-6">{family.familyCode}</p>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => setIsOpen(false)}>Sluiten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
