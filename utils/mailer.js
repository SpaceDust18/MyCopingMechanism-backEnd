// utility/mailer.js
import nodemailer from "nodemailer";

/**
 * Required env:
 *   MAIL_USER                // your Gmail address (the authenticated sender)
 *   MAIL_PASS                // 16-char Google App Password (NOT your Gmail password)
 *
 * Optional env:
 *   CONTACT_NOTIFY_TO        // where owner notifications are delivered (defaults to MAIL_USER)
 *   MAIL_SEND_CONFIRM=true   // set to "false" to disable visitor confirmations
 *   SITE_NAME="MyCopingMechanism"
 *   SITE_URL="http://localhost:5173"
 *
 * Advanced (optional DKIM – only if you want to set it up later):
 *   DKIM_DOMAIN
 *   DKIM_SELECTOR
 *   DKIM_PRIVATE_KEY         // multiline key; keep safe
 */

const SITE_NAME = process.env.SITE_NAME || "MyCopingMechanism";
const SITE_URL = process.env.SITE_URL || "http://localhost:5173";

function must(val, key) {
  if (!val) throw new Error(`[mailer] Missing env ${key}`);
  return val;
}

function buildTransporter() {
  const user = must(process.env.MAIL_USER, "MAIL_USER");
  const pass = must(process.env.MAIL_PASS, "MAIL_PASS");

  // Base Gmail transport
  const base = {
    service: "gmail",
    auth: { user, pass },
  };

  // Optional DKIM (safe to omit)
  if (process.env.DKIM_DOMAIN && process.env.DKIM_SELECTOR && process.env.DKIM_PRIVATE_KEY) {
    base.dkim = {
      domainName: process.env.DKIM_DOMAIN,
      keySelector: process.env.DKIM_SELECTOR,
      privateKey: process.env.DKIM_PRIVATE_KEY,
    };
  }

  return nodemailer.createTransport(base);
}

const transporter = buildTransporter();

// One-time verify (non-fatal if it fails; you’ll see logs either way)
transporter
  .verify()
  .then(() => console.log("[mailer] Transporter verified and ready."))
  .catch((err) => console.error("[mailer] Transporter verification failed:", err?.message));

function logSend(label, info) {
  console.log(`[mailer] ${label}`, {
    messageId: info?.messageId,
    accepted: info?.accepted,
    rejected: info?.rejected,
    response: info?.response,
  });
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ---------- HTML templates ---------- **/

function wrapCard(innerHtml) {
  // Basic, widely-supported email layout (inline styles, no external CSS)
  return `
  <div style="background:#f4f4f4; padding:24px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial; color:#111;">
    <div style="max-width:640px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:16px;">
        <div style="display:inline-block; padding:10px 14px; background:#111827; color:#fff; border-radius:8px; font-weight:600;">
          ${escapeHtml(SITE_NAME)}
        </div>
      </div>

      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
        <div style="padding:20px 22px;">
          ${innerHtml}
        </div>
      </div>

      <div style="text-align:center; margin-top:14px; color:#6b7280; font-size:12px;">
        <div>${escapeHtml(SITE_NAME)} • <a href="${escapeHtml(
          SITE_URL
        )}" style="color:#6b7280; text-decoration:underline;">${escapeHtml(SITE_URL)}</a></div>
      </div>
    </div>
  </div>
  `;
}

function ownerHtml({ fromEmail, name, message }) {
  return wrapCard(`
    <h2 style="margin:0 0 8px; font-size:18px;">New contact form message</h2>
    <p style="margin:0 0 10px; color:#374151;">
      <strong style="color:#111">${escapeHtml(name || "Unknown")}</strong>
      &lt;${escapeHtml(fromEmail || "no-email")}&gt;
    </p>
    <div style="margin-top:12px;">
      <div style="font-weight:600; margin-bottom:6px;">Message:</div>
      <pre style="white-space:pre-wrap; background:#f9fafb; padding:12px; border:1px solid #e5e7eb; border-radius:6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:13px;">${escapeHtml(
        message || "(empty)"
      )}</pre>
    </div>

    <div style="text-align:center; margin-top:20px;">
      <a href="${escapeHtml(SITE_URL)}" style="display:inline-block; background:#111827; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none;">
        Open ${escapeHtml(SITE_NAME)}
      </a>
    </div>
  `);
}

function confirmHtml({ name }) {
  const hi = name ? `Hi <strong>${escapeHtml(name)}</strong>,` : "Hi there,";
  return wrapCard(`
    <p style="margin:0 0 10px;">${hi}</p>
    <p style="margin:0 0 10px;">Thanks for reaching out! We received your message and will get back to you soon.</p>
    <p style="margin:0;">— The ${escapeHtml(SITE_NAME)} Team</p>

    <div style="text-align:center; margin-top:20px;">
      <a href="${escapeHtml(SITE_URL)}" style="display:inline-block; background:#111827; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none;">
        Visit ${escapeHtml(SITE_NAME)}
      </a>
    </div>
  `);
}

/** ---------- Public API ---------- **/

/**
 * Sends the site-owner notification (required),
 * and a visitor confirmation (best-effort, optional).
 *
 * @param {Object} opts
 * @param {string} [opts.to]         - owner inbox; defaults to CONTACT_NOTIFY_TO || MAIL_USER
 * @param {string} opts.fromEmail    - visitor email (used as Reply-To and for confirmation)
 * @param {string} opts.name         - visitor name
 * @param {string} opts.message      - visitor message
 * @returns {Promise<{ok: boolean, ownerMessageId?: string, confirmMessageId?: string}>}
 */
export async function sendContactEmail({ to, fromEmail, name, message }) {
  const ownerTo =
    (to || process.env.CONTACT_NOTIFY_TO || process.env.MAIL_USER || "").trim();
  if (!ownerTo) throw new Error("No destination email for contact notification.");

  // 1) Owner notification (must send)
  const ownerInfo = await transporter.sendMail({
    from: process.env.MAIL_USER,                 // Gmail must match authenticated user
    to: ownerTo,
    subject: `New ${SITE_NAME} contact from ${name || "visitor"}`,
    text:
      `From: ${name || "Unknown"} <${fromEmail || "no-email"}>\n\n` +
      `Message:\n${message || "(empty)"}`,
    html: ownerHtml({ fromEmail, name, message }),
    replyTo: fromEmail || undefined,
  });
  logSend("Owner notification sent", ownerInfo);

  // 2) Optional confirmation to visitor
  let confirmInfo = null;
  const wantConfirm = (process.env.MAIL_SEND_CONFIRM ?? "true").toLowerCase() !== "false";
  if (wantConfirm && isValidEmail(fromEmail)) {
    try {
      confirmInfo = await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: fromEmail,
        subject: `Thanks for contacting ${SITE_NAME}`,
        text:
          `Hi ${name || "there"},\n\n` +
          `Thanks for reaching out! We received your message and will get back to you soon.\n\n` +
          `— ${SITE_NAME}`,
        html: confirmHtml({ name }),
      });
      logSend("Visitor confirmation sent", confirmInfo);
    } catch (e) {
      console.error("[mailer] Confirmation email failed:", e?.message);
    }
  }

  return {
    ok: true,
    ownerMessageId: ownerInfo?.messageId,
    ...(confirmInfo ? { confirmMessageId: confirmInfo?.messageId } : {}),
  };
}

/** If you ever want to call these separately elsewhere: */
export async function sendOwnerMail({ fromEmail, name, message, to }) {
  return sendContactEmail({ to, fromEmail, name, message });
}
export async function sendContactMail({ to, name }) {
  if (!isValidEmail(to)) return { ok: false, skipped: true };
  const info = await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: `Thanks for contacting ${SITE_NAME}`,
    text:
      `Hi ${name || "there"},\n\n` +
      `Thanks for reaching out! We received your message and will get back to you soon.\n\n` +
      `— ${SITE_NAME}`,
    html: confirmHtml({ name }),
  });
  logSend("Visitor confirmation (direct) sent", info);
  return { ok: true, messageId: info.messageId };
}