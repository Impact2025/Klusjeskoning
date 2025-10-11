'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import { useApp } from '../AppProvider';
import type { Review } from '@/lib/types';

type ReviewModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initial?: Review | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const toDateInputValue = (timestamp?: Timestamp | null) =>
  timestamp ? timestamp.toDate().toISOString().split('T')[0] : '';

export default function ReviewModal({ isOpen, setIsOpen, initial = null }: ReviewModalProps) {
  const isEdit = Boolean(initial);
  const { createReview, updateReview } = useApp();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setRating(5);
    setAuthor('');
    setSeoTitle('');
    setSeoDescription('');
    setPublishDate('');
    setStatus('draft');
    setSlugManuallyEdited(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        setTitle(initial.title);
        setSlug(initial.slug);
        setExcerpt(initial.excerpt);
        setContent(initial.content);
        setRating(initial.rating);
        setAuthor(initial.author);
        setSeoTitle(initial.seoTitle ?? '');
        setSeoDescription(initial.seoDescription ?? '');
        setPublishDate(toDateInputValue(initial.publishedAt));
        setStatus(initial.status);
        setSlugManuallyEdited(true);
      } else {
        resetForm();
      }
    }
  }, [initial, isOpen]);

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(value));
  };

  const handleSubmit = async () => {
    if (!title || !slug || !excerpt || !content || !author) {
      toast({ variant: 'destructive', title: 'Vul alle verplichte velden in' });
      return;
    }

    if (rating < 1 || rating > 5) {
      toast({ variant: 'destructive', title: 'Rating moet tussen 1 en 5 liggen' });
      return;
    }

    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      toast({ variant: 'destructive', title: 'Slug ongeldig' });
      return;
    }

    const publishTimestamp =
      status === 'published'
        ? publishDate
          ? Timestamp.fromDate(new Date(publishDate))
          : initial?.publishedAt ?? Timestamp.now()
        : null;

    const payload = {
      title,
      slug: normalizedSlug,
      excerpt,
      content,
      rating,
      author,
      status,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      publishedAt: publishTimestamp,
    };

    if (isEdit && initial) {
      await updateReview(initial.id, payload);
    } else {
      await createReview(payload);
    }

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">{isEdit ? 'Review bewerken' : 'Nieuwe review'}</DialogTitle>
          <DialogDescription>Deel ervaringen en beoordelingen met het KlusjesKoning publiek.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="review-title">Titel</Label>
            <Input id="review-title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Titel van de review" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-slug">Slug</Label>
            <Input id="review-slug" value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="voorbeeld-review" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-excerpt">Samenvatting</Label>
            <Textarea id="review-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Korte quote of teaser" rows={3} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-content">Content</Label>
            <Textarea id="review-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Schrijf de volledige review" rows={8} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="review-rating">Rating (1-5)</Label>
              <Input
                id="review-rating"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-author">Auteur</Label>
              <Input id="review-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Naam van de reviewer" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-publish-date">Publicatiedatum</Label>
            <Input
              id="review-publish-date"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              disabled={status !== 'published'}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'draft' | 'published')}>
              <SelectTrigger id="review-status">
                <SelectValue placeholder="Kies status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Concept</SelectItem>
                <SelectItem value="published">Gepubliceerd</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Zet de review live voor bezoekers wanneer deze klaar is.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-seo-title">SEO titel</Label>
            <Input id="review-seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO titel (optioneel)" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-seo-description">SEO omschrijving</Label>
            <Textarea
              id="review-seo-description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Korte SEO omschrijving"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuleren
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Bijwerken' : 'Opslaan'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
