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
        ? `<h2 style="margin:0 0 12px;font-size:20px;color:${brand.text};font-weight:700;">${block.title}</h2>`
        : '';
      const paragraphs = block.body
        .map(
          (paragraph) =>
            `<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${brand.muted};">${paragraph}</p>`
        )
        .join('');

      return `
        <tr>
          <td style="padding:18px 0;border-bottom:1px solid #e2e8f0;">
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
          <td style="padding:24px 0;">
            <a href="${cta.href}" style="display:inline-block;padding:14px 28px;background:${brand.primary};color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;">
              ${cta.label}
            </a>
          </td>
        </tr>
      `
    : '';

  const footer = footerNote
    ? `<p style="margin:16px 0 0;font-size:13px;color:${brand.muted};line-height:1.6;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
  <html lang="nl">
    <head>
      <meta charSet="utf-8" />
      <title>${heading}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="margin:0;padding:0;background:${brand.background};font-family:'Inter','Segoe UI',sans-serif;">
      <span style="display:none !important;color:${brand.background};">${previewText}</span>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:${brand.background};padding:40px 16px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:640px;margin:0 auto;background:${brand.cardBg};border-radius:32px;padding:40px 36px;box-shadow:0 20px 45px rgba(14,165,233,0.15);">
              <tr>
                <td style="text-align:center;padding-bottom:28px;">
                  <a href="${APP_BASE_URL}" style="text-decoration:none;color:${brand.text};display:inline-flex;align-items:center;gap:12px;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg, ${brand.primary}, ${brand.accent});color:#ffffff;font-size:26px;font-weight:700;">KK</span>
                    <span style="font-size:22px;font-weight:700;">KlusjesKoning</span>
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:${brand.text};">${heading}</h1>
                  <p style="margin:0 0 22px;font-size:17px;line-height:1.7;color:${brand.muted};">${intro}</p>
                </td>
              </tr>
              ${sections}
              ${ctaButton}
              <tr>
                <td style="padding-top:20px;border-top:1px solid #e2e8f0;">
                  <p style="margin:10px 0;font-size:14px;color:${brand.muted};">Samen maken we van klusjes doen een feestje 🎉</p>
                  ${footer}
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" style="max-width:640px;margin:20px auto 0;text-align:center;">
              <tr>
                <td>
                  <p style="margin:0;font-size:12px;color:${brand.muted};">Beheer je voorkeuren of log in via <a href="${APP_BASE_URL}/app" style="color:${brand.primary};text-decoration:none;">de KlusjesKoning app</a>.</p>
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
          `Gebruik deze code om je kinderen toegang te geven: <strong style="color:${brand.primary};font-size:18px;">${familyCode}</strong>. Hang hem op een zichtbare plek zodat iedereen mee kan doen.`,
        ],
      },
      {
        title: 'Zo starten jullie vandaag nog',
        body: [
          '✔ Voeg kinderen toe en geef ze een pincode.',
          '✔ Selecteer klusjes of genereer ideeën met de AI-assistent.',
          '✔ Vul de beloningsshop met gezinsmomenten of een goed doel.',
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
  const subject = `${childName} kocht “${rewardName}” 🛒`;
  const html = renderBaseEmail({
    previewText: `${childName} wisselde ${points} punten in voor ${rewardName}.`,
    heading: `${childName} verzilverde een beloning!`,
    intro: `${childName} gebruikte ${points} punten om “${rewardName}” te bemachtigen. Tijd om het moment samen te plannen!`,
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
