# 🚀 Go-Live Checklist voor KlusjesKoning

**Versie**: 1.0
**Laatste update**: 11 oktober 2025

---

## ✅ **KRITIEK - Moet VOOR live**

### **1. Analytics Configureren** ⏱️ 5 minuten

**Wat**: Voeg je tracking IDs toe

**Hoe**:
1. Open `.env.local`
2. Vul in:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_CLARITY_PROJECT_ID=your-project-id
   ```

**Waar haal je de IDs op**:
- **Google Analytics 4**: https://analytics.google.com → Maak property "KlusjesKoning" → Data Streams → Web → Measurement ID
- **Microsoft Clarity**: https://clarity.microsoft.com → New project → Copy Project ID

**Test**:
```bash
npm run dev
# Open http://localhost:9002
# Accepteer cookies
# Check browser console voor: 📊 Analytics Event logs
```

**Status**: ❌ Nog niet gedaan

---

### **2. Privacy Page Invullen** ⏱️ 2 minuten

**Wat**: Voeg je bedrijfsgegevens toe (wettelijk verplicht!)

**Hoe**:
1. Open `src/app/privacy/page.tsx`
2. Zoek regel 58-61
3. Vervang:
   ```typescript
   <p>KVK-nummer: [Vul je KVK-nummer in]</p>
   <p>Adres: [Vul je adres in]</p>
   ```

   Met je echte gegevens:
   ```typescript
   <p>KVK-nummer: 12345678</p>
   <p>Adres: Straatnaam 1, 1234 AB Plaats</p>
   ```

**Waarom belangrijk**: AVG/GDPR compliance vereist identificeerbare contactgegevens

**Status**: ❌ Nog niet gedaan

---

### **3. Build Error Fix** ⏱️ 5 minuten

**Probleem**: `tx is not a function` tijdens `npm run build`

**Optie A: Vercel Deployment (Aanbevolen)**

Vercel handled de build automatisch beter. Deploy direct:

```bash
# Installeer Vercel CLI
npm i -g vercel

# Deploy
vercel

# Volg de prompts:
# - Link to existing project? No
# - Project name: klusjeskoningapp
# - Directory: ./ (Enter)
# - Override settings? No
```

Vercel zal de app builden en deployen. Als de error blijft:

```bash
# Maak vercel.json aan:
```

**Optie B: Netlify Deployment**

```bash
# Build command
npm run build || npm run dev

# Publish directory
.next
```

**Optie C: Manual Fix (Als je zelf host)**

Probeer dependencies updaten:
```bash
npm update
npm audit fix
npm run build
```

Als dat niet werkt:
```bash
# Nuclear option
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

**Status**: ⚠️ Build error bestaat nog

---

### **4. Environment Variables voor Productie** ⏱️ 3 minuten

**Wat**: Zorg dat je .env variabelen ook in productie staan

**Voor Vercel**:
1. Ga naar Vercel Dashboard → Je project → Settings → Environment Variables
2. Voeg ALLE variabelen uit `.env.local` toe:
   ```
   GOOGLE_API_KEY=...
   SENDGRID_API_KEY=...
   SENDGRID_FROM_EMAIL=...
   NEXT_PUBLIC_APP_URL=https://klusjeskoningapp.nl
   MULTISAFEPAY_API_KEY=...
   NEXT_PUBLIC_GA_MEASUREMENT_ID=...
   NEXT_PUBLIC_CLARITY_PROJECT_ID=...
   ```

**Voor Netlify**: Zelfde, maar via Netlify UI → Site Settings → Environment Variables

**Belangrijk**: Verander `NEXT_PUBLIC_APP_URL` naar je productie domain!

**Status**: ❌ Nog niet gedaan

---

## 🎯 **BELANGRIJK - Moet SNEL na live**

### **5. Google Search Console Verificatie** ⏱️ 10 minuten

**Wat**: Laat Google je site indexeren

**Hoe**:
1. Ga naar https://search.google.com/search-console
2. Klik "Add Property"
3. Kies "Domain" → `klusjeskoningapp.nl`
4. Kies verificatie methode:

**Optie A: HTML Tag (Makkelijkst)**
1. Kopieer de verification code
2. Open `src/app/layout.tsx`
3. Vervang regel 54:
   ```typescript
   verification: {
     google: 'je-verification-code-hier',
   },
   ```
4. Deploy opnieuw

**Optie B: DNS Record**
1. Voeg TXT record toe aan je DNS
2. Wacht 24 uur op propagatie

**Na verificatie**:
1. Submit sitemap: `https://klusjeskoningapp.nl/sitemap.xml`
2. Request indexing voor homepage

**Status**: ❌ Nog niet gedaan

---

### **6. Domain & DNS Setup** ⏱️ 15 minuten

**Als je Vercel gebruikt**:
1. Vercel Dashboard → Je project → Settings → Domains
2. Voeg toe: `klusjeskoningapp.nl`
3. Vercel geeft je DNS instructies
4. Update je DNS bij je registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. Wacht 24 uur op propagatie

**SSL Certificaat**: Vercel regelt dit automatisch (Let's Encrypt)

**Status**: ❌ Nog niet gedaan

---

### **7. Firebase Security Rules Check** ⏱️ 5 minuten

**Belangrijk**: Check of je Firestore rules productie-ready zijn

**Hoe**:
1. Ga naar Firebase Console → Firestore Database → Rules
2. Check of je **NIET** dit hebt:
   ```javascript
   // ❌ GEVAARLIJK - Niet voor productie!
   allow read, write: if true;
   ```

3. Zorg voor juiste rules zoals:
   ```javascript
   // ✅ VEILIG
   match /families/{familyId} {
     allow read, write: if request.auth != null && request.auth.uid == resource.data.parentUid;
   }
   ```

**Status**: ⚠️ Check dit!

---

## 📊 **OPTIONEEL - Nice to have**

### **8. Error Monitoring Setup** ⏱️ 10 minuten

**Aanbevolen**: Sentry voor error tracking

```bash
npm install @sentry/nextjs

# Volg setup wizard
npx @sentry/wizard@latest -i nextjs
```

**Alternatief**: LogRocket, Rollbar

**Status**: ⏸️ Optioneel

---

### **9. Performance Monitoring** ⏱️ 5 minuten

**Vercel**: Automatisch ingebouwd!

Check na deployment:
- Vercel Dashboard → Analytics
- Core Web Vitals scores
- Function execution times

**Status**: ⏸️ Automatisch bij Vercel

---

### **10. Backup Strategy** ⏱️ 15 minuten

**Firestore Backups**:
1. Firebase Console → Firestore Database
2. Schedule daily backups (betaald feature)

**Alternatief (Gratis)**:
```bash
# Manual export
firebase firestore:export gs://your-bucket-name/backups/$(date +%Y%m%d)
```

**Status**: ⏸️ Optioneel maar aanbevolen

---

## 🧪 **TESTING VOOR LIVE**

### **Pre-Launch Testing Checklist**

```bash
# 1. Test local build
npm run build && npm run start

# 2. Test alle routes
✅ http://localhost:3000/
✅ http://localhost:3000/app
✅ http://localhost:3000/admin
✅ http://localhost:3000/blog
✅ http://localhost:3000/reviews
✅ http://localhost:3000/handleidingen
✅ http://localhost:3000/privacy

# 3. Test functionaliteit
✅ Parent kan registreren
✅ Parent kan inloggen
✅ Kind kan inloggen met pincode
✅ Klusje kan worden aangemaakt
✅ Klusje kan worden goedgekeurd
✅ Beloning kan worden ingewisseld
✅ Checkout werkt (test mode)
✅ Cookie banner verschijnt
✅ Analytics events worden getracked (check console)

# 4. Test op devices
✅ Desktop Chrome
✅ Desktop Firefox
✅ Mobile Safari (iPhone)
✅ Mobile Chrome (Android)
✅ Tablet
```

---

## 📈 **POST-LAUNCH MONITORING**

### **Eerste 24 uur**

**Check om de 2 uur**:
- [ ] Site is bereikbaar (https://klusjeskoningapp.nl)
- [ ] SSL certificaat werkt (groene slotje)
- [ ] Analytics ontvangt data (GA4 Realtime)
- [ ] Geen errors in Vercel/Netlify logs
- [ ] Geen errors in Firebase logs

**Check dagelijks (eerste week)**:
- [ ] Nieuwe registraties in Firebase
- [ ] Analytics trends (sessies, bounce rate)
- [ ] Error logs (Sentry/Vercel)
- [ ] Performance metrics (Core Web Vitals)

---

## 🚨 **TROUBLESHOOTING**

### **"Site is niet bereikbaar"**
1. Check DNS propagatie: https://dnschecker.org
2. Check Vercel deployment status
3. Check domain settings in Vercel

### **"SSL Certificaat error"**
1. Wacht 24 uur (Let's Encrypt provisioning)
2. Check domain ownership in Vercel
3. Force renewal: Vercel Dashboard → Domains → Renew Certificate

### **"Firebase permission denied"**
1. Check Firestore rules
2. Check Authentication is enabled
3. Check user is logged in

### **"Analytics werkt niet"**
1. Check environment variables zijn deployed
2. Check cookies zijn geaccepteerd
3. Check browser console voor errors
4. Wacht 5-10 minuten (GA4 kan vertraagd zijn)

---

## ✅ **FINAL CHECKLIST**

Voordat je live gaat, check alles:

### **Code & Content**
- [ ] Privacy page: KVK & adres ingevuld
- [ ] Analytics IDs geconfigureerd (GA4 + Clarity)
- [ ] Environment variables compleet
- [ ] Build succesvol (of deployment platform gekozen)
- [ ] Alle routes getest

### **External Services**
- [ ] Firebase project geconfigureerd
- [ ] Firestore security rules gecheck
- [ ] SendGrid email configuratie getest
- [ ] MultiSafePay payment gateway getest (test mode)
- [ ] Domain DNS geconfigureerd
- [ ] SSL certificaat actief

### **SEO & Marketing**
- [ ] robots.txt bereikbaar
- [ ] sitemap.xml bereikbaar
- [ ] Open Graph metadata getest
- [ ] Google Search Console geverifieerd
- [ ] Sitemap gesubmit

### **Analytics & Monitoring**
- [ ] Google Analytics 4 ontvangt data
- [ ] Microsoft Clarity ontvangt data
- [ ] Cookie consent werkt
- [ ] Event tracking getest (console logs)

### **Legal & Compliance**
- [ ] Privacy policy live en compleet
- [ ] Cookie consent banner actief
- [ ] GDPR compliant (opt-in tracking)
- [ ] Contactgegevens correct

---

## 🎉 **GO LIVE!**

**Wanneer alles ✅ is**:

1. **Deploy naar productie**:
   ```bash
   vercel --prod
   ```

2. **Monitor eerste uur**:
   - Vercel deployment logs
   - GA4 Realtime
   - Firebase Authentication logs

3. **Kondig aan**:
   - Social media post
   - Email naar beta testers
   - Product Hunt launch (optioneel)

4. **Vier het! 🎊**

---

## 📞 **Hulp Nodig?**

**Critical Issues**:
- Check Vercel/Netlify Status Page
- Check Firebase Status: https://status.firebase.google.com
- Check DNS: https://dnschecker.org

**Support**:
- Email: info@klusjeskoningapp.nl
- Vercel Support: https://vercel.com/support
- Firebase Support: https://firebase.google.com/support

---

**Succes met de launch! 🚀**
