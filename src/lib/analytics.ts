// Analytics event tracking utilities
// These functions safely track events to Google Analytics and other analytics platforms

type EventParams = {
  [key: string]: string | number | boolean;
};

/**
 * Track a custom event to Google Analytics
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === 'undefined') return;

  // Check if user has given consent
  const hasConsent = localStorage.getItem('analytics-consent') === 'true';
  if (!hasConsent) return;

  // Track to Google Analytics
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }

  // Track to Microsoft Clarity (if needed)
  if ((window as any).clarity) {
    (window as any).clarity('event', eventName);
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, params);
  }
}

// ===========================
// USER AUTHENTICATION EVENTS
// ===========================

export function trackUserRegistration(method: 'email' | 'google') {
  trackEvent('user_registration', {
    method,
    timestamp: new Date().toISOString(),
  });
}

export function trackUserLogin(userType: 'parent' | 'child' | 'admin') {
  trackEvent('user_login', {
    user_type: userType,
    timestamp: new Date().toISOString(),
  });
}

export function trackUserLogout() {
  trackEvent('user_logout', {
    timestamp: new Date().toISOString(),
  });
}

// ===========================
// E-COMMERCE EVENTS (Checkout)
// ===========================

export function trackCheckoutStarted(plan: 'starter' | 'premium') {
  trackEvent('begin_checkout', {
    plan_type: plan,
    currency: 'EUR',
    value: plan === 'premium' ? 4.99 : 0,
  });
}

export function trackPurchaseCompleted(plan: 'premium', value: number, transactionId: string) {
  trackEvent('purchase', {
    plan_type: plan,
    currency: 'EUR',
    value,
    transaction_id: transactionId,
  });
}

export function trackCheckoutAbandoned(plan: 'premium', step: string) {
  trackEvent('checkout_abandoned', {
    plan_type: plan,
    step,
  });
}

// ===========================
// APP USAGE EVENTS
// ===========================

export function trackChoreCreated(choreType?: string) {
  trackEvent('chore_created', {
    chore_type: choreType || 'custom',
  });
}

export function trackChoreCompleted(points: number) {
  trackEvent('chore_completed', {
    points_earned: points,
  });
}

export function trackChoreApproved() {
  trackEvent('chore_approved');
}

export function trackChoreRejected() {
  trackEvent('chore_rejected');
}

export function trackRewardCreated(rewardType?: string) {
  trackEvent('reward_created', {
    reward_type: rewardType || 'custom',
  });
}

export function trackRewardRedeemed(points: number, rewardName?: string) {
  trackEvent('reward_redeemed', {
    points_spent: points,
    reward_name: rewardName || 'unknown',
  });
}

export function trackRewardFulfilled() {
  trackEvent('reward_fulfilled');
}

export function trackDonationMade(points: number, cause?: string) {
  trackEvent('donation_made', {
    points_donated: points,
    cause: cause || 'unknown',
  });
}

// ===========================
// PROFILE & SETUP EVENTS
// ===========================

export function trackChildProfileCreated() {
  trackEvent('child_profile_created');
}

export function trackFamilySetupCompleted() {
  trackEvent('family_setup_completed');
}

export function trackOnboardingCompleted(userType: 'parent' | 'child') {
  trackEvent('onboarding_completed', {
    user_type: userType,
  });
}

// ===========================
// FEATURE USAGE EVENTS
// ===========================

export function trackAIAssistantUsed(promptType: 'chore_ideas' | 'reward_ideas') {
  trackEvent('ai_assistant_used', {
    prompt_type: promptType,
  });
}

export function trackQRCodeScanned() {
  trackEvent('qr_code_scanned');
}

export function trackRecoveryCodeUsed() {
  trackEvent('recovery_code_used');
}

export function trackLevelUp(newLevel: number) {
  trackEvent('level_up', {
    new_level: newLevel,
  });
}

// ===========================
// ENGAGEMENT EVENTS
// ===========================

export function trackPageView(pageName: string) {
  trackEvent('page_view', {
    page_name: pageName,
    page_location: window.location.pathname,
  });
}

export function trackCTAClick(ctaName: string, location: string) {
  trackEvent('cta_click', {
    cta_name: ctaName,
    location,
  });
}

export function trackBlogPostRead(postTitle: string, readTime: number) {
  trackEvent('blog_post_read', {
    post_title: postTitle,
    read_time_seconds: readTime,
  });
}

export function trackShareAction(platform: 'facebook' | 'twitter' | 'whatsapp' | 'email', content: string) {
  trackEvent('share', {
    platform,
    content_type: content,
  });
}

// ===========================
// ERROR & SUPPORT EVENTS
// ===========================

export function trackError(errorType: string, errorMessage?: string) {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage || 'unknown',
  });
}

export function trackSupportRequested(reason: string) {
  trackEvent('support_requested', {
    reason,
  });
}

// ===========================
// SEARCH & DISCOVERY
// ===========================

export function trackSearch(query: string, resultsCount: number) {
  trackEvent('search', {
    search_term: query,
    results_count: resultsCount,
  });
}

export function trackFilterApplied(filterType: string, filterValue: string) {
  trackEvent('filter_applied', {
    filter_type: filterType,
    filter_value: filterValue,
  });
}
