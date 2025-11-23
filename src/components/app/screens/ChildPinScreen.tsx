'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Delete, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import ScreenWrapper from '../ScreenWrapper';

export default function ChildPinScreen() {
  const { user, setScreen, submitPin } = useApp();
  const [pin, setPin] = useState('');

  const handlePinEnter = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      submitPin(pin);
      setPin('');
    }
  };

  useEffect(() => {
    if (!user) {
      setScreen('childLogin');
      return;
    }
  }, [user, setScreen]);

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (!user) {
    return null;
  }

  const pinPad = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
  ];

  return (
    <ScreenWrapper className="p-6 justify-between">
      <header className="text-center relative">
        <Button variant="ghost" size="icon" onClick={() => setScreen('childProfileSelect')} className="absolute left-0 top-1/2 -translate-y-1/2">
          <ArrowLeft className="h-6 w-6 text-accent" />
        </Button>
        <div>
          <h2 className="font-brand text-3xl text-accent">Hoi, {user.name}!</h2>
          <p className="text-gray-600">Voer je geheime pincode in</p>
        </div>
      </header>

      <div className="flex justify-center items-center space-x-4 my-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-6 w-6 rounded-full transition-colors",
              pin.length > i ? "bg-primary" : "bg-gray-300"
            )}
          ></div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 text-2xl">
        {pinPad.map((num) => (
          <Button key={num} onClick={() => handlePinEnter(num)} className="h-16 text-2xl shadow-sm" variant="outline">
            {num}
          </Button>
        ))}
        <Button onClick={handleDelete} className="h-16 text-2xl shadow-sm" variant="outline">
          <Delete />
        </Button>
        <Button onClick={() => handlePinEnter('0')} className="h-16 text-2xl shadow-sm" variant="outline">
          0
        </Button>
        <Button onClick={handleSubmit} className="h-16 text-2xl shadow-sm bg-success hover:bg-success/90 text-white">
          <Check />
        </Button>
      </div>
    </ScreenWrapper>
  );
}
