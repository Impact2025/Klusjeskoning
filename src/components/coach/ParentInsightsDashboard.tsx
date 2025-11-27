'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KobiAvatar } from './index';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  X,
  Sparkles,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Insight {
  id: string;
  insightType: string;
  title: string;
  content: string;
  priority: number;
  actionable: boolean;
  actionText?: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  childId?: string | null;
}

interface WeeklySummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  summaryContent: string;
  highlights: string[] | null;
  recommendations: string[] | null;
  childStats: Array<{
    name: string;
    choresCompleted: number;
    totalPoints: number;
    streakDays: number;
  }> | null;
  isRead: boolean;
  createdAt: string;
}

interface Child {
  id: string;
  name: string;
}

interface ParentInsightsDashboardProps {
  className?: string;
}

const insightTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  optimal_time: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'Optimale Tijd' },
  strength: { icon: TrendingUp, color: 'text-green-600 bg-green-100', label: 'Sterk Punt' },
  attention_point: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-100', label: 'Aandachtspunt' },
  collaboration: { icon: Users, color: 'text-purple-600 bg-purple-100', label: 'Samenwerking' },
  recommendation: { icon: Lightbulb, color: 'text-cyan-600 bg-cyan-100', label: 'Aanbeveling' },
  balance_warning: { icon: AlertTriangle, color: 'text-red-600 bg-red-100', label: 'Balans Waarschuwing' },
  weekly_summary: { icon: Calendar, color: 'text-indigo-600 bg-indigo-100', label: 'Wekelijks' },
};

export default function ParentInsightsDashboard({ className }: ParentInsightsDashboardProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const { toast } = useToast();

  const fetchInsights = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedChild !== 'all') {
        params.set('childId', selectedChild);
      }

      const response = await fetch(`/api/coach/insights?${params}`);
      const data = await response.json();

      if (data.insights) {
        setInsights(data.insights);
      }
      if (data.children) {
        setChildren(data.children);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  }, [selectedChild]);

  const fetchSummaries = useCallback(async () => {
    try {
      const response = await fetch('/api/coach/weekly-summary?limit=4');
      const data = await response.json();

      if (data.summaries) {
        setSummaries(data.summaries);
      }
    } catch (error) {
      console.error('Failed to fetch summaries:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchInsights(), fetchSummaries()]);
      setLoading(false);
    };
    loadData();
  }, [fetchInsights, fetchSummaries]);

  const handleMarkRead = async (insightId: string) => {
    try {
      await fetch('/api/coach/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', insightId }),
      });
      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, isRead: true } : i)
      );
    } catch (error) {
      console.error('Failed to mark insight as read:', error);
    }
  };

  const handleDismiss = async (insightId: string) => {
    try {
      await fetch('/api/coach/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', insightId }),
      });
      setInsights(prev => prev.filter(i => i.id !== insightId));
      toast({
        title: 'Inzicht verborgen',
        description: 'Je kunt dit inzicht niet meer zien.',
      });
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  const generateNewInsight = async (childId: string, insightType: string) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/coach/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          childId,
          insightType,
        }),
      });

      const data = await response.json();

      if (data.insight) {
        setInsights(prev => [data.insight, ...prev]);
        toast({
          title: 'Nieuw inzicht gegenereerd',
          description: data.insight.title,
        });
      }
    } catch (error) {
      console.error('Failed to generate insight:', error);
      toast({
        title: 'Fout',
        description: 'Kon geen nieuw inzicht genereren.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateWeeklySummary = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/coach/weekly-summary', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.summary) {
        setSummaries(prev => [data.summary, ...prev.slice(0, 3)]);
        toast({
          title: data.alreadyExists ? 'Samenvatting al beschikbaar' : 'Samenvatting gegenereerd',
          description: 'Je wekelijkse rapport is klaar.',
        });
      }
    } catch (error) {
      console.error('Failed to generate weekly summary:', error);
      toast({
        title: 'Fout',
        description: 'Kon geen samenvatting genereren.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const unreadInsights = insights.filter(i => !i.isRead).length;

  return (
    <Card className={cn('bg-white/50 backdrop-blur-sm border-gray-200/60', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KobiAvatar size="md" mood="thinking" />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI Coach Inzichten
                {unreadInsights > 0 && (
                  <Badge className="bg-yellow-400 text-yellow-900">
                    {unreadInsights} nieuw
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Slimme analyses en aanbevelingen van Kobi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kinderen</SelectItem>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Inzichten
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Wekelijks Rapport
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : insights.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {insights.map(insight => {
                    const config = insightTypeConfig[insight.insightType] || insightTypeConfig.recommendation;
                    const Icon = config.icon;
                    const childName = insight.childId
                      ? children.find(c => c.id === insight.childId)?.name
                      : null;

                    return (
                      <Card
                        key={insight.id}
                        className={cn(
                          'border transition-all duration-200 hover:shadow-md',
                          !insight.isRead && 'ring-2 ring-yellow-300 ring-offset-2'
                        )}
                        onClick={() => !insight.isRead && handleMarkRead(insight.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={cn('p-2 rounded-lg', config.color)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {insight.title}
                                  </h4>
                                  {!insight.isRead && (
                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                      Nieuw
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss(insight.id);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {config.label}
                                </Badge>
                                {childName && (
                                  <Badge variant="outline" className="text-xs">
                                    {childName}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatDate(insight.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">
                                {insight.content}
                              </p>
                              {insight.actionable && insight.actionText && (
                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                  <Target className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-blue-800">
                                    {insight.actionText}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <KobiAvatar size="xl" mood="thinking" className="mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Nog geen inzichten
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                  Kobi analyseert het gedrag van jullie kinderen en genereert automatisch inzichten naarmate er meer data beschikbaar is.
                </p>
                {children.length > 0 && (
                  <Button
                    onClick={() => generateNewInsight(children[0].id, 'recommendation')}
                    disabled={generating}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500"
                  >
                    {generating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Genereer Eerste Inzicht
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button
                onClick={generateWeeklySummary}
                disabled={generating}
                variant="outline"
                size="sm"
              >
                {generating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Genereer Samenvatting
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : summaries.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {summaries.map(summary => (
                    <Card key={summary.id} className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-base">
                              Week {formatDate(summary.weekStart)} - {formatDate(summary.weekEnd)}
                            </CardTitle>
                          </div>
                          {!summary.isRead && (
                            <Badge className="bg-indigo-100 text-indigo-800">Nieuw</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Summary content */}
                        <div className="prose prose-sm max-w-none">
                          <div
                            className="text-gray-700"
                            dangerouslySetInnerHTML={{
                              __html: summary.summaryContent.replace(/\n/g, '<br />'),
                            }}
                          />
                        </div>

                        {/* Highlights */}
                        {summary.highlights && summary.highlights.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                              Hoogtepunten
                            </h4>
                            <ul className="space-y-1">
                              {summary.highlights.map((highlight, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        {summary.recommendations && summary.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-cyan-500" />
                              Aanbevelingen
                            </h4>
                            <ul className="space-y-1">
                              {summary.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <ChevronRight className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Child stats */}
                        {summary.childStats && summary.childStats.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                            {summary.childStats.map((stat, i) => (
                              <div key={i} className="p-3 bg-white rounded-lg border">
                                <p className="font-semibold text-gray-900">{stat.name}</p>
                                <div className="text-xs text-gray-600 space-y-1 mt-1">
                                  <p>{stat.choresCompleted} klusjes</p>
                                  <p>{stat.totalPoints} punten</p>
                                  <p>{stat.streakDays} dagen streak</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Nog geen wekelijkse rapporten
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Genereer je eerste wekelijkse samenvatting om inzicht te krijgen in de voortgang van jullie gezin.
                </p>
                <Button
                  onClick={generateWeeklySummary}
                  disabled={generating}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  {generating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Genereer Eerste Rapport
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
