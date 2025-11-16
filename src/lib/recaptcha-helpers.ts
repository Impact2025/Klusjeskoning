/**
 * Helper functions for integrating reCAPTCHA v3 in forms
 * Import these functions in your form components
 */

import { executeRecaptcha } from '@/components/analytics/GoogleReCaptcha';

/**
 * Add reCAPTCHA token to form submission
 * Use this in your form's onSubmit handler
 * 
 * @example
 * ```tsx
 * const handleSubmit = async (e: FormEvent) => {
 *   e.preventDefault();
 *   const token = await getRecaptchaToken('login');
 *   if (!token) {
 *     toast.error('reCAPTCHA verification failed');
 *     return;
 *   }
 *   // Submit form with token
 *   await submitForm({ ...formData, recaptchaToken: token });
 * };
 * ```
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  try {
    const token = await executeRecaptcha(action);
    if (!token) {
      console.warn('reCAPTCHA token not generated');
      return null;
    }
    return token;
  } catch (error) {
    console.error('Error getting reCAPTCHA token:', error);
    return null;
  }
}

/**
 * Verify reCAPTCHA token in API route
 * Use this in your API route handlers
 * 
 * @example
 * ```tsx
 * // In your API route (e.g., app/api/login/route.ts)
 * export async function POST(request: Request) {
 *   const { email, password, recaptchaToken } = await request.json();
 *   
 *   const verification = await verifyRecaptchaInAPI(recaptchaToken, 'login');
 *   if (!verification.success) {
 *     return Response.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
 *   }
 *   
 *   // Proceed with login logic
 * }
 * ```
 */
export async function verifyRecaptchaInAPI(
  token: string,
  expectedAction: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured');
    return { success: false, error: 'reCAPTCHA not configured' };
  }

  if (!token) {
    return { success: false, error: 'No reCAPTCHA token provided' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        success: false, 
        error: 'reCAPTCHA verification failed',
      };
    }

    // Verify action matches
    if (data.action !== expectedAction) {
      return { 
        success: false, 
        error: `Action mismatch: expected ${expectedAction}, got ${data.action}`,
      };
    }

    // Check score (0.0 = bot, 1.0 = human)
    // Adjust threshold based on your needs (0.5 is recommended)
    const minScore = 0.5;
    if (data.score < minScore) {
      return { 
        success: false, 
        score: data.score,
        error: `Score too low: ${data.score}`,
      };
    }

    return { 
      success: true, 
      score: data.score,
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { 
      success: false, 
      error: 'Verification request failed',
    };
  }
}

/**
 * Common reCAPTCHA actions for your app
 * Use these constants to ensure consistency
 */
export const RECAPTCHA_ACTIONS = {
  LOGIN: 'login',
  REGISTER: 'register',
  CONTACT: 'contact',
  SUBMIT_CHORE: 'submit_chore',
  REDEEM_REWARD: 'redeem_reward',
  CHECKOUT: 'checkout',
  PASSWORD_RESET: 'password_reset',
} as const;