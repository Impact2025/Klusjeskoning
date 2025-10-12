# Event Tracking Implementatie Guide

Dit document legt uit hoe je custom event tracking kunt toevoegen aan je KlusjesKoning app.

---

## 📊 Wat is event tracking?

Event tracking helpt je begrijpen hoe gebruikers je app gebruiken:
- Welke features worden het meest gebruikt?
- Waar haken gebruikers af in de checkout?
- Hoeveel klusjes worden er gemaakt vs. afgerond?
- Welke beloningen zijn het populairst?

---

## 🚀 Quick Start

### 1. Import de tracking functie

```typescript
import { trackUserLogin, trackChoreCompleted, trackPurchaseCompleted } from '@/lib/analytics';
```

### 2. Voeg tracking toe aan je events

```typescript
// Bij login
function handleLogin(userType: 'parent' | 'child') {
  trackUserLogin(userType);
  // rest van je login logica...
}

// Bij het voltooien van een klusje
function handleChoreComplete(choreId: string, points: number) {
  trackChoreCompleted(points);
  // rest van je logica...
}
```

---

## 📋 Beschikbare Tracking Functions

### Authenticatie

```typescript
// Nieuwe registratie
trackUserRegistration('email'); // of 'google'

// Login
trackUserLogin('parent'); // of 'child' / 'admin'

// Logout
trackUserLogout();
```

### E-commerce & Checkout

```typescript
// Checkout gestart
trackCheckoutStarted('premium');

// Aankoop voltooid
trackPurchaseCompleted('premium', 4.99, 'TRX-12345');

// Checkout afgebroken
trackCheckoutAbandoned('premium', 'payment_page');
```

### Klusjes

```typescript
// Klusje aangemaakt
trackChoreCreated('kamer_opruimen'); // optioneel: type

// Klusje voltooid
trackChoreCompleted(25); // points

// Klusje goedgekeurd
trackChoreApproved();

// Klusje afgewezen
trackChoreRejected();
```

### Beloningen

```typescript
// Beloning aangemaakt
trackRewardCreated('filmavond');

// Beloning ingewisseld
trackRewardRedeemed(200, 'Samen een spelletje');

// Beloning uitgevoerd
trackRewardFulfilled();

// Donatie gedaan
trackDonationMade(500, 'Antoniusschool speeltoestel');
```

### Profiel & Setup

```typescript
// Kindprofiel aangemaakt
trackChildProfileCreated();

// Gezinssetup voltooid
trackFamilySetupCompleted();

// Onboarding afgerond
trackOnboardingCompleted('parent'); // of 'child'
```

### Feature Usage

```typescript
// AI Assistant gebruikt
trackAIAssistantUsed('chore_ideas'); // of 'reward_ideas'

// QR Code gescanned
trackQRCodeScanned();

// Recovery code gebruikt
trackRecoveryCodeUsed();

// Level omhoog
trackLevelUp(5);
```

### Engagement

```typescript
// Pagina bekeken
trackPageView('parent_dashboard');

// CTA gekocht
trackCTAClick('start_gratis', 'homepage_hero');

// Blog post gelezen
trackBlogPostRead('Motivatie tips', 120); // 120 seconden

// Gedeeld op social
trackShareAction('facebook', 'homepage');
```

### Errors & Support

```typescript
// Error opgetreden
trackError('payment_failed', 'Insufficient funds');

// Support gevraagd
trackSupportRequested('cant_login');
```

### Zoeken & Filteren

```typescript
// Zoekactie
trackSearch('kamer opruimen', 5); // 5 resultaten

// Filter toegepast
trackFilterApplied('age_range', '8-12');
```

---

## 🎯 Implementatie Voorbeelden

### Voorbeeld 1: Login Flow

```typescript
// In je ParentLoginScreen.tsx
import { trackUserLogin } from '@/lib/analytics';

function handleSuccessfulLogin(email: string) {
  // Track het event
  trackUserLogin('parent');

  // Navigeer naar dashboard
  setScreen('parentDashboard');
}
```

### Voorbeeld 2: Checkout Flow

```typescript
// In je CheckoutComponent.tsx
import {
  trackCheckoutStarted,
  trackPurchaseCompleted,
  trackCheckoutAbandoned
} from '@/lib/analytics';

// Wanneer checkout begint
function startCheckout(plan: 'premium') {
  trackCheckoutStarted(plan);
  // Open payment modal...
}

// Bij succesvolle betaling
function handlePaymentSuccess(transactionId: string) {
  trackPurchaseCompleted('premium', 4.99, transactionId);
  // Toon success bericht...
}

// Bij sluiten zonder betalen
function handleCheckoutClose() {
  trackCheckoutAbandoned('premium', 'payment_modal');
}
```

### Voorbeeld 3: Klusjes Dashboard

```typescript
// In je ParentDashboard.tsx
import { trackChoreApproved, trackChoreRejected } from '@/lib/analytics';

function approveChore(choreId: string) {
  // Update database
  await updateChoreStatus(choreId, 'approved');

  // Track het event
  trackChoreApproved();

  // Update UI
  refreshChoreList();
}

function rejectChore(choreId: string) {
  await updateChoreStatus(choreId, 'rejected');
  trackChoreRejected();
  refreshChoreList();
}
```

### Voorbeeld 4: Homepage CTA Tracking

```typescript
// In je homepage page.tsx
import { trackCTAClick } from '@/lib/analytics';

<Button
  onClick={() => {
    trackCTAClick('start_gratis', 'homepage_hero');
    router.push('/app?register=true');
  }}
>
  Start gratis
</Button>
```

---

## 🔍 Event Tracking in Google Analytics Bekijken

### Realtime Events

1. Ga naar [Google Analytics](https://analytics.google.com)
2. Selecteer je KlusjesKoning property
3. Ga naar **Realtime** → **Events**
4. Voer acties uit in je app
5. Zie events in real-time verschijnen!

### Event Reports

1. Ga naar **Reports** → **Engagement** → **Events**
2. Zie alle getrackte events met aantallen
3. Klik op een event voor details
4. Bekijk trends over tijd

### Custom Reports Maken

1. Ga naar **Explore**
2. Maak een nieuwe exploration aan
3. Voeg events toe die je wilt analyseren
4. Bekijk funnels, retention, en conversies

---

## 📈 Welke Events Moet Je Tracken?

### Must-Track (Essentieel)

✅ **User Registration** - Hoeveel nieuwe gebruikers?
✅ **User Login** - Hoe vaak loggen mensen in?
✅ **Chore Completed** - Kernfunctionaliteit van de app
✅ **Reward Redeemed** - Engagement metric
✅ **Purchase Completed** - Revenue tracking!

### Should-Track (Belangrijk)

⭐ **Checkout Started** - Conversie funnel
⭐ **Child Profile Created** - Gezinsgrootte indicator
⭐ **Family Setup Completed** - Onboarding success
⭐ **AI Assistant Used** - Premium feature usage
⭐ **Level Up** - Gamification engagement

### Nice-to-Track (Optioneel)

💡 **Page Views** - Navigatie patronen
💡 **CTA Clicks** - A/B testing
💡 **Blog Post Read** - Content engagement
💡 **Search** - What are users looking for?
💡 **Error Occurred** - Bug tracking

---

## 🛠️ Best Practices

### 1. Track op het juiste moment

```typescript
// ✅ GOED: Track NA succesvolle actie
async function saveChore(chore: Chore) {
  const result = await db.saveChore(chore);
  if (result.success) {
    trackChoreCreated(chore.type); // ✅
  }
}

// ❌ FOUT: Track VOOR de actie
function saveChore(chore: Chore) {
  trackChoreCreated(chore.type); // ❌ Te vroeg!
  await db.saveChore(chore);
}
```

### 2. Geef context mee

```typescript
// ✅ GOED: Met context
trackCTAClick('start_gratis', 'homepage_hero');

// ❌ FOUT: Zonder context
trackCTAClick('button_click');
```

### 3. Gebruik consistente naming

```typescript
// ✅ GOED: snake_case, descriptive
trackChoreCompleted(points);
trackRewardRedeemed(points, name);

// ❌ FOUT: Inconsistent
trackChoreComplete(points);
trackReward_Redeemed(points, name);
```

### 4. Test in development

De tracking functions loggen in development mode:
```
📊 Analytics Event: user_login { user_type: 'parent', timestamp: '...' }
```

Check je browser console om te zien of events gefired worden!

---

## 🔐 Privacy & GDPR

Alle tracking gebeurt **alleen** als de gebruiker:
- ✅ Cookies heeft geaccepteerd via de cookie banner
- ✅ `localStorage.getItem('analytics-consent') === 'true'`

Geen consent = geen tracking. Automatisch geregeld! 🎉

---

## 🐛 Troubleshooting

### Events worden niet getrackt

1. **Check console**: Zie je `📊 Analytics Event` logs?
2. **Check consent**: Heeft gebruiker cookies geaccepteerd?
3. **Check GA4 ID**: Is `NEXT_PUBLIC_GA_MEASUREMENT_ID` ingesteld?
4. **Check network**: Zie je `google-analytics.com/collect` requests?

### Events komen niet aan in GA4

1. **Wacht 5-10 minuten**: Realtime kan vertraagd zijn
2. **Check property**: Juiste GA4 property geselecteerd?
3. **Check filter**: Zit je in de juiste date range?

---

## 📞 Hulp Nodig?

Voor vragen over event tracking:
- **Email**: info@klusjeskoningapp.nl
- **Docs**: https://developers.google.com/analytics/devguides/collection/ga4

---

**Happy Tracking! 🚀**
