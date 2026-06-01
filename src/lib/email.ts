// Server-only transactional email helper (Resend).
//
// IMPORTANT: never import this from a client component. It relies on the
// server-only env vars RESEND_API_KEY and RESEND_FROM_EMAIL and must never be
// bundled for the browser.
//
// The Resend client is created lazily inside sendEmail (never at module load)
// so that `next build` — which runs with these env vars unset — does not crash,
// and so a missing key is a safe no-op rather than a thrown error.
import { Resend } from 'resend';

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (!to || to.length === 0) {
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn(
      '[email] RESEND_API_KEY or RESEND_FROM_EMAIL is not set — skipping email send.'
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error('[email] Resend returned an error:', error);
    }
  } catch (err) {
    console.error('[email] Failed to send email:', err);
  }
}
