"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Share2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/components/app/AppProvider';

interface ChildInvitationProps {
  childId: string;
  childName: string;
}

export function ChildInvitation({ childId, childName }: ChildInvitationProps) {
  const { toast } = useToast();
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate invitation URL
  const invitationUrl = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/powerklusjes/invite/${childId}`;
  }, [childId]);

  // Generate QR code URL (using a service like qr-server.com)
  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationUrl)}`;
  }, [invitationUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast({
        title: 'Gekopieerd!',
        description: 'De uitnodigingslink is gekopieerd naar je klembord.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon de link niet kopiëren.',
      });
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PowerKlusjes uitnodiging van ${childName}`,
          text: customMessage || `${childName} nodigt je uit om samen klusjes te doen in PowerKlusjes!`,
          url: invitationUrl,
        });
      } catch (error) {
        // User cancelled sharing or sharing failed
        console.log('Sharing cancelled or failed');
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          PowerKlusjes Uitnodiging
        </CardTitle>
        <CardDescription>
          Nodig vrienden, familie of buren uit om samen klusjes te doen!
          Zij kunnen je belonen voor je harde werk.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Section */}
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
            <img
              src={qrCodeUrl}
              alt="QR Code voor PowerKlusjes uitnodiging"
              className="w-48 h-48"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Scan deze QR-code om uitgenodigd te worden
          </p>
        </div>

        {/* Invitation Link */}
        <div className="space-y-2">
          <Label htmlFor="invitation-link">Uitnodigingslink</Label>
          <div className="flex gap-2">
            <Input
              id="invitation-link"
              value={invitationUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className={copied ? 'text-green-600' : ''}
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <Label htmlFor="custom-message">Persoonlijk bericht (optioneel)</Label>
          <Textarea
            id="custom-message"
            placeholder={`Hoi! Ik ben ${childName} en ik doe graag klusjes. Wil jij me helpen door me te belonen voor mijn werk?`}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={shareViaWebShare} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Delen
          </Button>
          <Button variant="outline" onClick={copyToClipboard} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Kopiëren
          </Button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Hoe werkt het?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Deel deze link of QR-code met mensen die je kent</li>
            <li>• Zij kunnen je uitnodigen voor klusjes met een beloning</li>
            <li>• Doe de klusjes en upload bewijs (foto/video)</li>
            <li>• Ontvang punten die je kunt gebruiken in de app!</li>
          </ul>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-3 py-1">
            <QrCode className="h-3 w-3 mr-1" />
            Uitnodiging actief
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}