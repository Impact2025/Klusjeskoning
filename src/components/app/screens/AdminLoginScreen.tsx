'use client';

import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Shield } from 'lucide-react';
import ScreenWrapper from '../ScreenWrapper';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@klusjeskoning.nl';
const ADMIN_PASS = 'SuperGeheim123!';

export default function AdminLoginScreen() {
  const { loginParent, isLoading, setScreen } = useApp();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      loginParent(email, password);
    } else {
      toast({ variant: 'destructive', title: 'Fout', description: 'Ongeldige admin-gegevens.' });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(isLoading) return;
    handleLogin();
  }

  return (
    <ScreenWrapper className="p-6 bg-gray-800 text-white">
      <header className="flex items-center mb-6">
        <h2 className="font-brand text-3xl text-center flex-grow text-yellow-400">Admin Portaal</h2>
      </header>
      <main className="flex-grow flex flex-col justify-center">
        <div className="text-center mb-8">
            <Shield className="h-16 w-16 mx-auto text-yellow-400" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mailadres</Label>
            <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="admin@email.com" 
                required 
                className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="password">Wachtwoord</Label>
            <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="********" 
                required 
                className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <Button type="submit" size="lg" className="w-full text-lg shadow-md bg-yellow-400 hover:bg-yellow-500 text-gray-800" disabled={isLoading}>
             <LogIn className="mr-2 h-6 w-6" /> Inloggen
          </Button>
        </form>
      </main>
    </ScreenWrapper>
  );
}
