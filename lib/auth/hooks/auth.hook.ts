import { auth } from '@/lib/auth';
import { ActivityType } from '@/lib/types';
import { sendWelcomeEmailAsync } from '@/lib/emails/enqueue';
import { generateOrganizationSlug } from '@/lib/utils';
import { logActivity } from '@/lib/db/queries';
import logger from '@/lib/logger/logger.service';

export const databaseHooks = {
  user: {
    create: {
      after: async (user: any) => {
        // Send welcome email asynchronously
        await sendWelcomeEmailAsync({
          to: user.email,
          recipientName: user.name,
          dashboardUrl: '/app/general',
        });

        await logActivity(user.id, ActivityType.SIGN_UP);

        // Create a default organization for the new user
        const organizationName = `${
          user.name || user.email.split('@')[0]
        }'s Organization`;
        const slug = generateOrganizationSlug(organizationName);

        try {
          const newOrganization = await auth.api.createOrganization({
            body: {
              name: organizationName,
              slug,
              userId: user.id,
            },
          });

          if (newOrganization) {
            await logActivity(user.id, ActivityType.CREATE_ORGANIZATION);
          }
        } catch (error) {
          logger.error('Failed to create default organization for user', {
            userId: user.id,
            error,
          });
        }
      },
    },
  },
};
