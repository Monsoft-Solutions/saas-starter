import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db/drizzle';
import { invitation as invitationTable } from '@/lib/db/schemas';
import { eq } from 'drizzle-orm';
import { env } from './env';
import { databaseHooks } from './auth/hooks/auth.hook';
import { enqueueEmailJob } from './jobs/services/email-job.service';

// Helper function to build social providers configuration
const buildSocialProviders = () => {
  const providers: any = {};

  // Google OAuth
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  // Facebook OAuth
  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
      scope: ['public_profile'],
      fields: ['name', 'id'],
    };
  }

  // LinkedIn OAuth
  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    providers.linkedin = {
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
    };
  }

  // TikTok OAuth - Only include if credentials are provided
  // Note: TikTok OAuth has specific PKCE requirements that may not be fully supported
  if (env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET) {
    providers.tiktok = {
      clientKey: env.TIKTOK_CLIENT_KEY,
      clientSecret: env.TIKTOK_CLIENT_SECRET,
      scope: ['user.info.basic'],
    };
  }

  return providers;
};

const socialProviders = buildSocialProviders();
const trustedProviders = ['email-password', ...Object.keys(socialProviders)];

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      trustedProviders,
    },
  },
  socialProviders,
  plugins: [
    organization({
      schema: {
        organization: {
          additionalFields: {
            stripeCustomerId: {
              type: 'string',
              required: false,
              unique: true,
              fieldName: 'stripe_customer_id',
            },
            stripeSubscriptionId: {
              type: 'string',
              required: false,
              unique: true,
              fieldName: 'stripe_subscription_id',
            },
            stripeProductId: {
              type: 'string',
              required: false,
              fieldName: 'stripe_product_id',
            },
            planName: {
              type: 'string',
              required: false,
              fieldName: 'plan_name',
            },
            subscriptionStatus: {
              type: 'string',
              required: false,
              fieldName: 'subscription_status',
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        const inviteUrl = `${env.BASE_URL}/accept-invitation/${data.id}`;

        // Look up invitation expiry from our DB schema for richer email context
        let expiresAtIso: string | undefined;
        try {
          const row = await db
            .select({ expiresAt: invitationTable.expiresAt })
            .from(invitationTable)
            .where(eq(invitationTable.id, data.id))
            .limit(1);
          const expiresAt = row[0]?.expiresAt;
          expiresAtIso = expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined;
        } catch (_) {
          // Non-fatal; proceed without expiry in email
          expiresAtIso = undefined;
        }

        await enqueueEmailJob({
          template: 'teamInvitation',
          to: data.email,
          data: {
            inviterName: data.inviter.user.name,
            teamName: data.organization.name,
            inviteUrl,
            role: data.role as 'member' | 'owner' | 'admin',
            expiresAt: expiresAtIso,
          },
        });
      },
    }),
    nextCookies(),
  ],
  databaseHooks,
});
