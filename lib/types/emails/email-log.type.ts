import { EmailLog } from '@/lib/db/schemas';

export type CreateEmailLog = Omit<EmailLog, 'id'>;
export type NewEmailLog = CreateEmailLog;
