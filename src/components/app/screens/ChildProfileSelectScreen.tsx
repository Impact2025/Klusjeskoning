'use client';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ScreenWrapper from '../ScreenWrapper';

export default function ChildProfileSelectScreen() {
  const { family, setScreen, selectChildProfile } = useApp();

  return (
    <ScreenWrapper className="p-6">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => setScreen('childLogin')}>
          <ArrowLeft className="h-6 w-6 text-accent" />
        </Button>
        <h2 className="font-brand text-3xl text-center flex-grow text-accent">Wie ben jij?</h2>
        <div className="w-10"></div>
      </header>
      <main className="flex-grow grid grid-cols-2 gap-4 content-center">
        {family && family.children.length > 0 ? (
          family.children.map((child, index) => (
            <div
              key={child.id}
              onClick={() => selectChildProfile(child.id)}
              className="text-center p-4 rounded-2xl bg-amber-100 hover:bg-amber-200 cursor-pointer transition-colors duration-200 aspect-square flex flex-col justify-center items-center"
            >
              <div className="text-6xl mb-2">{child.avatar}</div>
              <p className="font-bold text-lg">{child.name}</p>
            </div>
          ))
        ) : (
          <p className="col-span-2 text-center text-muted-foreground">
            Geen kinderen gevonden in dit gezin. Vraag je ouders om je toe te voegen.
          </p>
        )}
      </main>
    </ScreenWrapper>
  );
}
