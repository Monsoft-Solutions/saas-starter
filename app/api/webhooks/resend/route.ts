/**
 * Resend Webhook Handler
 *
 * External webhook endpoint for receiving Resend email delivery events.
 * This endpoint is called directly by Resend and uses Svix signature verification
 * for authentication instead of user sessions.
 *
 * NOTE: This is an external webhook and does not follow the standard validated
 * handler pattern. Validation is handled by Svix signature verification and
 * Zod schema validation of the webhook payload.
 *
 * @route POST /api/webhooks/resend
 * @external Resend Webhook
 */

import { NextResponse } from 'next/server';
import { resendWebhookEventSchema } from '@/lib/types';
import { updateEmailLogStatus } from '@/lib/db/queries';
import { Webhook } from 'svix';
import { env } from '@/lib/env';
import logger from '@/lib/logger/logger.service';

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const headers = req.headers;

    const wh = new Webhook(env.RESEND_WEBHOOK_SECRET);
    let body;
    try {
      body = wh.verify(payload, {
        'svix-id': headers.get('svix-id')!,
        'svix-timestamp': headers.get('svix-timestamp')!,
        'svix-signature': headers.get('svix-signature')!,
      });
    } catch (err) {
      logger.error('Error verifying Resend webhook signature', { error: err });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const parsed = resendWebhookEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { type, data } = parsed.data;
    const { email_id } = data;

    // TODO: Handle other types of events
    switch (type) {
      case 'email.sent':
        await updateEmailLogStatus(email_id, 'sent');
        break;
      case 'email.delivered':
        await updateEmailLogStatus(email_id, 'delivered');
        break;
      case 'email.bounced':
        await updateEmailLogStatus(email_id, 'bounced');
        break;
      case 'email.complained':
        await updateEmailLogStatus(email_id, 'complained');
        break;
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    logger.error('Error processing Resend webhook', { error });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
