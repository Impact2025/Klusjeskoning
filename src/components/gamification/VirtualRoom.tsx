'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, Palette, Sofa, Bed, Lamp, Star, Sparkles, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomItem {
  id: string;
  name: string;
  type: 'wallpaper' | 'floor' | 'furniture' | 'decoration';
  category: string;
  imageUrl?: string;
  emoji: string;
  xpRequired: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  equipped: boolean;
  position?: { x: number; y: number };
}

interface VirtualRoomProps {
  className?: string;
}

const ROOM_ITEMS: RoomItem[] = [
  // Wallpapers
  {
    id: 'wallpaper_space',
    name: 'Ruimte Thema',
    type: 'wallpaper',
    category: 'achtergronden',
    emoji: '🌌',
    xpRequired: 100,
    rarity: 'rare',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'wallpaper_forest',
    name: 'Bos Thema',
    type: 'wallpaper',
    category: 'achtergronden',
    emoji: '🌲',
    xpRequired: 150,
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'wallpaper_ocean',
    name: 'Oceaan Thema',
    type: 'wallpaper',
    category: 'achtergronden',
    emoji: '🌊',
    xpRequired: 200,
    rarity: 'legendary',
    unlocked: false,
    equipped: false,
  },

  // Floors
  {
    id: 'floor_wood',
    name: 'Houten Vloer',
    type: 'floor',
    category: 'vloeren',
    emoji: '🪵',
    xpRequired: 50,
    rarity: 'common',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'floor_carpet',
    name: 'Speelgoed Tapijt',
    type: 'floor',
    category: 'vloeren',
    emoji: '🧶',
    xpRequired: 120,
    rarity: 'rare',
    unlocked: false,
    equipped: false,
  },

  // Furniture
  {
    id: 'bed_comfy',
    name: 'Gezellige Slaapbank',
    type: 'furniture',
    category: 'meubels',
    emoji: '🛋️',
    xpRequired: 80,
    rarity: 'common',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'desk_gaming',
    name: 'Gaming Bureau',
    type: 'furniture',
    category: 'meubels',
    emoji: '🖥️',
    xpRequired: 180,
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'bookshelf',
    name: 'Speelgoed Kast',
    type: 'furniture',
    category: 'meubels',
    emoji: '📚',
    xpRequired: 140,
    rarity: 'rare',
    unlocked: false,
    equipped: false,
  },

  // Decorations
  {
    id: 'plant_small',
    name: 'Kleine Plant',
    type: 'decoration',
    category: 'decoraties',
    emoji: '🌱',
    xpRequired: 30,
    rarity: 'common',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'lamp_desk',
    name: 'Bureaublamp',
    type: 'decoration',
    category: 'decoraties',
    emoji: '💡',
    xpRequired: 60,
    rarity: 'common',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'trophy_case',
    name: 'Trofeeënkast',
    type: 'decoration',
    category: 'decoraties',
    emoji: '🏆',
    xpRequired: 250,
    rarity: 'legendary',
    unlocked: false,
    equipped: false,
  },
  {
    id: 'pet_house',
    name: 'Huisdierenhuis',
    type: 'decoration',
    category: 'decoraties',
    emoji: '🏠',
    xpRequired: 160,
    rarity: 'epic',
    unlocked: false,
    equipped: false,
  },
];

const RARITY_CONFIG = {
  common: { color: 'text-gray-600 border-gray-300 bg-gray-50', icon: Star },
  rare: { color: 'text-blue-600 border-blue-400 bg-blue-50', icon: Sparkles },
  epic: { color: 'text-purple-600 border-purple-500 bg-purple-50', icon: Crown },
  legendary: { color: 'text-yellow-600 border-yellow-500 bg-yellow-50', icon: Zap },
};

export default function VirtualRoom({ className }: VirtualRoomProps) {
  const { user } = useApp();
  const [items, setItems] = useState<RoomItem[]>(ROOM_ITEMS);
  const [activeTab, setActiveTab] = useState('room');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      // Mark items as unlocked based on XP
      setItems(prev => prev.map(item => ({
        ...item,
        unlocked: user.totalXpEver >= item.xpRequired
      })));
    }
  }, [user]);

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  const equippedWallpaper = items.find(item => item.type === 'wallpaper' && item.equipped);
  const equippedFloor = items.find(item => item.type === 'floor' && item.equipped);
  const equippedFurniture = items.filter(item => item.type === 'furniture' && item.equipped);
  const equippedDecorations = items.filter(item => item.type === 'decoration' && item.equipped);

  const handleEquipItem = (itemId: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (!item || !item.unlocked) return prev;

      // If already equipped, unequip it
      if (item.equipped) {
        return prev.map(i =>
          i.id === itemId ? { ...i, equipped: false } : i
        );
      }

      // Otherwise, unequip all items of the same type and equip this one
      return prev.map(i => {
        if (i.type === item.type) {
          return { ...i, equipped: i.id === itemId };
        }
        return i;
      });
    });
  };

  const getRoomBackground = () => {
    if (equippedWallpaper) {
      switch (equippedWallpaper.id) {
        case 'wallpaper_space': return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900';
        case 'wallpaper_forest': return 'bg-gradient-to-br from-green-800 via-green-600 to-emerald-400';
        case 'wallpaper_ocean': return 'bg-gradient-to-br from-blue-800 via-cyan-600 to-teal-400';
        default: return 'bg-gradient-to-br from-blue-100 to-purple-100';
      }
    }
    return 'bg-gradient-to-br from-blue-100 to-purple-100';
  };

  const getFloorPattern = () => {
    if (equippedFloor) {
      switch (equippedFloor.id) {
        case 'floor_wood': return '🏠';
        case 'floor_carpet': return '🧶';
        default: return '⬜';
      }
    }
    return '⬜';
  };

  const categories = ['achtergronden', 'vloeren', 'meubels', 'decoraties'];

  if (!user) return null;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-red-400/10" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Home className="h-5 w-5 text-amber-500" />
          Mijn Virtuele Kamer
          <Home className="h-5 w-5 text-amber-500" />
        </CardTitle>
        <div className="text-center text-sm text-gray-600 mt-1">
          Versier je eigen speciale ruimte! 🏠✨
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-bold">{user.totalXpEver} XP</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Level {Math.floor(user.totalXpEver / 100) + 1}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="room">Mijn Kamer</TabsTrigger>
            <TabsTrigger value="shop">Winkel</TabsTrigger>
          </TabsList>

          <TabsContent value="room" className="space-y-4">
            {/* Room Preview */}
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-center">Jouw Kamer</h3>
              <div className={cn(
                'relative w-full h-64 rounded-xl border-4 border-white shadow-2xl overflow-hidden',
                getRoomBackground()
              )}>
                {/* Floor */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-amber-100 border-t-2 border-amber-300 flex items-center justify-center text-2xl">
                  {getFloorPattern()}
                </div>

                {/* Furniture */}
                <div className="absolute inset-4 flex flex-wrap gap-2 justify-center items-end pb-16">
                  {equippedFurniture.map((item, index) => (
                    <div
                      key={item.id}
                      className="text-3xl animate-bounce"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      {item.emoji}
                    </div>
                  ))}
                </div>

                {/* Decorations */}
                <div className="absolute inset-2 pointer-events-none">
                  {equippedDecorations.map((item, index) => (
                    <div
                      key={item.id}
                      className="absolute text-2xl animate-pulse"
                      style={{
                        top: `${20 + (index * 15)}%`,
                        left: `${10 + (index * 20)}%`,
                        animationDelay: `${index * 0.3}s`
                      }}
                    >
                      {item.emoji}
                    </div>
                  ))}
                </div>

                {/* Empty room message */}
                {equippedFurniture.length === 0 && equippedDecorations.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white/80">
                      <div className="text-4xl mb-2">🏠</div>
                      <p className="text-sm">Kies meubels en decoraties in de winkel!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Equipped Items Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Achtergrond</h4>
                <div className="text-2xl text-center p-2 bg-white/50 rounded">
                  {equippedWallpaper?.emoji || '⬜'}
                </div>
                <p className="text-xs text-center text-gray-600">
                  {equippedWallpaper?.name || 'Standaard'}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Vloer</h4>
                <div className="text-2xl text-center p-2 bg-white/50 rounded">
                  {equippedFloor?.emoji || '⬜'}
                </div>
                <p className="text-xs text-center text-gray-600">
                  {equippedFloor?.name || 'Standaard'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shop" className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Alle
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Items Grid */}
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const rarityConfig = RARITY_CONFIG[item.rarity];
                  const RarityIcon = rarityConfig.icon;
                  const canAfford = user.totalXpEver >= item.xpRequired;

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "relative overflow-hidden cursor-pointer transition-all hover:scale-105",
                        item.equipped && "ring-2 ring-primary",
                        !item.unlocked && "opacity-60"
                      )}
                      onClick={() => item.unlocked && handleEquipItem(item.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Item Display */}
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{item.emoji}</div>
                          <div className="flex-grow">
                            <h4 className="font-bold text-sm">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs">{item.xpRequired} XP</span>
                              <Badge variant="outline" className={cn("text-xs", rarityConfig.color)}>
                                <RarityIcon className="h-3 w-3 mr-1" />
                                {item.rarity}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between">
                          {!item.unlocked ? (
                            <div className="text-xs text-gray-500">
                              {canAfford ? 'Klik om te ontgrendelen!' : 'Meer XP nodig'}
                            </div>
                          ) : item.equipped ? (
                            <Badge variant="default" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Gebruikt
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              Gebruiken
                            </Button>
                          )}

                          <div className={cn(
                            "text-xs px-2 py-1 rounded",
                            item.unlocked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {item.unlocked ? '✓ Ontgrendeld' : '🔒 Vergrendeld'}
                          </div>
                        </div>
                      </CardContent>

                      {/* Equipped indicator */}
                      {item.equipped && (
                        <div className="absolute top-2 right-2 text-yellow-500">
                          <Crown className="h-4 w-4" />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Progress Summary */}
        <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
            <Palette className="h-4 w-4" />
            <span className="font-medium text-sm">Kamer Voortgang</span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <div className="font-bold text-amber-800">{items.filter(i => i.unlocked).length}</div>
              <div className="text-amber-600">Ontgrendeld</div>
            </div>
            <div>
              <div className="font-bold text-amber-800">{items.filter(i => i.equipped).length}</div>
              <div className="text-amber-600">Gebruikt</div>
            </div>
            <div>
              <div className="font-bold text-amber-800">{Math.floor((items.filter(i => i.unlocked).length / items.length) * 100)}%</div>
              <div className="text-amber-600">Compleet</div>
            </div>
            <div>
              <div className="font-bold text-amber-800">{items.filter(i => i.rarity === 'legendary' && i.unlocked).length}</div>
              <div className="text-amber-600">Legendarisch</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}