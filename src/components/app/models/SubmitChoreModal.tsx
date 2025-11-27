'use client';
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Camera, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type SubmitChoreModalProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    choreId: string | null;
    onSubmissionStart?: (choreId: string) => void;
    onSubmissionSuccess?: (choreId: string) => void;
    onSubmissionError?: (choreId: string) => void;
    onModalClose?: (choreId: string | null) => void;
};

const emotions = ['😫', '😕', '🙂', '😁', '😎'];

export default function SubmitChoreModal({
  isOpen,
  setIsOpen,
  choreId,
  onSubmissionStart,
  onSubmissionSuccess,
  onSubmissionError,
  onModalClose
}: SubmitChoreModalProps) {
  const { family, submitChoreForApproval } = useApp();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Find chore in family chores
  const chore = family?.chores.find(c => c.id === choreId);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetState = () => {
    setSelectedEmotion(null);
    resetPhoto();
    setIsSubmitting(false);
  };
  
  const handleFullClose = () => {
    if(isSubmitting) return;
    setIsOpen(false);
    resetState();
    onModalClose?.(choreId);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!choreId || !selectedEmotion) {
        toast({ variant: "destructive", title: "Oeps!", description: "Kies hoe je je voelde bij dit klusje." });
        return;
    }

    setIsSubmitting(true);
    onSubmissionStart?.(choreId);
    try {
      await submitChoreForApproval(choreId, selectedEmotion, photoFile);
      toast({ title: "Goed gedaan!", description: "Klusje ingediend voor goedkeuring." });
      setIsOpen(false);
      resetState();
      onSubmissionSuccess?.(choreId);
    } catch (err) {
      console.error("Submission failed", err);
      toast({ variant: "destructive", title: "Fout bij indienen", description: (err as Error)?.message || "Kon het klusje niet indienen." });
      setIsSubmitting(false);
      onSubmissionError?.(choreId);
    }
  };

  if (!chore) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleFullClose}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">{chore.name}</DialogTitle>
          <DialogDescription>Goed gedaan! Maak of upload een foto als bewijs en laat zien hoe je je voelt.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-6">
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {!photoPreview ? (
                <div className="text-center text-gray-500 p-4">
                   <Camera className="h-10 w-10 mx-auto mb-2" />
                   <p>Voeg een foto toe als bewijs.</p>
                </div>
              ) : (
                  <img src={photoPreview} alt="Chore proof" className="object-contain h-full w-full" />
              )}
              <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect}
                  className="hidden" 
              />
            </div>
            
            <div className="flex justify-center">
              {!photoPreview ? (
                   <Button type="button" onClick={() => fileInputRef.current?.click()}><Camera className="mr-2 h-4 w-4" /> Upload Foto</Button>
              ) : (
                  <Button type="button" onClick={resetPhoto} variant="outline"><RefreshCcw className="mr-2 h-4 w-4" /> Opnieuw</Button>
              )}
            </div>
            
            <div>
              <p className="font-bold mb-2">Hoe voelde je je bij dit klusje?</p>
              <div className="flex justify-around text-4xl">
                {emotions.map(emotion => (
                  <button 
                    type="button"
                    key={emotion} 
                    onClick={() => setSelectedEmotion(emotion)}
                    className={cn("transform hover:scale-125 transition rounded-full p-1", selectedEmotion === emotion && "bg-yellow-200")}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="outline" onClick={handleFullClose} disabled={isSubmitting}>Annuleren</Button>
            <Button type="submit" className="bg-success hover:bg-success/90 text-white" disabled={isSubmitting || !selectedEmotion}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSubmitting ? 'Bezig...' : 'Indienen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
