import sgMail from '@sendgrid/mail';
import { renderWelcomeEmail, renderAdminRegistrationNotification, renderChoreSubmissionEmail, renderRewardRedemptionEmail, renderVerificationEmail } from './templates';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

type EmailType = 'welcome_parent' | 'chore_submitted' | 'reward_redeemed' | 'admin_new_registration' | 'verification_code';

interface EmailData {
  to: string;
  type: EmailType;
  data: Record<string, any>;
}

export async function sendEmail({ to, type, data }: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    let emailContent;

    switch (type) {
      case 'welcome_parent':
        emailContent = renderWelcomeEmail({
          familyName: data.familyName,
          familyCode: data.familyCode,
        });
        break;

      case 'admin_new_registration':
        emailContent = renderAdminRegistrationNotification({
          familyName: data.familyName,
          email: data.email,
          city: data.city,
          familyCode: data.familyCode,
          timestamp: data.timestamp,
        });
        break;

      case 'chore_submitted':
        emailContent = renderChoreSubmissionEmail({
          parentName: data.parentName,
          childName: data.childName,
          choreName: data.choreName,
          points: data.points,
        });
        break;

      case 'reward_redeemed':
        emailContent = renderRewardRedemptionEmail({
          parentName: data.parentName,
          childName: data.childName,
          rewardName: data.rewardName,
          points: data.points,
        });
        break;

      case 'verification_code':
        emailContent = renderVerificationEmail({
          code: data.verificationCode,
        });
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    await sgMail.send(msg);

    return { success: true };
  } catch (error) {
    console.error('[SendGrid] Email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}