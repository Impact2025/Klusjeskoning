'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { topChores } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ListOrdered } from 'lucide-react';
import ChildSelector from '../ChildSelector';
import { useToast } from '@/hooks/use-toast';

type TopChoresModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

type SelectedChore = { name: string; points: number; };

export default function TopChoresModal({ isOpen, setIsOpen }: TopChoresModalProps) {
    const { addChore, family } = useApp();
    const [selectedChores, setSelectedChores] = useState<SelectedChore[]>([]);
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [isEveryone, setIsEveryone] = useState(true);
    const { toast } = useToast();

    const handleChoreToggle = (chore: SelectedChore, checked: boolean) => {
        if (checked) {
            setSelectedChores([...selectedChores, chore]);
        } else {
            setSelectedChores(selectedChores.filter(c => c.name !== chore.name));
        }
    };
    
    if (!family) return null;

    const handleAddSelected = async () => {
        if (selectedChores.length === 0) {
            toast({ variant: 'destructive', title: 'Fout', description: 'Selecteer ten minste één klusje.' });
            return;
        }
        if (!isEveryone && selectedChildren.length === 0) {
            toast({ variant: 'destructive', title: 'Selecteer een kind', description: 'Wijs de klusjes toe aan "Iedereen" of selecteer ten minste één kind.' });
            return;
        }

        const assignedTo = isEveryone ? [] : selectedChildren;
        for (const chore of selectedChores) {
            await addChore(chore.name, chore.points, assignedTo);
        }
        
        toast({ title: 'Succes!', description: `${selectedChores.length} klusje(s) toegevoegd.` });
        setSelectedChores([]);
        setSelectedChildren([]);
        setIsEveryone(true);
        setIsOpen(false);
    };

    const renderChoreCategory = (title: string, chores: SelectedChore[]) => (
        <div key={title}>
            <h4 className="font-bold text-lg mb-2">{title}</h4>
            <div className="space-y-2">
                {chores.map((chore) => (
                    <Label key={chore.name} className="flex items-start p-3 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <Checkbox
                            className="mr-4 mt-1 h-5 w-5 flex-shrink-0"
                            onCheckedChange={(checked) => handleChoreToggle(chore, !!checked)}
                        />
                        <div>
                            <p className="font-bold">{chore.name} → {chore.points} ptn</p>
                            <p className="text-sm text-gray-600">{(chore as any).description}</p>
                        </div>
                    </Label>
                ))}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-brand text-2xl text-blue-600 flex items-center">
                        <ListOrdered className="mr-2" /> Top 10 Klusjes (8-12 jaar)
                    </DialogTitle>
                    <DialogDescription>Selecteer klusjes uit de lijst om snel toe te voegen.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow pr-4 -mr-4">
                    <div className="space-y-4">
                        {renderChoreCategory('🏠 Binnen', topChores.binnen)}
                        {renderChoreCategory('🌳 Buiten', topChores.buiten)}
                        {renderChoreCategory('🐶 Zorg', topChores.zorg)}
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
