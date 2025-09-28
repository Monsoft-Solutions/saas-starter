/**
 * Minimal attachment contract mirroring Resend payload support.
 */
export type ResendAttachment = {
  content?: string | Buffer;
  filename?: string | false;
  path?: string;
  contentType?: string;
  contentId?: string;
};
