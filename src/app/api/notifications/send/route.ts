import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';

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
    }
  | {
      type: 'verification_code';
      to: string;
      data: { verificationCode: string; familyName: string };
    };

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NotificationPayload;

    if (!payload?.type || !payload?.to) {
      return NextResponse.json({ success: false, error: 'Invalid payload.' }, { status: 400 });
    }

    // Send email directly via SendGrid
    const result = await sendEmail({
      to: payload.to,
      type: payload.type,
      data: payload.data,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('[notifications/send] error', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send email.'
    }, { status: 500 });
  }
}

// GET endpoint for email service status
export async function GET() {
  try {
    // Check if SendGrid is configured
    const isConfigured = !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);

    return NextResponse.json({
      success: true,
      status: 'operational',
      service: 'SendGrid Direct',
      configured: isConfigured
    });
  } catch (error) {
    console.error('[notifications/status] error', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get service status.'
    }, { status: 500 });
  }
}