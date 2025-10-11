'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Gamepad2, Users, Coins, Heart, ListChecks, Award, Gift, PiggyBank, Settings, BarChart, CheckCircle } from 'lucide-react';


type UserType = 'child' | 'parent';

const childSlides = [
    { 
        icon: <Crown className="h-12 w-12 text-yellow-500" />, 
        title: "Welkom bij KlusjesKoning", 
        text: "Word de baas van de klusjes in huis! Doe mee, spaar punten en word KlusjesKoning 👑." 
    },
    { 
        icon: <ListChecks className="h-12 w-12 text-blue-500" />, 
        title: "Hoe werkt het?", 
        text: "Kies een klusje, vink het af in de app zodra je klaar bent en verdien punten om hoger in de rang te klimmen!" 
    },
    { 
        icon: <Award className="h-12 w-12 text-green-500" />, 
        title: "Wat kun je met punten?", 
        text: "Ruil je punten in voor leuke dingen met je ouders, extra zakgeld, kleine verrassingen of doneer aan een goed doel." 
    },
    { 
        icon: <CheckCircle className="h-12 w-12 text-purple-500" />, 
        title: "Het doel", 
        text: "Samen zorgen we dat het huis netjes blijft én jij leert een echte KlusjesKoning te worden." 
    },
];

const parentSlides = [
    { 
        icon: <Crown className="h-12 w-12 text-blue-600" />, 
        title: "Wat is KlusjesKoning?", 
        text: "Een eenvoudige app die kinderen helpt om verantwoordelijkheid te leren en plezier te hebben met klusjes in en om het huis." 
    },
    { 
        icon: <Settings className="h-12 w-12 text-gray-700" />, 
        title: "Hoe werkt het?", 
        text: "Stel zelf klusjes in, wijs punten toe en zie in het dashboard wat je kind gedaan heeft. Makkelijk en overzichtelijk." 
    },
    { 
        icon: <Gift className="h-12 w-12 text-teal-500" />, 
        title: "Beloningen", 
        text: "Bepaal zelf de beloningen: quality time, extra zakgeld, kleine cadeaus of een donatie aan een goed doel." 
    },
    { 
        icon: <Users className="h-12 w-12 text-red-500" />, 
        title: "Het doel", 
        text: "Kinderen leren meehelpen en ouders krijgen meer overzicht en minder strijd. Samen maken jullie klusjes leuk en belonend." 
    },
];


export function OnboardingCarousel({ userType }: { userType: UserType }) {
  const slides = userType === 'child' ? childSlides : parentSlides;

  return (
    <Carousel className="w-full max-w-xs sm:max-w-sm mx-auto">
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center aspect-square">
                  <div className="mb-4">{slide.icon}</div>
                  <h3 className="text-xl font-bold font-brand mb-2">{slide.title}</h3>
                  <p className="text-sm text-muted-foreground">{slide.text}</p>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex"/>
      <CarouselNext className="hidden sm:flex"/>
    </Carousel>
  );
}
