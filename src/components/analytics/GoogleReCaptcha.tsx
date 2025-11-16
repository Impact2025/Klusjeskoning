'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function GoogleReCaptcha({ siteKey }: { siteKey: string }) {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    // Check if user has given consent
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    setConsent(hasConsent);
  }, []);

  if (!siteKey || !consent) {
    return null;
  }

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
      strategy="afterInteractive"
    />
  );
}

/**
 * Execute reCAPTCHA v3 and get a token
 * @param action - The action name (e.g., 'login', 'register', 'contact')
 * @returns Promise with the reCAPTCHA token
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // Check if user has given consent
  const hasConsent = localStorage.getItem('analytics-consent') === 'true';
  if (!hasConsent) return null;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    console.warn('reCAPTCHA site key not configured');
    return null;
  }

  try {
    return await new Promise((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action });
          resolve(token);
        } catch (error) {
          console.error('reCAPTCHA execution error:', error);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('reCAPTCHA error:', error);
    return null;
  }
}

/**
 * Verify reCAPTCHA token on the server side
 * This should be called from your API routes
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction?: string
): Promise<{ success: boolean; score?: number; action?: string; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    return { success: false, error: 'reCAPTCHA secret key not configured' };
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

    // Check if verification was successful
    if (!data.success) {
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    // Check if action matches (optional but recommended)
    if (expectedAction && data.action !== expectedAction) {
      return { 
        success: false, 
        error: `Action mismatch: expected ${expectedAction}, got ${data.action}` 
      };
    }

    // Check score (reCAPTCHA v3 returns a score between 0.0 and 1.0)
    // 1.0 is very likely a good interaction, 0.0 is very likely a bot
    // You can adjust the threshold based on your needs
    const minScore = 0.5;
    if (data.score < minScore) {
      return { 
        success: false, 
        score: data.score,
        error: `Score too low: ${data.score}` 
      };
    }

    return { 
      success: true, 
      score: data.score,
      action: data.action 
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'Verification request failed' };
  }
}