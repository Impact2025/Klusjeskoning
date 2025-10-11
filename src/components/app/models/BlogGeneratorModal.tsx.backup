'use client';

import { useMemo, useState, useTransition } from 'react';
import { Sparkles, Loader2, Copy, Save } from 'lucide-react';

import { type GenerateBlogArticleOutput, generateBlogArticle } from '@/ai/flows/generate-blog-article-flow';
import { AUDIENCE_SEGMENTS, BLOG_CATEGORIES, type AudienceSegment, type BlogCategory } from '@/lib/blog/constants';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '../AppProvider';

type BlogGeneratorModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const defaultCategory = BLOG_CATEGORIES[0];
const defaultAudience = AUDIENCE_SEGMENTS[0];

export default function BlogGeneratorModal({ isOpen, setIsOpen }: BlogGeneratorModalProps) {
  const [category, setCategory] = useState<BlogCategory>(defaultCategory);
  const [audience, setAudience] = useState<AudienceSegment>(defaultAudience);
  const [customFocus, setCustomFocus] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('klusjes voor kinderen');
  const [extraKeywords, setExtraKeywords] = useState('beloningssysteem, gezinsapp');
  const [toneOfVoice, setToneOfVoice] = useState('warm, praktisch, betrouwbaar');
  const [targetAudience, setTargetAudience] = useState('ouders met kinderen van 6 tot 13 jaar');
  const [writingStyle, setWritingStyle] = useState('blogartikel');
  const [result, setResult] = useState<GenerateBlogArticleOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { createBlogPost } = useApp();

  const finalBlock = useMemo(() => {
    if (!result) return '';
    const seo = result.seo_json;
    return `1️⃣ article_html\n${result.article_html}\n\n2️⃣ seo_json\n${JSON.stringify(seo, null, 2)}\n\n3️⃣ midjourney_prompt\n${result.midjourney_prompt}`;
  }, [result]);

  const handleClose = (open: boolean) => {
    if (!open) {
      setCustomFocus('');
      setPrimaryKeyword('klusjes voor kinderen');
      setExtraKeywords('beloningssysteem, gezinsapp');
      setToneOfVoice('warm, praktisch, betrouwbaar');
      setTargetAudience('ouders met kinderen van 6 tot 13 jaar');
      setWritingStyle('blogartikel');
      setResult(null);
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const handleGenerate = () => {
    if (!primaryKeyword.trim() || !toneOfVoice.trim() || !targetAudience.trim() || !writingStyle.trim()) {
      toast({ variant: 'destructive', title: 'Ontbrekende velden', description: 'Vul minimaal keyword, toon, doelgroep en stijl in.' });
      return;
    }

    startTransition(async () => {
      try {
        const output = await generateBlogArticle({
          category,
          audienceSegment: audience,
          primaryKeyword: primaryKeyword.trim(),
          extraKeywords: extraKeywords.trim(),
          toneOfVoice: toneOfVoice.trim(),
          targetAudience: targetAudience.trim(),
          writingStyle: writingStyle.trim(),
          customFocus: customFocus.trim() || undefined,
        });
        setResult(output);
        toast({ title: 'Blog gegenereerd', description: 'Kopieer het artikel of pas het aan naar wens.' });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Genereren mislukt', description: 'Probeer het nog eens of pas de instructies aan.' });
      }
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: `${label} gekopieerd` }))
      .catch(() => toast({ variant: 'destructive', title: 'Kopiëren mislukt' }));
  };

  const handleSaveAsBlogPost = async () => {
    if (!result) {
      toast({ variant: 'destructive', title: 'Genereer eerst een artikel' });
      return;
    }

    setIsSaving(true);
    try {
      const seo = result.seo_json;
      const tags = seo.tags ? seo.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      await createBlogPost({
        title: seo.meta_title,
        slug: seo.slug,
        excerpt: seo.meta_description,
        content: result.article_html,
        coverImageUrl: null,
        tags,
        status: 'draft',
        seoTitle: seo.meta_title,
        seoDescription: seo.meta_description,
        publishedAt: null,
      });

      toast({
        title: 'Blogpost opgeslagen!',
        description: 'Het AI-gegenereerde artikel is als concept opgeslagen. Je kunt het nu verder bewerken.'
      });
      handleClose(false);
    } catch (error) {
      console.error('Save failed', error);
      toast({ variant: 'destructive', title: 'Opslaan mislukt', description: 'Probeer het nog eens.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-brand text-2xl text-primary">
            <Sparkles className="h-6 w-6" /> AI Blog Inspiratie
          </DialogTitle>
          <DialogDescription>
            Kies een contentpijler en doelgroep. De generator schrijft een complete SEO-blog in KlusjesKoning-stijl.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="blog-category">Contentpijler</Label>
              <Select value={category} onValueChange={value => setCategory(value as BlogCategory)}>
                <SelectTrigger id="blog-category">
                  <SelectValue placeholder="Kies een pijler" />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="blog-audience">Doelgroep</Label>
              <Select value={audience} onValueChange={value => setAudience(value as AudienceSegment)}>
                <SelectTrigger id="blog-audience">
                  <SelectValue placeholder="Kies een doelgroep" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_SEGMENTS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="primary-keyword">Primair keyword</Label>
              <Input
                id="primary-keyword"
                value={primaryKeyword}
                onChange={event => setPrimaryKeyword(event.target.value)}
                placeholder="bijv. klusjes voor kinderen"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="extra-keywords">Extra keywords (comma separated)</Label>
              <Input
                id="extra-keywords"
                value={extraKeywords}
                onChange={event => setExtraKeywords(event.target.value)}
                placeholder="bijv. beloningssysteem, gezinsapp"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="tone-of-voice">Tone of voice</Label>
              <Input
                id="tone-of-voice"
                value={toneOfVoice}
                onChange={event => setToneOfVoice(event.target.value)}
                placeholder="bijv. warm, praktisch, betrouwbaar"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-audience">Doelgroepomschrijving</Label>
              <Input
                id="target-audience"
                value={targetAudience}
                onChange={event => setTargetAudience(event.target.value)}
                placeholder="bijv. ouders met kinderen 6–13"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="writing-style">Schrijfstijl</Label>
              <Input
                id="writing-style"
                value={writingStyle}
                onChange={event => setWritingStyle(event.target.value)}
                placeholder="bijv. blogartikel"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="blog-focus">Extra instructies (optioneel)</Label>
            <Textarea
              id="blog-focus"
              placeholder="Bijvoorbeeld: focus op doneren aan goede doelen in de kerstperiode"
              value={customFocus}
              onChange={event => setCustomFocus(event.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Genereer outline'}
            </Button>
          </div>

          <ScrollArea className="max-h-[420px] rounded-xl border bg-white/80 p-4">
            {isPending && (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                AI is bezig met schrijven...
              </div>
            )}

            {!isPending && result && (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Artikel voorbeeld</h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(result.article_html, 'Artikel HTML')}>
                    <Copy className="mr-2 h-4 w-4" /> Artikel HTML kopiëren
                  </Button>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: result.article_html }} />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">SEO JSON</h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(JSON.stringify(result.seo_json, null, 2), 'SEO JSON')}>
                    <Copy className="mr-2 h-4 w-4" /> SEO JSON kopiëren
                  </Button>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 font-mono text-sm text-slate-700">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(result.seo_json, null, 2)}</pre>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Midjourney prompt</h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(result.midjourney_prompt, 'Midjourney prompt')}>
                    <Copy className="mr-2 h-4 w-4" /> Prompt kopiëren
                  </Button>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
                  {result.midjourney_prompt}
                </div>
              </section>
            </div>
          )}

            {!isPending && !result && (
              <p className="py-8 text-center text-sm text-slate-500">Kies een pijler en doelgroep, vervolgens genereert de AI een uitgewerkte blogpost.</p>
            )}
          </ScrollArea>
        </div>

        {result && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleCopy(finalBlock, 'Volledige output')}>
              <Copy className="mr-2 h-4 w-4" />
              Kopieer volledige output
            </Button>
            <Button onClick={handleSaveAsBlogPost} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Opslaan als blogpost
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
