const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://klusjeskoning.nl';

type BaseEmailProps = {
  previewText: string;
  heading: string;
  intro: string;
  contentBlocks: Array<{ title?: string; body: string[] }>;
  cta?: { label: string; href: string };
  footerNote?: string;
};

type EmailPayload = {
  subject: string;
  html: string;
};

type NotificationPayload =
  | {
      type: 'welcome_parent';
      to: string;
      data: { familyName: string; familyCode: string };
    }
  | {
      type: 'chore_submitted';
      to: string;
      data: { parentName: string; childName: string; choreName: string; points: number };
    }
  | {
      type: 'reward_redeemed';
      to: string;
      data: { parentName: string; childName: string; rewardName: string; points: number };
    }
  | {
      type: 'admin_new_registration';
      to: string;
      data: { 
        familyName: string;
        email: string;
        city: string;
        familyCode: string;
        timestamp: string;
      };
    };

const brand = {
  background: '#f1f5f9',
  cardBg: '#ffffff',
  primary: '#0ea5e9',
  accent: '#fbbf24',
  text: '#1e293b',
  muted: '#64748b',
};

function renderBaseEmail({ previewText, heading, intro, contentBlocks, cta, footerNote }: BaseEmailProps): string {
  const sections = contentBlocks
    .map((block) => {
      const title = block.title
        ? `<h2 style="margin:0 0 16px;font-size:20px;color:${brand.text};font-weight:700;text-align:left;">${block.title}</h2>`
        : '';
      const paragraphs = block.body
        .map(
          (paragraph) =>
            `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${brand.muted};text-align:left;">${paragraph}</p>`
        )
        .join('');

      return `
        <tr>
          <td style="padding:20px 0;border-bottom:1px solid #e2e8f0;text-align:left;">
            ${title}
            ${paragraphs}
          </td>
        </tr>
      `;
    })
    .join('');

  const ctaButton = cta
    ? `
        <tr>
          <td style="padding:28px 0;text-align:left;">
            <a href="${cta.href}" style="display:inline-block;padding:14px 28px;background:${brand.primary};color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;text-align:center;">
              ${cta.label}
            </a>
          </td>
        </tr>
      `
    : '';

  const footer = footerNote
    ? `<p style="margin:16px 0 0;font-size:13px;color:${brand.muted};line-height:1.6;text-align:left;">${footerNote}</p>`
    : '';

  // Add debug info in a small header
  const debugInfo = process.env.NODE_ENV === 'development'
    ? `<div style="background:#f1f5f9;padding:8px 16px;margin-bottom:20px;border-radius:8px;font-size:11px;color:#64748b;text-align:left;">Email verzonden op: ${new Date().toLocaleString('nl-NL')} | Type: ${heading}</div>`
    : '';

  return `<!DOCTYPE html>
   <html lang="nl">
     <head>
       <meta charSet="utf-8" />
       <title>${heading}</title>
       <meta name="viewport" content="width=device-width, initial-scale=1" />
     </head>
     <body style="margin:0;padding:0;background:${brand.background};font-family:'Inter','Segoe UI',sans-serif;text-align:left;">
       <span style="display:none !important;color:${brand.background};">${previewText}</span>
       <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:${brand.background};padding:40px 16px;text-align:left;">
         <tr>
           <td>
             <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:640px;margin:0 auto;background:${brand.cardBg};border-radius:32px;padding:40px 36px;box-shadow:0 20px 45px rgba(14,165,233,0.15);text-align:left;">
               ${debugInfo ? `<tr><td>${debugInfo}</td></tr>` : ''}
               <tr>
                 <td style="text-align:center;padding-bottom:28px;">
                   <a href="${APP_BASE_URL}" style="text-decoration:none;color:${brand.text};display:inline-flex;align-items:center;gap:12px;">
                     <span style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg, ${brand.primary}, ${brand.accent});color:#ffffff;font-size:26px;font-weight:700;">KK</span>
                     <span style="font-size:22px;font-weight:700;">KlusjesKoning</span>
                   </a>
                 </td>
               </tr>
               <tr>
                 <td style="text-align:left;">
                   <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:${brand.text};text-align:left;">${heading}</h1>
                   <p style="margin:0 0 22px;font-size:17px;line-height:1.7;color:${brand.muted};text-align:left;">${intro}</p>
                 </td>
               </tr>
               ${sections}
               ${ctaButton}
               <tr>
                 <td style="padding-top:20px;border-top:1px solid #e2e8f0;text-align:left;">
                   <p style="margin:10px 0;font-size:14px;color:${brand.muted};text-align:left;">Samen maken we van klusjes doen een feestje 🎉</p>
                   ${footer}
                 </td>
               </tr>
             </table>
             <table role="presentation" width="100%" style="max-width:640px;margin:20px auto 0;text-align:center;">
               <tr>
                 <td>
                   <p style="margin:0;font-size:12px;color:${brand.muted};text-align:center;">Beheer je voorkeuren of log in via <a href="${APP_BASE_URL}/app" style="color:${brand.primary};text-decoration:none;">de KlusjesKoning app</a>.</p>
                 </td>
               </tr>
             </table>
           </td>
         </tr>
       </table>
     </body>
   </html>`;
}

export function renderWelcomeEmail({
  familyName,
  familyCode,
}: {
  familyName: string;
  familyCode: string;
}): EmailPayload {
  const subject = 'Welkom bij KlusjesKoning! 🎉';
  const html = renderBaseEmail({
    previewText: `Welkom ${familyName}! Activeer jullie gezinscode ${familyCode}.`,
    heading: `Welkom, ${familyName}!`,
    intro:
      'Jullie zijn klaar om klusjes, beloningen en plezier te combineren. Met jullie unieke gezinscode loggen kinderen veilig in en verdienen ze samen punten.',
    contentBlocks: [
      {
        title: 'Jullie gezinscode',
        body: [
          'Gebruik deze code om je kinderen toegang te geven:',
          `<div style="text-align:center;margin:20px 0;"><strong style="color:${brand.primary};font-size:24px;letter-spacing:2px;background:#f8fafc;padding:12px 24px;border-radius:8px;display:inline-block;">${familyCode}</strong></div>`,
          'Hang hem op een zichtbare plek zodat iedereen mee kan doen!',
        ],
      },
      {
        title: 'Zo starten jullie vandaag nog',
        body: [
          '• Voeg kinderen toe en geef ze een pincode',
          '• Selecteer klusjes of genereer ideeën met de AI-assistent',
          '• Vul de beloningsshop met gezinsmomenten of een goed doel',
        ],
      },
    ],
    cta: {
      label: 'Ga naar jullie dashboard',
      href: `${APP_BASE_URL}/app`,
    },
    footerNote: 'Heb je vragen? Reageer gerust op deze mail, we helpen je snel op weg.',
  });

  return { subject, html };
}

type AdminNotificationPayload = {
  type: 'admin_new_registration';
  to: string;
  data: { 
    familyName: string;
    email: string;
    city: string;
    familyCode: string;
    timestamp: string;
  };
};

export function renderAdminRegistrationNotification({
  familyName,
  email,
  city,
  familyCode,
  timestamp,
}: {
  familyName: string;
  email: string;
  city: string;
  familyCode: string;
  timestamp: string;
}): EmailPayload {
  const isPending = familyCode === 'pending_verification';
  const subject = isPending ? `Nieuwe registratie poging: ${familyName}` : `Nieuwe registratie voltooid: ${familyName}`;
  const statusText = isPending ? 'registratiepoging' : 'voltooide registratie';

  const html = renderBaseEmail({
    previewText: `Nieuwe familie ${statusText}: ${familyName} (${email})`,
    heading: `Nieuwe ${statusText}`,
    intro: `Er heeft zich een nieuwe familie ${isPending ? 'aangemeld' : 'geregistreerd'} op KlusjesKoning.`,
    contentBlocks: [
      {
        title: 'Registratie details',
        body: [
          `• Naam: <strong>${familyName}</strong>`,
          `• E-mail: <strong>${email}</strong>`,
          `• Stad: <strong>${city}</strong>`,
          `• Gezinscode: <strong>${familyCode}</strong>`,
          `• Tijdstip: <strong>${timestamp}</strong>`,
          `• Status: <strong>${isPending ? 'Wacht op verificatie' : 'Voltooid'}</strong>`,
        ],
      },
    ],
    cta: {
      label: 'Bekijk in admin panel',
      href: `${APP_BASE_URL}/admin`,
    },
    footerNote: 'Dit is een automatisch gegenereerd bericht.',
  });

  return { subject, html };
}

export function renderChoreSubmissionEmail({
  parentName,
  childName,
  choreName,
  points,
}: {
  parentName: string;
  childName: string;
  choreName: string;
  points: number;
}): EmailPayload {
  const subject = `${childName} heeft een klusje ingediend ✨`;
  const html = renderBaseEmail({
    previewText: `${childName} wacht op je goedkeuring voor ${choreName}.`,
    heading: `${childName} wacht op je 👍`,
    intro: `${childName} diende zojuist “${choreName}” in. Jij hebt het laatste woord om de ⭐ punten toe te kennen.`,
    contentBlocks: [
      {
        body: [
          `• Klusje: <strong>${choreName}</strong>`,
          `• Punten: <strong>${points}</strong>`,
          '• Ga naar “Goedkeuren” in je dashboard om te bevestigen of terug te sturen.',
        ],
      },
      {
        title: 'Tip',
        body: [
          'Geef een compliment of vraag naar een foto voor extra motivatie. Elke snelle reactie houdt het spel levendig!',
        ],
      },
    ],
    cta: {
      label: 'Open goed te keuren klusjes',
      href: `${APP_BASE_URL}/app`,
    },
    footerNote: `Bedankt ${parentName}, samen bouwen jullie aan het KlusjesKoninkrijk!`,
  });

  return { subject, html };
}

export function renderRewardRedemptionEmail({
  parentName,
  childName,
  rewardName,
  points,
}: {
  parentName: string;
  childName: string;
  rewardName: string;
  points: number;
}): EmailPayload {
  const subject = `${childName} kocht "${rewardName}" 🛒`;
  const html = renderBaseEmail({
    previewText: `${childName} wisselde ${points} punten in voor ${rewardName}.`,
    heading: `${childName} verzilverde een beloning!`,
    intro: `${childName} gebruikte ${points} punten om "${rewardName}" te bemachtigen. Tijd om het moment samen te plannen!`,
    contentBlocks: [
      {
        body: [
          '• Check jullie beloningslijst en bevestig wanneer het uitgevoerd is.',
          '• Maak het extra feestelijk door samen een foto te maken of een compliment te geven in de app.',
        ],
      },
      {
        title: 'Samen vieren',
        body: [
          'Het belonen van inzet motiveert kinderen enorm. Bespreek wat ze geweldig deden en welk doel ze hierna willen halen.',
        ],
      },
    ],
    cta: {
      label: 'Bekijk pending beloningen',
      href: `${APP_BASE_URL}/app`,
    },
    footerNote: `Veel plezier, ${parentName}!`,
  });

  return { subject, html };
}

export function renderVerificationEmail({
  code,
}: {
  code: string;
}): EmailPayload {
  const subject = 'Verificeer je emailadres - KlusjesKoning';
  const html = renderBaseEmail({
    previewText: `Je verificatiecode is: ${code}`,
    heading: 'Verificeer je emailadres',
    intro: 'Welkom bij KlusjesKoning! Gebruik de onderstaande code om je emailadres te verifiëren.',
    contentBlocks: [
      {
        title: 'Jouw verificatiecode',
        body: [
          `Gebruik deze code om je account te activeren:`,
          `<strong style="color:${brand.primary};font-size:32px;letter-spacing:4px;display:block;text-align:center;margin:20px 0;">${code}</strong>`,
          `Deze code verloopt over 24 uur.`,
        ],
      },
      {
        title: 'Waarom verifiëren?',
        body: [
          'Email verificatie helpt ons om:',
          '• Je account veilig te houden',
          '• Belangrijke updates te sturen',
          '• Je wachtwoord te herstellen indien nodig',
        ],
      },
    ],
    cta: {
      label: 'Ga naar KlusjesKoning',
      href: `${APP_BASE_URL}/app`,
    },
    footerNote: 'Heb je deze email niet verwacht? Neem dan contact met ons op.',
  });

  return { subject, html };
}
