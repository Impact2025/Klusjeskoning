'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useApp } from '../AppProvider';
import type { BlogPost } from '@/lib/types';
import { storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

type BlogPostModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initial?: BlogPost | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const toDateInputValue = (timestamp?: Timestamp | null) =>
  timestamp ? format(timestamp.toDate(), 'yyyy-MM-dd') : '';

export default function BlogPostModal({ isOpen, setIsOpen, initial = null }: BlogPostModalProps) {
  const isEdit = Boolean(initial);
  const { createBlogPost, updateBlogPost } = useApp();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput]
  );

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setExcerpt('');
    setCoverImageUrl('');
    setContent('');
    setTagsInput('');
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
        setCoverImageUrl(initial.coverImageUrl ?? '');
        setContent(initial.content);
        setTagsInput(initial.tags.join(', '));
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

  const triggerCoverUpload = () => coverFileInputRef.current?.click();

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Bestand te groot', description: 'Kies een afbeelding kleiner dan 5 MB.' });
      return;
    }

    setIsUploadingCover(true);
    setCoverUploadProgress(0);

    try {
      const path = `blog-covers/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      const url = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setCoverUploadProgress(progress);
            console.log('Upload progress:', progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            } catch (err) {
              reject(err);
            }
          }
        );
      });

      setCoverImageUrl(url);
      toast({ title: 'Cover geüpload', description: 'De afbeelding is toegevoegd aan je artikel.' });
    } catch (error: any) {
      console.error('Cover upload failed', error);
      const errorMessage = error?.code === 'storage/unauthorized'
        ? 'Je hebt geen toestemming om afbeeldingen te uploaden. Controleer de Firebase Storage regels.'
        : 'Probeer het opnieuw of kies een andere afbeelding.';
      toast({ variant: 'destructive', title: 'Upload mislukt', description: errorMessage });
    } finally {
      setIsUploadingCover(false);
      setCoverUploadProgress(0);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCover = () => {
    setCoverImageUrl('');
    setCoverUploadProgress(0);
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!title || !slug || !excerpt || !content) {
      toast({ variant: 'destructive', title: 'Vul alle verplichte velden in' });
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
      coverImageUrl: coverImageUrl || null,
      tags,
      status,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      publishedAt: publishTimestamp,
    };

    if (isEdit && initial) {
      await updateBlogPost(initial.id, payload);
    } else {
      await createBlogPost(payload);
    }

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-brand text-2xl">{isEdit ? 'Blogpost bewerken' : 'Nieuwe blogpost'}</DialogTitle>
          <DialogDescription>Vul de details in voor je blogartikel.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="blog-title">Titel</Label>
            <Input id="blog-title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Titel van het artikel" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blog-slug">Slug</Label>
            <Input id="blog-slug" value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="voorbeeld-titel" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blog-excerpt">Samenvatting</Label>
            <Textarea id="blog-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Korte introductie (max. 2-3 zinnen)" rows={3} />
          </div>
          <div className="grid gap-2">
            <Label>Cover afbeelding</Label>
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
              {coverImageUrl ? (
                <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center text-slate-500">
                  <span className="text-sm font-medium">Nog geen cover geüpload</span>
                  <span className="text-xs">Upload een afbeelding of plak een bestaande URL.</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" size="sm" onClick={triggerCoverUpload} disabled={isUploadingCover} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploaden…
                    </>
                  ) : (
                    'Upload afbeelding'
                  )}
                </Button>
                {coverImageUrl && (
                  <Button type="button" size="sm" variant="outline" onClick={handleRemoveCover}>
                    Verwijder cover
                  </Button>
                )}
                {isUploadingCover && (
                  <span className="text-xs font-semibold text-primary">{coverUploadProgress}%</span>
                )}
              </div>
              <Input
                id="blog-cover-url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://voorbeeld.nl/afbeelding.jpg"
                disabled={isUploadingCover}
              />
              <p className="text-xs text-slate-500">Ondersteunt JPG, PNG of WEBP tot 5 MB. Afbeeldingen worden opgeslagen in Firebase Storage.</p>
            </div>
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverFileChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blog-tags">Tags</Label>
            <Input id="blog-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="klusjes, motivatie, gezin" />
          </div>
          <div className="grid gap-2">
            <Label>Content</Label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Gebruik koppen, lijsten, links en afbeeldingen…" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blog-publish-date">Publicatiedatum</Label>
            <Input
              id="blog-publish-date"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              disabled={status !== 'published'}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blog-status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'draft' | 'published')}>
              <SelectTrigger id="blog-status">
                <SelectValue placeholder="Kies status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Concept</SelectItem>
                <SelectItem value="published">Gepubliceerd</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Bepaal of dit artikel al zichtbaar is voor bezoekers.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blog-seo-title">SEO titel</Label>
            <Input id="blog-seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Titel voor zoekmachines (optioneel)" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blog-seo-description">SEO omschrijving</Label>
            <Textarea
              id="blog-seo-description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Korte beschrijving voor zoekresultaten"
              rows={2}
            />
          </div>
          </div>
        </ScrollArea>
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
