import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

import {
  renderChoreSubmissionEmail,
  renderRewardRedemptionEmail,
  renderWelcomeEmail,
} from '@/lib/email/templates';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'hello@klusjeskoning.nl';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

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
    };

export async function POST(request: Request) {
  if (!SENDGRID_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'SendGrid API key is not configured.' },
      { status: 500 }
    );
  }

  try {
    const payload = (await request.json()) as NotificationPayload;

    if (!payload?.type || !payload?.to) {
      return NextResponse.json({ success: false, error: 'Invalid payload.' }, { status: 400 });
    }

    let subject: string;
    let html: string;

    switch (payload.type) {
      case 'welcome_parent': {
        const email = renderWelcomeEmail(payload.data);
        subject = email.subject;
        html = email.html;
        break;
      }
      case 'chore_submitted': {
        const email = renderChoreSubmissionEmail(payload.data);
        subject = email.subject;
        html = email.html;
        break;
      }
      case 'reward_redeemed': {
        const email = renderRewardRedemptionEmail(payload.data);
        subject = email.subject;
        html = email.html;
        break;
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown notification type.' }, { status: 400 });
    }

    await sgMail.send({
      to: payload.to,
      from: SENDGRID_FROM_EMAIL,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications/send] error', error);
    return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 });
  }
}
