# SEO & Analytics Setup Guide voor KlusjesKoning

Dit document legt uit hoe je de SEO-optimalisatie en analytics hebt ingesteld, en hoe je deze kunt configureren.

---

## ✅ Wat is geïmplementeerd

### 📊 SEO Optimalisatie

1. **robots.txt** (`public/robots.txt`)
   - Geeft zoekmachines toestemming om de site te crawlen
   - Blokkeert privé-secties (/admin, /app)
   - Verwijst naar sitemap

2. **Dynamische Sitemap** (`src/app/sitemap.ts`)
   - Automatisch gegenereerde XML sitemap
   - Bevat alle statische pagina's (homepage, blog, handleidingen, reviews)
   - Voegt dynamisch alle gepubliceerde blog posts toe
   - Toegankelijk via: `https://klusjeskoningapp.nl/sitemap.xml`

3. **Metadata Optimalisatie**
   - Open Graph tags voor mooie social media previews
   - Twitter Card metadata
   - Canonical URLs om duplicate content te voorkomen
   - Per-page metadata voor betere SEO
   - Keywords, descriptions en authors

4. **Structured Data (JSON-LD)**
   - Organization schema voor bedrijfsinformatie
   - WebApplication schema voor app-details
   - Helpt Google om rich snippets te tonen

5. **Favicon & App Icons**
   - Dynamisch gegenereerde favicons
   - Apple touch icons voor iOS
   - Crown emoji (👑) als icoon

---

### 📈 Analytics & Tracking

1. **Google Analytics 4**
   - GDPR-compliant implementatie
   - Alleen actief na cookie consent
   - Anonieme IP tracking
   - Custom event tracking mogelijk

2. **Microsoft Clarity**
   - Gratis heatmaps en session recordings
   - Privacy-vriendelijk
   - Alleen actief na cookie consent

3. **Cookie Consent Banner**
   - GDPR/AVG compliant
   - Gebruikers kunnen kiezen: accepteren of afwijzen
   - Opgeslagen in localStorage
   - Link naar privacybeleid

---

## 🔧 Configuratie Instructies

### 1. Google Analytics 4 Setup

1. Ga naar [Google Analytics](https://analytics.google.com)
2. Maak een nieuwe property aan voor KlusjesKoning
3. Kies "Web" als platform
4. Kopieer je **Measurement ID** (format: `G-XXXXXXXXXX`)
5. Voeg toe aan `.env.local`:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### 2. Microsoft Clarity Setup

1. Ga naar [Microsoft Clarity](https://clarity.microsoft.com)
2. Maak een nieuw project aan voor KlusjesKoning
3. Kopieer je **Project ID**
4. Voeg toe aan `.env.local`:
   ```bash
   NEXT_PUBLIC_CLARITY_PROJECT_ID=your-project-id
   ```

### 3. Google Search Console

1. Ga naar [Google Search Console](https://search.google.com/search-console)
2. Voeg je website toe: `https://klusjeskoningapp.nl`
3. Verifieer met een van deze methoden:
   - **HTML tag**: Kopieer de verification code en voeg toe aan `src/app/layout.tsx` regel 54
   - **DNS verificatie**: Voeg een TXT record toe aan je domein
4. Submit je sitemap: `https://klusjeskoningapp.nl/sitemap.xml`

### 4. Optionele Tools

#### Hotjar (Session Recordings & Heatmaps)
1. Ga naar [Hotjar](https://www.hotjar.com)
2. Maak een account aan en installeer de tracking code
3. Volg de instructies om Hotjar toe te voegen (vergelijkbaar met GA4)

#### Plausible (Privacy-vriendelijke Analytics)
1. Als alternatief voor GA4
2. Ga naar [Plausible](https://plausible.io)
3. Volg de setup instructies

---

## 📝 Code Structuur

### Analytics Componenten

```
src/components/analytics/
├── GoogleAnalytics.tsx      # Google Analytics 4 component
├── MicrosoftClarity.tsx     # Microsoft Clarity component
└── CookieConsent.tsx        # GDPR cookie consent banner
```

### SEO Componenten

```
src/components/seo/
└── StructuredData.tsx       # JSON-LD structured data schemas
```

### Metadata

```
src/lib/metadata.ts          # Helper voor consistente metadata
src/app/sitemap.ts           # Dynamische sitemap generator
public/robots.txt            # Robots.txt configuratie
```

---

## 🧪 Testen

### SEO Testen

1. **Robots.txt**: Ga naar `http://localhost:9002/robots.txt`
2. **Sitemap**: Ga naar `http://localhost:9002/sitemap.xml`
3. **Metadata**: Gebruik [Open Graph Debugger](https://www.opengraph.xyz/)
4. **Structured Data**: Gebruik [Google Rich Results Test](https://search.google.com/test/rich-results)

### Analytics Testen

1. Start de dev server: `npm run dev`
2. Open de browser console
3. Accepteer cookies via de banner
4. Check of GA4 en Clarity laden in de Network tab

---

## 🎯 Volgende Stappen

### Must Do
1. **Configureer Google Analytics 4** - Voeg je Measurement ID toe
2. **Configureer Microsoft Clarity** - Voeg je Project ID toe
3. **Verifieer Google Search Console** - Update verification code in layout.tsx
4. **Submit Sitemap** - In Google Search Console

### Nice to Have
1. **Privacybeleid pagina** maken (`/privacy`)
2. **Custom event tracking** implementeren voor belangrijke acties (registraties, checkouts)
3. **Goal conversions** instellen in GA4
4. **Custom dimensions** toevoegen (plan type, user type, etc.)

### Later
1. **A/B testing** met Google Optimize
2. **Heatmaps analyseren** met Clarity
3. **SEO monitoring** met Ahrefs of SEMrush
4. **Performance monitoring** met Lighthouse CI

---

## 🔒 Privacy & GDPR

De implementatie is GDPR/AVG-compliant:

- ✅ Cookie consent banner
- ✅ Opt-in (geen tracking zonder toestemming)
- ✅ Anonieme IP tracking in GA4
- ✅ Duidelijke uitleg wat we verzamelen
- ✅ Optie om alleen noodzakelijke cookies te accepteren

**Let op**: Maak wel een `/privacy` pagina met:
- Welke cookies je gebruikt
- Wat je verzamelt
- Hoe lang je data bewaart
- Contact informatie voor privacy vragen

---

## 📞 Ondersteuning

Voor vragen over deze setup:
- **Email**: info@klusjeskoningapp.nl
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)

---

**Succes met je SEO & Analytics! 🚀**
