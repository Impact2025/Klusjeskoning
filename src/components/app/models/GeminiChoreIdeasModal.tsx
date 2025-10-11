'use client';
import { useEffect, useState, useTransition } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2 } from 'lucide-react';
import ChildSelector from '../ChildSelector';
import { useToast } from '@/hooks/use-toast';
import { generateChoreIdeas, type GenerateChoreIdeasOutput } from '@/ai/flows/generate-chore-ideas-flow';

type GeminiChoreIdeasModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

type SelectedChore = GenerateChoreIdeasOutput[number];

export default function GeminiChoreIdeasModal({ isOpen, setIsOpen }: GeminiChoreIdeasModalProps) {
    const { addChore, family, canAccessFeature } = useApp();
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<GenerateChoreIdeasOutput>([]);
    const [selectedChores, setSelectedChores] = useState<SelectedChore[]>([]);
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [isEveryone, setIsEveryone] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const aiEnabled = family ? canAccessFeature('aiHelper') : false;

    useEffect(() => {
        if (isOpen && (!family || !aiEnabled)) {
            toast({ variant: 'destructive', title: 'Premium nodig', description: 'De AI-klusassistent is onderdeel van Gezin+.' });
            setIsOpen(false);
        }
    }, [aiEnabled, family, isOpen, setIsOpen, toast]);

    if (!family || !aiEnabled) return null;

    const handleGenerate = () => {
        if (!prompt) return;
        startTransition(async () => {
            setResults([]);
            try {
                const ideas = await generateChoreIdeas({ keyword: prompt });
                setResults(ideas);
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Fout', description: 'Kon geen ideeën genereren.' });
            }
        });
    };

    const handleChoreToggle = (chore: SelectedChore, checked: boolean) => {
        if (checked) {
            setSelectedChores([...selectedChores, chore]);
        } else {
            setSelectedChores(selectedChores.filter(c => c.name !== chore.name));
        }
    };

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
        setResults([]);
        setPrompt('');
        setSelectedChores([]);
        setSelectedChildren([]);
        setIsEveryone(true);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-brand text-2xl text-purple-600 flex items-center">
                        <Sparkles className="mr-2" /> Klusjes Assistent
                    </DialogTitle>
                    <DialogDescription>Geef een trefwoord (bv. "badkamer", "tuin", "10-jarige") en de AI bedenkt klusjes voor je.</DialogDescription>
                </DialogHeader>
                
                <div className="flex mb-4">
                    <Input 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        placeholder="Trefwoord..." 
                        onKeyUp={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <Button onClick={handleGenerate} disabled={isPending} className="ml-2 bg-purple-500 hover:bg-purple-600">
                        {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    </Button>
                </div>
                
                <ScrollArea className="flex-grow border-t pt-4 pr-4 -mr-4">
                    {isPending ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-2">
                            {results.map((chore) => (
                                <Label key={chore.name} className="flex items-start p-3 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">
                                    <Checkbox
                                        className="mr-4 mt-1 h-5 w-5 flex-shrink-0"
                                        onCheckedChange={(checked) => handleChoreToggle(chore, !!checked)}
                                    />
                                    <div>
                                        <p className="font-bold">{chore.name}</p>
                                        <p className="text-sm text-yellow-600 font-bold">{chore.points} punten</p>
                                    </div>
                                </Label>
                            ))}
                        </div>
                    ) : (
                         <p className="text-gray-500 italic text-center">De suggesties verschijnen hier.</p>
                    )}
                </ScrollArea>
                
                {results.length > 0 && (
                    <div className="mt-4">
                       <ChildSelector children={family.children} selectedChildren={selectedChildren} setSelectedChildren={setSelectedChildren} isEveryone={isEveryone} setIsEveryone={setIsEveryone} />
                    </div>
                )}
                
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Annuleren</Button>
                    {results.length > 0 && <Button onClick={handleAddSelected} className="bg-green-500 hover:bg-green-600">Selectie Toevoegen</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
