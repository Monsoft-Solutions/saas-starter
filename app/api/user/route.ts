import { withApiAuth } from '@/lib/server/api-handler';

export const GET = withApiAuth(async ({ context }) => context.user);
