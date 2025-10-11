'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { topRewards } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Medal } from 'lucide-react';
import ChildSelector from '../ChildSelector';
import { useToast } from '@/hooks/use-toast';
import type { RewardType } from '@/lib/types';

type TopRewardsModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

type SelectedReward = { name: string; points: number; type: RewardType };

export default function TopRewardsModal({ isOpen, setIsOpen }: TopRewardsModalProps) {
    const { addReward, family } = useApp();
    const [selectedRewards, setSelectedRewards] = useState<SelectedReward[]>([]);
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [isEveryone, setIsEveryone] = useState(true);
    const { toast } = useToast();

    const handleRewardToggle = (reward: SelectedReward, checked: boolean) => {
        if (checked) {
            setSelectedRewards([...selectedRewards, reward]);
        } else {
            setSelectedRewards(selectedRewards.filter(r => r.name !== reward.name));
        }
    };
    
    if (!family) return null;

    const handleAddSelected = async () => {
        if (selectedRewards.length === 0) {
            toast({ variant: 'destructive', title: 'Fout', description: 'Selecteer ten minste één beloning.' });
            return;
        }
        if (!isEveryone && selectedChildren.length === 0) {
            toast({ variant: 'destructive', title: 'Selecteer een kind', description: 'Wijs de beloningen toe aan "Iedereen" of selecteer ten minste één kind.' });
            return;
        }
        
        const assignedTo = isEveryone ? [] : selectedChildren;
        for (const reward of selectedRewards) {
            await addReward(reward.name, reward.points, reward.type, assignedTo);
        }
        
        toast({ title: 'Succes!', description: `${selectedRewards.length} beloning(en) toegevoegd.` });
        setSelectedRewards([]);
        setSelectedChildren([]);
        setIsEveryone(true);
        setIsOpen(false);
    };

    const renderRewardCategory = (title: string, rewards: SelectedReward[]) => (
        <div key={title}>
            <h4 className="font-bold text-lg mb-2">{title}</h4>
            <div className="space-y-2">
                {rewards.map((reward) => (
                    <Label key={reward.name} className="flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <Checkbox
                            className="mr-4 h-5 w-5"
                            onCheckedChange={(checked) => handleRewardToggle(reward, !!checked)}
                        />
                        <p><b>{reward.points} ptn:</b> {reward.name}</p>
                    </Label>
                ))}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-brand text-2xl text-teal-600 flex items-center">
                        <Medal className="mr-2" /> Top Beloningen
                    </DialogTitle>
                    <DialogDescription>Selecteer beloningen uit de lijst om snel toe te voegen.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow pr-4 -mr-4">
                    <div className="space-y-4">
                        {renderRewardCategory('🎁 Tijd met elkaar', topRewards.tijd)}
                        {renderRewardCategory('❤️ Goed doel', topRewards.goedDoel)}
                        {renderRewardCategory('💰 Zakgeld (optioneel)', topRewards.zakgeld)}
                        {renderRewardCategory('🎮 Extra privileges', topRewards.privileges)}
                    </div>
                </ScrollArea>
                <div className="mt-4">
                   <ChildSelector children={family.children} selectedChildren={selectedChildren} setSelectedChildren={setSelectedChildren} isEveryone={isEveryone} setIsEveryone={setIsEveryone} />
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Sluiten</Button>
                    <Button onClick={handleAddSelected} className="bg-success hover:bg-success/90">Selectie Toevoegen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
