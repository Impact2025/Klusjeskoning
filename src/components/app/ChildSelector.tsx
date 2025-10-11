'use client'
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Child } from "@/lib/types";

type ChildSelectorProps = {
  children: Child[];
  selectedChildren: string[];
  setSelectedChildren: (ids: string[]) => void;
  isEveryone,
  setIsEveryone: (isEveryone: boolean) => void;
};

export default function ChildSelector({ children, selectedChildren, setSelectedChildren, isEveryone, setIsEveryone }: ChildSelectorProps) {

  const handleEveryoneChange = (checked: boolean) => {
    setIsEveryone(checked);
    if (checked) {
      setSelectedChildren([]);
    }
  };

  const handleChildChange = (childId: string, checked: boolean) => {
    if (checked) {
      setSelectedChildren([...selectedChildren, childId]);
    } else {
      setSelectedChildren(selectedChildren.filter(id => id !== childId));
    }
    setIsEveryone(false);
  };

  return (
    <div>
        <h4 className="font-bold mb-2 mt-2 text-gray-700">Toewijzen aan:</h4>
        <ScrollArea className="h-32 p-2 bg-gray-50 rounded-lg border">
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="everyone" checked={isEveryone} onCheckedChange={handleEveryoneChange} />
                    <Label htmlFor="everyone" className="font-bold">Iedereen</Label>
                </div>
                {children.map(child => (
                    <div key={child.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={child.id} 
                            checked={selectedChildren.includes(child.id)}
                            onCheckedChange={(checked) => handleChildChange(child.id, !!checked)}
                            disabled={isEveryone}
                        />
                        <Label htmlFor={child.id}>{child.name}</Label>
                    </div>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
