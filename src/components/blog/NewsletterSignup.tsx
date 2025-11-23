'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setMessage('Voer een geldig emailadres in');
      return;
    }

    setStatus('loading');

    try {
      // Here you would integrate with your email service (e.g., Mailchimp, ConvertKit)
      // For now, we'll simulate a successful signup
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('success');
      setMessage('Bedankt voor je aanmelding! Check je inbox voor de bevestiging.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage('Er ging iets mis. Probeer het later opnieuw.');
    }
  };

  return (
    <Card className="border-slate-200 bg-gradient-to-r from-primary/5 to-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Mail className="h-5 w-5 text-primary" />
          Blijf op de hoogte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Ontvang de nieuwste tips, verhalen en updates over KlusjesKoning direct in je inbox.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0"
            >
              {status === 'loading' ? 'Aanmelden...' : 'Aanmelden'}
            </Button>
          </div>

          {status !== 'idle' && (
            <div className={`flex items-center gap-2 text-sm ${
              status === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{message}</span>
            </div>
          )}
        </form>

        <p className="text-xs text-slate-500">
          Geen spam, je kunt je altijd eenvoudig afmelden.
        </p>
      </CardContent>
    </Card>
  );
}