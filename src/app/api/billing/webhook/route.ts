import { NextRequest, NextResponse } from 'next/server';
import { processSecureWebhook } from '@/lib/webhook-security';
import { checkWebhookRateLimit } from '@/lib/rate-limit';
import { applyCouponToOrder } from '@/server/services/family-service';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for webhook endpoint
    const rateLimitResult = await checkWebhookRateLimit(request);
    if (!rateLimitResult.success) {
      console.warn('Webhook rate limit exceeded');
      return NextResponse.json(
        { received: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Process webhook with security validation
    const webhookSecret = process.env.MULTISAFEPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('MULTISAFEPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { received: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const result = await processSecureWebhook(request, webhookSecret);

    if (!result.isValid) {
      console.warn('Invalid webhook received:', result.error);
      return NextResponse.json(
        { received: false, error: result.error },
        { status: 401 }
      );
    }

    const payload = result.payload;
    console.log('MultiSafepay webhook verified and received:', {
      orderId: payload?.order_id,
      status: payload?.status,
      timestamp: new Date().toISOString(),
    });

    // Process successful payment
    if (payload?.status === 'completed' && payload?.order_id) {
      try {
        const orderId = payload.order_id;
        const customInfo = payload.custom_info as any;

        if (customInfo?.coupon_id && customInfo?.family_id) {
          // Apply coupon discount to completed order
          await applyCouponToOrder(
            customInfo.coupon_id,
            customInfo.family_id,
            orderId,
            customInfo.original_amount || 0
          );

          console.log(`Coupon ${customInfo.coupon_id} applied to order ${orderId}`);
        }

        // Update subscription status in database
        if (customInfo?.family_id && customInfo?.plan && customInfo?.subscription_interval) {
          const { upgradeFamilyToPro } = await import('@/server/services/family-service');

          await upgradeFamilyToPro(customInfo.family_id, {
            plan: customInfo.plan,
            interval: customInfo.subscription_interval,
            orderId: orderId,
          });

          console.log(`Subscription upgraded for family ${customInfo.family_id}, plan: ${customInfo.plan}, interval: ${customInfo.subscription_interval}`);
        }

        // Send confirmation email
        if (customInfo?.family_id) {
          try {
            const { loadFamilyWithRelations } = await import('@/server/services/family-service');
            const family = await loadFamilyWithRelations(customInfo.family_id) as { email: string; familyName: string; familyCode: string } | null;

            if (family) {
              const { sendEmail } = await import('@/lib/email/sendgrid');

              // Send welcome/premium confirmation email
              await sendEmail({
                to: family.email,
                type: 'welcome_parent',
                data: {
                  familyName: family.familyName,
                  familyCode: family.familyCode,
                },
              });

              console.log(`Confirmation email sent to ${family.email}`);
            }
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the webhook for email errors
          }
        }

      } catch (error) {
        console.error('Error processing successful payment:', error);
        // Don't fail the webhook, just log the error
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { received: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
