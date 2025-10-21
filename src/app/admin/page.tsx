'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseAuth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@klusjeskoning.nl';
const ADMIN_PASS = 'SuperGeheim123!';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [auth, setAuth] = useState<ReturnType<typeof getFirebaseAuth> | null>(null);

  // Initialize Firebase auth only on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuth(getFirebaseAuth());
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);

    try {
      // Check if credentials match hardcoded admin credentials
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        // Sign in with Firebase
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: 'Ongeldige admin-gegevens.',
        });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Er is iets misgegaan bij het inloggen.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Admin Portaal</CardTitle>
          <CardDescription>Log in met je admin gegevens</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@klusjeskoning.nl"
                required
                disabled={isLoading || !auth}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading || !auth}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isLoading || !auth}>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? 'Inloggen...' : 'Inloggen'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}