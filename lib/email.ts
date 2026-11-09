import nodemailer, { type Transporter } from "nodemailer";

type Mail = { to: string; subject: string; text: string; html: string };

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return (transporter = null);
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 2525),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    // Short timeouts: a dead SMTP server must not hold anything up for long.
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });
  return transporter;
}

/**
 * Sends an email and NEVER throws (SPEC 8): a failure is only logged and must
 * not undo or block the state change that triggered it. Returns whether it was sent.
 */
export async function kirimEmail(mail: Mail): Promise<boolean> {
  try {
    const t = getTransporter();
    if (!t) {
      console.warn("[email] SMTP_HOST belum diset, email tidak dikirim:", mail.subject);
      return false;
    }
    await t.sendMail({ from: process.env.MAIL_FROM, ...mail });
    return true;
  } catch (e) {
    console.error("[email] gagal mengirim:", mail.subject, e instanceof Error ? e.message : e);
    return false;
  }
}

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
