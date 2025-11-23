'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogFiltersProps {
  searchQuery: string;
  selectedTags: string[];
  availableTags: Array<{ tag: string; count: number }>;
  onSearchChange: (query: string) => void;
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export function BlogFilters({
  searchQuery,
  selectedTags,
  availableTags,
  onSearchChange,
  onTagToggle,
  onClearFilters,
  totalResults,
}: BlogFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasActiveFilters = searchQuery.trim() || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Zoek artikelen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Tags ({selectedTags.length})
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={onClearFilters} className="text-slate-600">
              Wis filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">Actieve filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Zoek: "{searchQuery}"
              <button onClick={() => onSearchChange('')} className="ml-1 hover:text-slate-700">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              #{tag}
              <button onClick={() => onTagToggle(tag)} className="ml-1 hover:text-slate-700">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Filter Panel */}
      {isFiltersOpen && (
        <Card className="border-slate-200 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Filter op tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(({ tag, count }) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    #{tag}
                    <span className="ml-1 text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="text-sm text-slate-600">
        {totalResults} {totalResults === 1 ? 'artikel' : 'artikelen'} gevonden
      </div>
    </div>
  );
}