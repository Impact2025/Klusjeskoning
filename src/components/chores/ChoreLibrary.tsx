'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Plus, Clock, Star } from 'lucide-react';

interface ChoreCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ChoreTemplate {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  frequency: string;
  basePoints: number;
  baseXp: number;
  minAge: number;
  maxAge: number | null;
  difficulty: string;
  icon: string;
  estimatedMinutes: number;
  tips: string | null;
}

interface Child {
  id: string;
  name: string;
}

interface ChoreLibraryProps {
  children: Child[];
  onChoreAdded?: () => void;
}

export default function ChoreLibrary({ children, onChoreAdded }: ChoreLibraryProps) {
  const [categories, setCategories] = useState<ChoreCategory[]>([]);
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ChoreTemplate | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('everyone');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/chore-templates');
      const data = await response.json();
      if (data.categories && data.templates) {
        setCategories(data.categories);
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChore = async () => {
    if (!selectedTemplate || !selectedChildId) {
      toast({
        variant: 'destructive',
        title: 'Selecteer een kind',
        description: 'Kies aan wie je dit klusje wilt toewijzen',
      });
      return;
    }

    // Determine which child IDs to assign
    const assignedIds = selectedChildId === 'everyone'
      ? children.map(c => c.id)
      : [selectedChildId];

    setIsAdding(true);
    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTemplate.name,
          points: selectedTemplate.basePoints,
          assignedChildIds: assignedIds,
          recurrenceType: selectedTemplate.frequency === 'daily' ? 'daily' : selectedTemplate.frequency === 'weekly' ? 'weekly' : 'none',
        }),
      });

      if (response.ok) {
        const assignedTo = selectedChildId === 'everyone'
          ? 'alle kinderen'
          : children.find(c => c.id === selectedChildId)?.name || 'kind';
        toast({
          title: 'Klusje toegevoegd!',
          description: `"${selectedTemplate.name}" is toegewezen aan ${assignedTo}`,
        });
        setIsAddDialogOpen(false);
        setSelectedTemplate(null);
        setSelectedChildId('everyone');
        onChoreAdded?.();
      } else {
        throw new Error('Failed to add chore');
      }
    } catch (error) {
      console.error('Error adding chore:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon het klusje niet toevoegen',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'all' || template.categoryId === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Makkelijk';
      case 'medium': return 'Gemiddeld';
      case 'hard': return 'Moeilijk';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Dagelijks';
      case 'weekly': return 'Wekelijks';
      case 'monthly': return 'Maandelijks';
      default: return frequency;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Zoek klusjes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle categorieën</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Moeilijkheid" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle niveaus</SelectItem>
            <SelectItem value="easy">Makkelijk</SelectItem>
            <SelectItem value="medium">Gemiddeld</SelectItem>
            <SelectItem value="hard">Moeilijk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        {filteredTemplates.length} klusje{filteredTemplates.length !== 1 ? 's' : ''} gevonden
      </p>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const category = getCategoryById(template.categoryId);
          return (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTemplate(template);
                setIsAddDialogOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: (category?.color || '#6366F1') + '20' }}
                  >
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {getDifficultyLabel(template.difficulty)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.basePoints} pts
                    </Badge>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Geen klusjes gevonden met deze filters</p>
        </div>
      )}

      {/* Add Chore Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Klusje Toevoegen</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                  style={{ backgroundColor: (getCategoryById(selectedTemplate.categoryId)?.color || '#6366F1') + '20' }}
                >
                  {selectedTemplate.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{selectedTemplate.basePoints} punten</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>~{selectedTemplate.estimatedMinutes} min</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
                  {getDifficultyLabel(selectedTemplate.difficulty)}
                </Badge>
                <Badge variant="outline">
                  {getFrequencyLabel(selectedTemplate.frequency)}
                </Badge>
                <Badge variant="outline">
                  {selectedTemplate.minAge}+ jaar
                </Badge>
              </div>

              {selectedTemplate.tips && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> {selectedTemplate.tips}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Toewijzen aan
                </label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een kind" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone" className="font-semibold">
                      Iedereen ({children.length} kinderen)
                    </SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddChore} disabled={isAdding}>
              {isAdding ? 'Toevoegen...' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
