'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, Shield } from 'lucide-react';
import { useApp } from '@/components/app/AppProvider';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin, currentScreen, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentScreen === 'adminDashboard') {
      router.push('/admin/dashboard');
    }
  }, [currentScreen, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAdmin(email, password);
      router.push('/admin/dashboard');
    } catch {
      // Foutmelding wordt afgehandeld door AppProvider
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
                disabled={isLoading}
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
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? 'Inloggen...' : 'Inloggen'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}