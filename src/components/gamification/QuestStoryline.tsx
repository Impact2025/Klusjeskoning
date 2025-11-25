'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight, Star, Heart, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestStorylineProps {
  questChainId: string;
  completedStep: number;
  totalSteps: number;
  onContinue: () => void;
  className?: string;
}

const QUEST_STORIES = {
  'morning-routine': {
    title: '🌅 De Ochtend Avonturier',
    storyline: [
      {
        step: 1,
        title: 'De Tandenpoets Ritueel',
        story: 'In het koninkrijk van de Schone Tanden leefde een dappere ridder genaamd {name}. Elke ochtend begon zijn queeste met het verslaan van de gemene Plak Monsters die zich in zijn mond verscholen. Met zijn magische tandenborstel als zwaard, veegde hij ze allemaal weg!',
        reward: 'De eerste overwinning van de dag! 💪'
      },
      {
        step: 2,
        title: 'Het Beddengoed Kasteel',
        story: 'Na zijn eerste overwinning bouwde {name} een prachtig kasteel van zijn beddengoed. De kussens werden torens, de dekens werden muren, en zijn droom werd de schatkamer. Een goed opgemaakt bed is het fundament van een succesvolle dag!',
        reward: 'Een vesting van comfort! 🏰'
      },
      {
        step: 3,
        title: 'De Held Uitdossen',
        story: 'Nu volledig uitgerust met schone tanden en een perfect bed, kleedde {name} zich aan als de ware held die hij is. Zijn kleding werd zijn harnas, zijn schoenen werden zijn laarzen. Klaar voor avontuur!',
        reward: 'De ultieme transformatie! ⚔️'
      }
    ],
    completion: 'Gefeliciteerd, {name}! Je bent nu een echte Ochtend Avonturier. Het rijk van de Dag wacht op je volgende queestes!'
  },
  'bedroom-cleanup': {
    title: '🏰 Het Mysterie van de Verborgen Schat',
    storyline: [
      {
        step: 1,
        title: 'De Speelgoed Schatkamer',
        story: '{name} ontdekte dat zijn speelgoed niet zomaar rommel was, maar schatten uit een verloren beschaving! Elke opgeruimde pop en auto vertelde een verhaal uit het verleden. Door ze netjes op te bergen, behield hij hun magie!',
        reward: 'Ontgrendelde speelgoed magie! 🎮'
      },
      {
        step: 2,
        title: 'De Kleren Betovering',
        story: 'Diep in de kast vond {name} kledingstukken die betoverd waren met de kracht van netheid. Elke opgevouwen trui onthulde een geheim patroon, elke gestapelde broek vertelde een verhaal van orde en discipline.',
        reward: 'Kleding met superkrachten! 👕'
      },
      {
        step: 3,
        title: 'De Vloer Zuig Avontuur',
        story: 'Het hoogtepunt van het avontuur! {name} confronteerde de Vloer Monster, een verschrikkelijk wezen gemaakt van stof en verloren sokken. Met zijn magische stofzuiger als wapen, versloeg hij het monster en onthulde de verborgen schat eronder!',
        reward: 'De legendarische schat! 💎'
      }
    ],
    completion: 'Onvoorstelbaar, {name}! Je hebt de Verborgen Schat gevonden! Jouw slaapkamer is nu een tempel van orde en avontuur!'
  },
  'kitchen-helper': {
    title: '👨‍🍳 De Keuken Alchemist',
    storyline: [
      {
        step: 1,
        title: 'De Tafel Magie',
        story: 'In de keuken van betoverde recepten begon {name} zijn alchemistische reis. De tafel was bedekt met de resten van magische experimenten. Door ze op te ruimen, ontdekte hij de geheime ingrediënten voor succes!',
        reward: 'Alchemistische kennis! ⚗️'
      },
      {
        step: 2,
        title: 'De Vaatwasser Toverspreuk',
        story: '{name} sprak de oude toverspreuk van de vaatwasser uit. Elke bord en beker die hij inruimde, werd getransformeerd door de magische cyclus. Uit vuil werd schoon, uit chaos werd orde!',
        reward: 'Magische transformatie kracht! ✨'
      },
      {
        step: 3,
        title: 'Het Aanrecht Mysterie',
        story: 'Het laatste mysterie werd onthuld! Het aanrecht was de sleutel tot de keukenpoort. {name} veegde het schoon met de precisie van een meester-alchemist, onthullend de glanzende oppervlakte die deuren opende naar culinaire wonderen!',
        reward: 'Meester-alchemist status! 🧙‍♂️'
      }
    ],
    completion: 'Magnifiek, {name}! Je bent nu een ware Keuken Alchemist. Jouw gerechten zullen voortaan betoverend zijn!'
  }
};

export default function QuestStoryline({
  questChainId,
  completedStep,
  totalSteps,
  onContinue,
  className
}: QuestStorylineProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const story = QUEST_STORIES[questChainId as keyof typeof QUEST_STORIES];
  const currentStepData = story?.storyline[completedStep - 1];

  useEffect(() => {
    if (completedStep === totalSteps) {
      setShowCompletion(true);
    }
  }, [completedStep, totalSteps]);

  if (!story || !currentStepData) return null;

  const handleNextStory = () => {
    if (currentStoryIndex < story.storyline.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      onContinue();
    }
  };

  const currentStory = story.storyline[currentStoryIndex];
  const isLastStory = currentStoryIndex === story.storyline.length - 1;

  if (showCompletion) {
    return (
      <Card className={cn('relative overflow-hidden animate-fade-in-up', className)}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-orange-400/10 to-red-400/10" />

        <CardHeader className="relative text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Queeste Voltooid!
            <Trophy className="h-6 w-6 text-yellow-500" />
          </CardTitle>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-bold mb-2">{story.title}</h3>
            <p className="text-gray-700 leading-relaxed">
              {story.completion.replace('{name}', 'Jij')}
            </p>
          </div>

          <div className="flex justify-center gap-2">
            <Button onClick={onContinue} className="bg-gradient-to-r from-yellow-500 to-orange-500">
              <ChevronRight className="h-4 w-4 mr-2" />
              Verder met Avonturen!
            </Button>
          </div>

          {/* Celebration effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 text-xl animate-bounce">⭐</div>
            <div className="absolute top-4 right-4 text-lg animate-pulse">🎊</div>
            <div className="absolute bottom-4 left-4 text-lg animate-spin">🏆</div>
            <div className="absolute bottom-4 right-4 text-xl animate-bounce">🎉</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden animate-fade-in-up', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          {story.title}
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">
            Stap {currentStoryIndex + 1} van {story.storyline.length}
          </Badge>
          <Badge variant="secondary">
            <Star className="h-3 w-3 mr-1" />
            Queeste {completedStep}/{totalSteps}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-center">{currentStory.title}</h3>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <p className="text-gray-700 leading-relaxed">
              {currentStory.story.replace('{name}', 'Jij')}
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Heart className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-700">{currentStory.reward}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {currentStoryIndex + 1} / {story.storyline.length} verhalen
          </div>

          <Button
            onClick={handleNextStory}
            className={cn(
              "transition-all duration-200",
              isLastStory
                ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            )}
          >
            {isLastStory ? (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Queeste Voltooien!
              </>
            ) : (
              <>
                Volgend Verhaal
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStoryIndex + 1) / story.storyline.length) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}