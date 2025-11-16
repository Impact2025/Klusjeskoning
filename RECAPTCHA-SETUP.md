# reCAPTCHA v3 Setup Guide

Google reCAPTCHA v3 is nu geïmplementeerd in het KlusjesKoning project. Deze gids helpt je bij het configureren en gebruiken van reCAPTCHA.

## 📋 Wat is geïmplementeerd?

✅ **reCAPTCHA v3 Component** - Onzichtbare bot-bescherming  
✅ **Privacy-compliant** - Respecteert cookie consent  
✅ **Helper functies** - Eenvoudige integratie in formulieren  
✅ **Server-side verificatie** - Veilige token validatie  

## 🔑 Stap 1: reCAPTCHA Keys verkrijgen

1. Ga naar [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Klik op **"+"** om een nieuwe site te registreren
3. Vul de volgende gegevens in:
   - **Label**: KlusjesKoning App
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: 
     - `localhost` (voor development)
     - `klusjeskoningapp.nl` (voor productie)
     - `klusjeskoning.vercel.app` (als je Vercel gebruikt)
4. Accepteer de voorwaarden en klik op **Submit**
5. Je krijgt nu twee keys:
   - **Site Key** (public) - Voor de frontend
   - **Secret Key** (private) - Voor de backend

## 🔧 Stap 2: Environment Variabelen configureren

Voeg de keys toe aan je `.env.local` bestand:

```env
# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=jouw_site_key_hier
RECAPTCHA_SECRET_KEY=jouw_secret_key_hier
```

**Let op:** 
- De `NEXT_PUBLIC_` prefix maakt de variabele beschikbaar in de browser
- De `RECAPTCHA_SECRET_KEY` blijft server-side en is NOOIT zichtbaar in de browser

## 📝 Stap 3: reCAPTCHA gebruiken in formulieren

### Frontend - Formulier met reCAPTCHA

```tsx
'use client';

import { FormEvent, useState } from 'react';
import { getRecaptchaToken, RECAPTCHA_ACTIONS } from '@/lib/recaptcha-helpers';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Haal reCAPTCHA token op
      const recaptchaToken = await getRecaptchaToken(RECAPTCHA_ACTIONS.LOGIN);
      
      if (!recaptchaToken) {
        toast({
          title: 'Verificatie mislukt',
          description: 'Probeer het opnieuw',
          variant: 'destructive',
        });
        return;
      }

      // Verstuur formulier met token
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          recaptchaToken, // Voeg token toe
        }),
      });

      // Verwerk response...
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulier velden */}
    </form>
  );
}
```

### Backend - API Route met verificatie

```tsx
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaInAPI, RECAPTCHA_ACTIONS } from '@/lib/recaptcha-helpers';

export async function POST(request: NextRequest) {
  try {
    const { email, password, recaptchaToken } = await request.json();

    // Verificeer reCAPTCHA token
    const verification = await verifyRecaptchaInAPI(
      recaptchaToken,
      RECAPTCHA_ACTIONS.LOGIN
    );

    if (!verification.success) {
      return NextResponse.json(
        { error: 'reCAPTCHA verificatie mislukt' },
        { status: 400 }
      );
    }

    // Score check (optioneel - voor extra beveiliging)
    if (verification.score && verification.score < 0.5) {
      console.warn(`Low reCAPTCHA score: ${verification.score}`);
      // Optioneel: extra verificatie stappen
    }

    // Ga door met login logica...
    // ...

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
```

## 🎯 Beschikbare Actions

Gebruik deze constanten voor consistentie:

```tsx
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha-helpers';

RECAPTCHA_ACTIONS.LOGIN           // 'login'
RECAPTCHA_ACTIONS.REGISTER        // 'register'
RECAPTCHA_ACTIONS.CONTACT         // 'contact'
RECAPTCHA_ACTIONS.SUBMIT_CHORE    // 'submit_chore'
RECAPTCHA_ACTIONS.REDEEM_REWARD   // 'redeem_reward'
RECAPTCHA_ACTIONS.CHECKOUT        // 'checkout'
RECAPTCHA_ACTIONS.PASSWORD_RESET  // 'password_reset'
```

## 🔒 Waar reCAPTCHA te gebruiken?

### Hoge prioriteit (aangeraden):
- ✅ Login formulieren
- ✅ Registratie formulieren
- ✅ Wachtwoord reset
- ✅ Contact formulieren
- ✅ Checkout/betaling

### Gemiddelde prioriteit:
- ⚠️ Klusje indienen (als spam probleem)
- ⚠️ Review/feedback formulieren
- ⚠️ Profiel updates

### Lage prioriteit:
- ℹ️ Interne acties (alleen voor ingelogde users)
- ℹ️ Read-only operaties

## 📊 reCAPTCHA Score interpretatie

reCAPTCHA v3 geeft een score tussen 0.0 en 1.0:

- **1.0** - Zeer waarschijnlijk een echte gebruiker
- **0.9-0.7** - Waarschijnlijk een echte gebruiker
- **0.6-0.5** - Neutraal (standaard threshold)
- **0.4-0.3** - Verdacht
- **0.0-0.2** - Zeer waarschijnlijk een bot

**Aanbevolen threshold:** 0.5 (al ingesteld in de code)

## 🧪 Testen

### Development
- reCAPTCHA werkt ook op `localhost`
- Zorg dat je de juiste keys gebruikt
- Check de browser console voor debug info

### Productie
- Test met echte gebruikers
- Monitor scores in [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- Pas threshold aan indien nodig

## 🔍 Troubleshooting

### "reCAPTCHA token not generated"
- Check of `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` correct is ingesteld
- Controleer of cookie consent is gegeven
- Kijk in browser console voor errors

### "reCAPTCHA verification failed"
- Controleer of `RECAPTCHA_SECRET_KEY` correct is (server-side)
- Zorg dat de action naam overeenkomt
- Check of het domain is toegevoegd in reCAPTCHA admin

### Lage scores
- Normale gebruikers kunnen soms lage scores krijgen
- Overweeg een lagere threshold (bijv. 0.3)
- Implementeer fallback verificatie (bijv. email verificatie)

## 🔐 Privacy & GDPR

✅ **Privacy-compliant implementatie:**
- reCAPTCHA laadt alleen na cookie consent
- IP-adressen worden geanonimiseerd
- Gebruikers kunnen opt-out via cookie instellingen
- Transparante privacy policy vereist

## 📚 Meer informatie

- [reCAPTCHA v3 Documentatie](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Best Practices](https://developers.google.com/recaptcha/docs/v3#best_practices)

## 🆘 Support

Bij vragen of problemen:
1. Check deze documentatie
2. Bekijk de code in `src/components/analytics/GoogleReCaptcha.tsx`
3. Raadpleeg `src/lib/recaptcha-helpers.ts` voor voorbeelden
4. Contact: info@klusjeskoning.app