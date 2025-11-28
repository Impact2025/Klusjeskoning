# Fix voor Login Probleem Live Omgeving

## Probleem
Inloggen werkt lokaal wel, maar niet in de live (productie) omgeving.

## Oorzaken
1. **Cookie domain niet juist geconfigureerd** - Cookies werden niet correct gezet voor het productie domein
2. **Environment variabelen missen** - Productie omgeving heeft specifieke settings nodig
3. **CORS/Origin validatie** - Security middleware kan requests blokkeren

## Oplossingen Geïmplementeerd

### 1. Cookie Domain Configuratie (src/server/auth/session.ts)
- Toegevoegd: `COOKIE_DOMAIN` environment variabele support
- Cookies worden nu correct gezet met het juiste domain

### 2. Te Configureren in Productie Omgeving

#### Vercel Environment Variables
Ga naar je Vercel project settings en voeg toe:

```bash
# Cookie Domain - gebruik je hoofddomein met punt ervoor voor wildcard subdomains
COOKIE_DOMAIN=.klusjeskoning.app

# Of zonder subdomain wildcard:
# COOKIE_DOMAIN=klusjeskoning.app

# App URL moet matchen met je productie URL
NEXT_PUBLIC_APP_URL=https://www.klusjeskoning.app

# Zorg dat NODE_ENV op production staat (meestal automatisch in Vercel)
NODE_ENV=production
```

#### Welk Domain Gebruiken?

**Als je app draait op `www.klusjeskoning.app`:**
```bash
COOKIE_DOMAIN=.klusjeskoning.app  # Met punt = werkt op alle subdomains
```

**Als je app draait op `klusjeskoning.app` (zonder www):**
```bash
COOKIE_DOMAIN=klusjeskoning.app  # Zonder punt = alleen hoofddomein
```

**Voor meerdere subdomains (www, app, etc):**
```bash
COOKIE_DOMAIN=.klusjeskoning.app  # Met punt vooraan
```

### 3. Security Middleware Check

De `security-middleware.ts` accepteert deze domains:
- `klusjeskoning.nl`
- `klusjeskoningapp.nl`
- `klusjeskoning.app`
- `www.klusjeskoning.app`
- `*.vercel.app` (preview deployments)
- `localhost` (development)

Als je een ander domein gebruikt, moet je dit toevoegen.

### 4. Deployment Checklist

✅ **Stap 1**: Voeg `COOKIE_DOMAIN` toe aan Vercel Environment Variables
✅ **Stap 2**: Update `NEXT_PUBLIC_APP_URL` naar je productie URL
✅ **Stap 3**: Controleer dat `NODE_ENV=production` is gezet
✅ **Stap 4**: Redeploy je applicatie op Vercel
✅ **Stap 5**: Test inloggen op productie
✅ **Stap 6**: Check browser DevTools > Application > Cookies om te zien of cookie correct is gezet

### 5. Debugging Tips

#### Check Cookie in Browser
1. Open DevTools (F12)
2. Ga naar "Application" tab
3. Kijk onder "Cookies" in de sidebar
4. Zoek naar `kk_session` cookie
5. Controleer:
   - ✓ Domain: moet overeenkomen met `COOKIE_DOMAIN`
   - ✓ Secure: moet `true` zijn in productie
   - ✓ HttpOnly: moet `true` zijn
   - ✓ SameSite: moet `Lax` zijn
   - ✓ Expires: moet een toekomstige datum zijn

#### Check Network Requests
1. Open DevTools > Network tab
2. Login
3. Zoek naar `/api/app` POST request
4. Check Response Headers voor `Set-Cookie`
5. Check of de cookie daadwerkelijk wordt meegestuurd in volgende requests

#### Check CORS Errors
1. Open Console (F12)
2. Login
3. Kijk naar rode error messages
4. CORS errors betekenen dat origin niet is toegestaan in security middleware

### 6. Als het Nog Niet Werkt

#### Optie A: Disable Security Middleware Tijdelijk (om te testen)
In `src/app/api/app/route.ts` regel 404-411, comment uit:

```typescript
// const securityCheck = await securityMiddleware(request, {
//   maxPayloadSize: 1024 * 1024,
//   allowedOrigins: ['klusjeskoning.nl', 'klusjeskoningapp.nl']
// });
//
// if (!securityCheck.valid) {
//   return securityCheck.response!;
// }
```

**LET OP**: Dit is ALLEEN voor debugging! Zet het daarna weer aan!

#### Optie B: Voeg Extra Logging Toe
Tijdelijk in `src/server/auth/session.ts`:

```typescript
console.log('[DEBUG] Setting cookie:', {
  domain: cookieDomain,
  secure: process.env.NODE_ENV === 'production',
  nodeEnv: process.env.NODE_ENV
});
```

#### Optie C: Check Vercel Logs
```bash
vercel logs [your-deployment-url]
```

Zoek naar errors rond cookie setting of authentication.

## Test Scenario

1. **Lokaal testen met productie settings:**
```bash
# In .env.local
NODE_ENV=production
COOKIE_DOMAIN=localhost
```

2. **Login flow testen:**
   - Ga naar `/app`
   - Klik "Inloggen"
   - Vul credentials in
   - Check of redirect naar dashboard werkt
   - Refresh de pagina
   - Check of je nog steeds ingelogd bent

## Veelvoorkomende Fouten

❌ **Cookie domain mismatch**
```
COOKIE_DOMAIN=klusjeskoning.app
Maar je site draait op: www.klusjeskoning.app
```
**Fix**: Gebruik `.klusjeskoning.app` (met punt)

❌ **HTTPS niet geforceerd**
```
Site draait op HTTP in productie
```
**Fix**: Zorg dat Vercel HTTPS afdwingt (standaard aan)

❌ **Wrong origin**
```
POST van www.klusjeskoning.app wordt geblokkeerd
```
**Fix**: Voeg domain toe aan allowedDomains in security-middleware.ts

## Contact

Als dit niet werkt, deel dan:
1. Screenshot van cookie in DevTools
2. Screenshot van Network tab voor `/api/app` request
3. Vercel deployment logs
4. Browser console errors
