
'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

type AddGoodCauseModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
};

export default function AddGoodCauseModal({ isOpen, setIsOpen }: AddGoodCauseModalProps) {
  const { addGoodCause } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setDateRange(undefined);
  }

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  }

  const handleAdd = () => {
    if (!name || !description || !dateRange?.from || !dateRange?.to) {
      toast({ variant: "destructive", title: "Ongeldige invoer", description: "Vul alle velden in, inclusief een start- en einddatum." });
      return;
    }

    const newCause = {
        name,
        description,
        startDate: Timestamp.fromDate(dateRange.from),
        endDate: Timestamp.fromDate(dateRange.to),
    };
    
    addGoodCause(newCause);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">Goed Doel Toevoegen</DialogTitle>
          <DialogDescription>Voeg een nieuw goed doel toe dat kinderen kunnen steunen.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cause-name">Naam</Label>
            <Input id="cause-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam van het goede doel"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cause-description">Beschrijving</Label>
            <Textarea id="cause-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Korte beschrijving van het doel"/>
          </div>
           <div className="space-y-2">
              <Label>Actieve Periode</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd LLL, yy", { locale: nl })} -{" "}
                          {format(dateRange.to, "dd LLL, yy", { locale: nl })}
                        </>
                      ) : (
                        format(dateRange.from, "dd LLL, yy", { locale: nl })
                      )
                    ) : (
                      <span>Kies een periode</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={nl}
                  />
                </PopoverContent>
              </Popover>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Annuleren</Button>
          <Button onClick={handleAdd}>Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
