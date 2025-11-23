'use client';

import { useApp } from '@/components/app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, Clock } from 'lucide-react';

export default function TeamChores() {
  const { family } = useApp();

  // Mock team chores data - in production this would come from the database
  const teamChores = [
    {
      id: '1',
      name: 'Grote Keuken Schoonmaak',
      description: 'De hele keuken van boven tot onder schoonmaken',
      progress: 65,
      participatingChildren: ['child1', 'child2', 'child3'],
      totalPoints: 150,
      status: 'in_progress',
    },
    {
      id: '2',
      name: 'Tuin Opknappen',
      description: 'Onkruid wieden en planten water geven',
      progress: 30,
      participatingChildren: ['child1', 'child2'],
      totalPoints: 200,
      status: 'in_progress',
    },
    {
      id: '3',
      name: 'Speelkamer Organiseren',
      description: 'Alle speelgoed opruimen en organiseren',
      progress: 100,
      participatingChildren: ['child1', 'child2', 'child3'],
      totalPoints: 120,
      status: 'completed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Team Klusjes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamChores.map((chore) => (
          <div key={chore.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{chore.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{chore.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center">
                    {getStatusIcon(chore.status)}
                    <span className={`ml-1 ${getStatusColor(chore.status)}`}>
                      {chore.status === 'completed' ? 'Voltooid' :
                       chore.status === 'in_progress' ? 'Bezig' : 'Gepland'}
                    </span>
                  </span>
                  <span className="text-yellow-600 font-medium">
                    {chore.totalPoints} punten te verdelen
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Voortgang</span>
                <span>{chore.progress}%</span>
              </div>
              <Progress value={chore.progress} className="h-3" />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>{chore.participatingChildren.length} deelnemers</span>
              </div>
              {chore.status === 'in_progress' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Samenwerken!
                </span>
              )}
            </div>
          </div>
        ))}

        {teamChores.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Geen team klusjes beschikbaar. Vraag je ouders om er een toe te voegen!
          </p>
        )}
      </CardContent>
    </Card>
  );
}