'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sticker, Sparkles, Gift, Star, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface StickerItem {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  imageUrl?: string;
  isGlitter: boolean;
  unlockedAt?: Date;
}

interface StickerPack {
  id: string;
  name: string;
  cost: number;
  stickers: StickerItem[];
}

interface StickerAlbumProps {
  childId: string;
  className?: string;
}

const RARITY_CONFIG = {
  common: { color: 'text-gray-600 border-gray-300 bg-gray-50', icon: Star },
  rare: { color: 'text-blue-600 border-blue-400 bg-blue-50', icon: Sparkles },
  epic: { color: 'text-purple-600 border-purple-500 bg-purple-50', icon: Crown },
  legendary: { color: 'text-yellow-600 border-yellow-500 bg-yellow-50', icon: Zap },
};

const STICKER_PACKS: StickerPack[] = [
  {
    id: 'basic_pack',
    name: 'Basis Pakket',
    cost: 25,
    stickers: [] // Will be filled by API
  },
  {
    id: 'premium_pack',
    name: 'Premium Pakket',
    cost: 50,
    stickers: [] // Will be filled by API
  },
  {
    id: 'legendary_pack',
    name: 'Legendarisch Pakket',
    cost: 100,
    stickers: [] // Will be filled by API
  }
];

export default function StickerAlbum({ childId, className }: StickerAlbumProps) {
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<StickerPack | null>(null);
  const [isOpeningPack, setIsOpeningPack] = useState(false);
  const [newSticker, setNewSticker] = useState<StickerItem | null>(null);
  const [showNewSticker, setShowNewSticker] = useState(false);
  const [activeTab, setActiveTab] = useState('album');

  useEffect(() => {
    loadStickers();
  }, [childId]);

  const loadStickers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/stickers?childId=${childId}`);
      if (response.ok) {
        const data = await response.json();
        setStickers(data.stickers || []);
      } else {
        console.error('Failed to load stickers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading stickers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openPack = async (pack: StickerPack) => {
    if (isOpeningPack) return;

    setIsOpeningPack(true);
    setSelectedPack(pack);

    try {
      const response = await fetch('/api/stickers/open-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, packId: pack.id }),
      });

      if (response.ok) {
        const data = await response.json();
        const sticker = data.sticker;

        // Add to collection
        setStickers(prev => [...prev, sticker]);
        setNewSticker(sticker);
        setShowNewSticker(true);

        // Confetti for rare stickers
        if (sticker.rarity === 'epic' || sticker.rarity === 'legendary') {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
          });
        } else if (sticker.rarity === 'rare') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        }

        // Hide after 3 seconds
        setTimeout(() => {
          setShowNewSticker(false);
          setNewSticker(null);
        }, 3000);

      } else {
        const error = await response.json();
        console.error('Failed to open pack:', error);
        alert(error.error || 'Er ging iets mis bij het openen van het pakket.');
      }
    } catch (error) {
      console.error('Error opening pack:', error);
      alert('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsOpeningPack(false);
      setSelectedPack(null);
    }
  };

  const getStickersByCategory = (category: string) => {
    return stickers.filter(sticker => sticker.category === category);
  };

  const getCollectionProgress = () => {
    const totalStickers = 100; // Example total
    const uniqueStickers = new Set(stickers.map(s => s.id)).size;
    return (uniqueStickers / totalStickers) * 100;
  };

  const categories = ['dieren', 'sprookjes', 'ruimte', 'sport', 'voertuigen', 'eten'];

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 via-purple-400/10 to-blue-400/10" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Sticker className="h-5 w-5 text-pink-500" />
          Sticker Album
          <Sticker className="h-5 w-5 text-pink-500" />
        </CardTitle>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="text-center">
            <div className="text-sm text-gray-600">Verzameld</div>
            <div className="font-bold">{stickers.length} stickers</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Voortgang</div>
            <div className="w-24">
              <Progress value={getCollectionProgress()} className="h-2" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(getCollectionProgress())}% compleet
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="album">Album</TabsTrigger>
            <TabsTrigger value="packs">Packs</TabsTrigger>
          </TabsList>

          <TabsContent value="album" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="grid grid-cols-2 gap-4">
                {categories.map(category => {
                  const categoryStickers = getStickersByCategory(category);
                  const totalSlots = 20; // Example slots per category

                  return (
                    <Card key={category} className="p-3">
                      <h3 className="font-bold text-sm mb-2 capitalize">{category}</h3>
                      <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: totalSlots }).map((_, index) => {
                          const sticker = categoryStickers[index];
                          const rarity = sticker?.rarity || 'common';
                          const RarityIcon = RARITY_CONFIG[rarity].icon;

                          return (
                            <div
                              key={index}
                              className={cn(
                                "aspect-square rounded border-2 flex items-center justify-center text-xs relative",
                                sticker
                                  ? RARITY_CONFIG[rarity].color
                                  : "border-gray-200 bg-gray-50"
                              )}
                            >
                              {sticker ? (
                                <>
                                  <RarityIcon className="h-3 w-3" />
                                  {sticker.isGlitter && (
                                    <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-yellow-400 animate-pulse" />
                                  )}
                                </>
                              ) : (
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="packs" className="space-y-4">
            <div className="grid gap-3">
              {STICKER_PACKS.map(pack => (
                <Card key={pack.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{pack.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{pack.cost} punten</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => openPack(pack)}
                      disabled={isOpeningPack}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      {isOpeningPack && selectedPack?.id === pack.id ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Openen...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Open Pakket
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* New Sticker Celebration */}
        {showNewSticker && newSticker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <Card className="p-6 text-center max-w-sm mx-4 animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Nieuwe Sticker!</h2>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold mb-4",
                RARITY_CONFIG[newSticker.rarity].color
              )}>
                {(() => {
                  const IconComponent = RARITY_CONFIG[newSticker.rarity].icon;
                  return <IconComponent className="h-5 w-5" />;
                })()}
                {newSticker.name}
                {newSticker.isGlitter && <Sparkles className="h-4 w-4 animate-pulse" />}
              </div>
              <Badge variant="outline" className={cn(RARITY_CONFIG[newSticker.rarity].color)}>
                {newSticker.rarity}
              </Badge>
            </Card>
          </div>
        )}

        {/* Pack Opening Animation */}
        {isOpeningPack && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="text-center">
              <div className="text-6xl animate-bounce">📦</div>
              <div className="text-xl font-bold mt-4 animate-pulse">Pakket openen...</div>
              <div className="flex justify-center mt-4">
                <Sparkles className="h-8 w-8 animate-spin text-yellow-400" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}