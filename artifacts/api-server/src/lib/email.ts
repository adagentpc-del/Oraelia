import { logger } from "./logger";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailAdapter {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Dev adapter: logs the message instead of sending. Swap in a real provider
 * (Resend, SES, Postmark…) by implementing EmailAdapter and switching on an
 * env var here — routes depend only on `sendEmail`.
 */
const consoleAdapter: EmailAdapter = {
  async send(message) {
    logger.info(
      { to: message.to, subject: message.subject },
      `email (dev, not sent): ${message.text.slice(0, 400)}`,
    );
  },
};

function resolveAdapter(): EmailAdapter {
  // Future: if (process.env.RESEND_API_KEY) return resendAdapter; etc.
  return consoleAdapter;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await resolveAdapter().send(message);
}

export function emailConfigured(): boolean {
  return false; // flips when a real adapter is wired above
}
