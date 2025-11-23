'use client';

import { Share2, Facebook, Twitter, Linkedin, Link2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SocialShareProps {
  title: string;
  description: string;
  url: string;
  tags?: string[];
}

export function SocialShare({ title, description, url, tags = [] }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${tags.join(',')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-600">Delen:</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.facebook)}
          className="h-8 w-8 p-0"
          title="Delen op Facebook"
        >
          <Facebook className="h-4 w-4 text-blue-600" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.twitter)}
          className="h-8 w-8 p-0"
          title="Delen op Twitter"
        >
          <Twitter className="h-4 w-4 text-blue-400" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.linkedin)}
          className="h-8 w-8 p-0"
          title="Delen op LinkedIn"
        >
          <Linkedin className="h-4 w-4 text-blue-700" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0"
          title="Link kopiëren"
        >
          {copied ? (
            <Copy className="h-4 w-4 text-green-600" />
          ) : (
            <Link2 className="h-4 w-4 text-slate-600" />
          )}
        </Button>
      </div>
      {copied && (
        <span className="text-xs text-green-600 animate-fade-in">Gekopieerd!</span>
      )}
    </div>
  );
}