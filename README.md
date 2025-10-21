# KlusjesKoning App

De leukste manier om klusjes te doen! Een mobiele app voor gezinnen die samenwerken, sparen voor beloningen en zelfs goede doelen ondersteunen.

## 🎯 Wat is KlusjesKoning?

KlusjesKoning is een gamified klusjesapp die gezinnen helpt om huishouden taken leuk te maken voor kinderen. Kinderen kunnen klusjes doen, punten verdienen en deze inwisselen voor beloningen of donaties aan goede doelen.

## 🚀 Features

- **Gamified ervaring**: Kinderen verdienen punten voor klusjes en stijgen in level
- **Beloningsshop**: Wissel punten in voor leuke beloningen of doneer aan goede doelen
- **AI-ondersteuning**: Genereer klusjes- en beloningsideeën met Gemini AI
- **Veilige authenticatie**: Parent-first authenticatie met kindvriendelijke login
- **Admin dashboard**: Beheer blogposts, reviews, gezinnen en statistieken
- **Financieel beheer**: Beheer premium abonnementen en financiële gegevens (admin only)
- **Email notificaties**: Automatische emails bij registratie, klusjes en beloningen

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini via Genkit
- **Email**: SendGrid
- **Analytics**: Google Analytics 4, Microsoft Clarity
- **Deployment**: Vercel

## 📦 Installatie

1. **Clone de repository**
   ```bash
   git clone https://github.com/Impact2025/klusjeskoningapp.git
   cd klusjeskoningapp
   ```

2. **Installeer dependencies**
   ```bash
   npm install
   ```

3. **Environment variabelen**
   Creëer een `.env.local` bestand in de root van het project:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_sendgrid_from_email
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_GA_MEASUREMENT_ID=your_google_analytics_measurement_id
   NEXT_PUBLIC_CLARITY_PROJECT_ID=your_clarity_project_id
   ```

4. **Start de development server**
   ```bash
   npm run dev
   ```

5. **Start de Genkit AI server (optioneel)**
   ```bash
   npm run genkit:dev
   ```

## 🏗 Project Structuur

```
src/
├── ai/                 # AI flows en logica (Genkit)
├── app/                # Next.js app router pages
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   ├── app/            # Main app interface
│   └── ...             # Other pages
├── components/         # React components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── ...
```

## 🔐 Admin Toegang

De admin interface is beschikbaar op `/admin` met de volgende inloggegevens:
- **Email**: admin@klusjeskoning.nl
- **Wachtwoord**: SuperGeheim123!

## 📧 Email Systeem

Het project gebruikt SendGrid voor email notificaties:
- Welkomsemail bij registratie
- Notificatie bij klusjes indienen
- Notificatie bij beloningen inwisselen
- Admin notificatie bij nieuwe registraties

## 📊 Analytics

Het project is uitgerust met:
- Google Analytics 4 voor gebruikersstatistieken
- Microsoft Clarity voor heatmaps en session recordings
- GDPR-compliant cookie consent systeem

## 🚀 Deployment

### Vercel (Aanbevolen)
1. Push naar GitHub
2. Importeer project in Vercel
3. Configureer environment variabelen in Vercel dashboard
4. Deploy!

### Andere platforms
Het project kan ook gedeployed worden op andere platforms die Next.js ondersteunen.

## 🤝 Bijdragen

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je wijzigingen (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is gelicentieerd onder de MIT licentie - zie het [LICENSE](LICENSE) bestand voor details.

## 📞 Contact

WeAreImpact - info@klusjeskoningapp.nl

Project Link: [https://github.com/Impact2025/klusjeskoningapp](https://github.com/Impact2025/klusjeskoningapp)