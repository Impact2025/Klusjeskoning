import { NextResponse } from 'next/server';
import { AutomationService } from '@/server/services/automation-service';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'processRecurringChores':
        await AutomationService.processRecurringChores();
        return NextResponse.json({ success: true, message: 'Recurring chores processed' });

      case 'processAutomaticPayouts':
        await AutomationService.processAutomaticPayouts();
        return NextResponse.json({ success: true, message: 'Automatic payouts processed' });

      case 'sendPayoutReminders':
        await AutomationService.sendPayoutReminders();
        return NextResponse.json({ success: true, message: 'Payout reminders sent' });

      case 'sendBatchApprovalNotifications':
        await AutomationService.sendBatchApprovalNotifications();
        return NextResponse.json({ success: true, message: 'Batch approval notifications sent' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[automation API]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Automation service is running',
    timestamp: new Date().toISOString()
  });
}