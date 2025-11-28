'use client';

import { useApp } from '@/components/app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, Clock, Trophy } from 'lucide-react';
import { callAppApi } from '@/lib/api/app-client';
import { useToast } from '@/hooks/use-toast';
import type { TeamChore } from '@/lib/types';

export default function TeamChores() {
  const { family } = useApp();
  const { toast } = useToast();

  const teamChores: TeamChore[] = family?.teamChores || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (chore: any) => {
    if (chore.completedAt) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  const handleCompleteTeamChore = async (teamChoreId: string, teamChoreName: string) => {
    if (!confirm(`Weet je zeker dat je "${teamChoreName}" wilt voltooien? Alle deelnemers krijgen punten.`)) {
      return;
    }

    try {
      await callAppApi('completeTeamChore', { teamChoreId });
      toast({
        title: 'Team klusje voltooid!',
        description: `Alle deelnemers hebben hun punten ontvangen.`,
      });
    } catch (error) {
      console.error('Failed to complete team chore:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon team klusje niet voltooien.',
      });
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
                    {getStatusIcon(chore)}
                    <span className={`ml-1 ${chore.completedAt ? 'text-green-600' : 'text-blue-600'}`}>
                      {chore.completedAt ? 'Voltooid' : 'Bezig'}
                    </span>
                  </span>
                  <span className="text-yellow-600 font-medium">
                    {chore.totalPoints} punten te verdelen
                  </span>
                </div>
              </div>
              {!chore.completedAt && chore.progress === 100 && (
                <Button
                  size="sm"
                  onClick={() => handleCompleteTeamChore(chore.id, chore.name)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  Voltooien
                </Button>
              )}
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
              {!chore.completedAt && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Samenwerken!
                </span>
              )}
            </div>
          </div>
        ))}

        {teamChores.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <p className="text-gray-500">
              Nog geen team klusjes beschikbaar.
            </p>
            <p className="text-sm text-gray-400">
              Vraag je ouders om er een toe te voegen, of klik op het vernieuw-icoon 🔄 rechtsboven om te controleren.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}