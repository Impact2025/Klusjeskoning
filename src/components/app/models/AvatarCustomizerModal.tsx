'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Crown, Sparkles } from 'lucide-react';
import { avatarItems, getRarityColor, getRarityBgColor } from '@/lib/avatar-items';
import { AvatarItemType } from '@/lib/types';
import { cn } from '@/lib/utils';

type AvatarCustomizerModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function AvatarCustomizerModal({ isOpen, setIsOpen }: AvatarCustomizerModalProps) {
  const { user, unlockAvatarItem, equipAvatarItem } = useApp();
  const [selectedTab, setSelectedTab] = useState<AvatarItemType>('accessory');

  if (!user) return null;

  const filteredItems = avatarItems.filter(item => item.type === selectedTab);
  const userCustomizations = user.avatarCustomizations || [];

  const isItemUnlocked = (itemId: string) => {
    return userCustomizations.some(cust => cust.itemId === itemId);
  };

  const isItemEquipped = (itemId: string) => {
    return userCustomizations.some(cust => cust.itemId === itemId && cust.isEquipped);
  };

  const handleUnlockItem = async (itemId: string) => {
    const item = avatarItems.find(i => i.id === itemId);
    if (!item || user.xp < item.xpRequired) return;

    await unlockAvatarItem(itemId);
  };

  const handleEquipItem = async (itemId: string) => {
    // First unequip all items of the same type
    const sameTypeItems = userCustomizations.filter(
      cust => avatarItems.find(item => item.id === cust.itemId)?.type === selectedTab && cust.isEquipped
    );

    for (const cust of sameTypeItems) {
      await equipAvatarItem(cust.itemId, false);
    }

    // Then equip the selected item
    await equipAvatarItem(itemId, true);
  };

  const getEquippedItemForType = (type: AvatarItemType) => {
    const equipped = userCustomizations.find(
      cust => avatarItems.find(item => item.id === cust.itemId)?.type === type && cust.isEquipped
    );
    return equipped ? avatarItems.find(item => item.id === equipped.itemId) : null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="h-[90vh] max-w-4xl p-0 flex flex-col animate-slide-in-bottom">
        <DialogHeader className="p-4 border-b-2">
          <DialogTitle className="font-brand text-2xl text-primary flex items-center">
            <Sparkles className="mr-2" /> Avatar Aanpassen
          </DialogTitle>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-500 h-4 w-4" />
              <span className="font-bold">{user.xp} XP</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Level {Math.floor(user.totalXpEver / 100) + 1}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-grow flex">
          {/* Avatar Preview */}
          <div className="w-1/3 p-4 border-r-2 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="text-center">
              <h3 className="font-bold text-lg mb-4">Jouw Avatar</h3>
              <div className="relative w-32 h-32 mx-auto mb-4">
                {/* Background */}
                {(() => {
                  const bgItem = getEquippedItemForType('background');
                  return bgItem ? (
                    <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg"
                         style={{ background: `url(${bgItem.imageUrl})`, backgroundSize: 'cover' }} />
                  ) : (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-white shadow-lg" />
                  );
                })()}

                {/* Base Avatar */}
                <div className="absolute inset-2 flex items-center justify-center text-4xl">
                  {user.avatar}
                </div>

                {/* Outfit Overlay */}
                {(() => {
                  const outfitItem = getEquippedItemForType('outfit');
                  return outfitItem && (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-80">
                      {/* Placeholder for outfit visual */}
                      <Crown className="text-yellow-400" />
                    </div>
                  );
                })()}

                {/* Accessory Overlay */}
                {(() => {
                  const accessoryItem = getEquippedItemForType('accessory');
                  return accessoryItem && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl">
                      {/* Placeholder for accessory visual */}
                      <Star className="text-yellow-400" />
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Achtergrond:</span>
                  <span className="font-medium">
                    {getEquippedItemForType('background')?.name || 'Standaard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kleding:</span>
                  <span className="font-medium">
                    {getEquippedItemForType('outfit')?.name || 'Standaard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Accessoire:</span>
                  <span className="font-medium">
                    {getEquippedItemForType('accessory')?.name || 'Geen'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="flex-grow p-4">
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as AvatarItemType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="accessory">Accessoires</TabsTrigger>
                <TabsTrigger value="outfit">Kleding</TabsTrigger>
                <TabsTrigger value="background">Achtergronden</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map((item) => {
                      const unlocked = isItemUnlocked(item.id);
                      const equipped = isItemEquipped(item.id);
                      const canAfford = user.xp >= item.xpRequired;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all cursor-pointer",
                            getRarityBgColor(item.rarity),
                            equipped ? 'ring-2 ring-primary' : '',
                            unlocked ? 'hover:scale-105' : 'opacity-60'
                          )}
                        >
                          <div className="text-center space-y-2">
                            <div className="text-3xl">
                              {/* Placeholder icons based on item type */}
                              {item.type === 'accessory' && <Star className="text-yellow-400" />}
                              {item.type === 'outfit' && <Crown className="text-purple-400" />}
                              {item.type === 'background' && <Sparkles className="text-blue-400" />}
                            </div>

                            <h4 className="font-bold text-sm">{item.name}</h4>

                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs font-medium">{item.xpRequired} XP</span>
                            </div>

                            <Badge variant="outline" className={cn("text-xs", getRarityColor(item.rarity))}>
                              {item.rarity}
                            </Badge>

                            <div className="flex gap-1">
                              {!unlocked ? (
                                <Button
                                  size="sm"
                                  disabled={!canAfford}
                                  onClick={() => handleUnlockItem(item.id)}
                                  className="text-xs h-7"
                                >
                                  {canAfford ? 'Ontgrendelen' : 'Te weinig XP'}
                                </Button>
                              ) : equipped ? (
                                <Badge variant="default" className="text-xs h-7 px-2">
                                  Aangehad
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEquipItem(item.id)}
                                  className="text-xs h-7"
                                >
                                  Aandoen
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="p-4 border-t-2">
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Klaar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}