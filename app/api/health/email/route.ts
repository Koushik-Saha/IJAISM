import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getBrevoClient, EMAIL_CONFIG } from "@/lib/email/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decoded = verifyToken(authHeader.split(" ")[1]);
  if (!decoded || !["mother_admin", "super_admin"].includes(decoded.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const brevo = getBrevoClient();
  const apiKey = process.env.BREVO_API_KEY;
  const configuredFrom = EMAIL_CONFIG.from;
  const fromName = EMAIL_CONFIG.fromName;

  if (!apiKey || !brevo) {
    return NextResponse.json({
      ok: false,
      issues: [{ severity: "critical", message: "BREVO_API_KEY is missing from environment variables." }],
      fix: "Add BREVO_API_KEY to your .env and Vercel environment variables.",
    });
  }

  const body = await req.json().catch(() => ({}));
  const toEmail: string = body.to || decoded.email;

  const tests: Record<string, any> = {};
  const issues: { severity: string; message: string; fix: string }[] = [];

  // ── Test: send a health check email via Brevo ──
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: fromName, email: configuredFrom },
      to: [{ email: toEmail }],
      replyTo: { email: EMAIL_CONFIG.replyTo },
      subject: "✅ C5K Email Test — Brevo API Check",
      htmlContent: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#1a1f35;margin-top:0">C5K Email System Test (Brevo)</h2>
          <p>Your <strong>Brevo API key is valid</strong>. This is a delivery test from the platform.</p>
          <table style="width:100%;font-size:13px;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:5px 0;color:#6b7280">Sent to</td><td><strong>${toEmail}</strong></td></tr>
            <tr><td style="padding:5px 0;color:#6b7280">Configured sender</td><td><strong>${configuredFrom}</strong></td></tr>
            <tr><td style="padding:5px 0;color:#6b7280">API key</td><td><strong>${apiKey.slice(0, 8)}…</strong></td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:16px 0"/>
          <p style="font-size:12px;color:#9ca3af;">C5K Platform — Email Health Check</p>
        </div>
      `,
    });

    const msgId = (result as any)?.messageId || (result as any)?.body?.messageId || 'ok';
    tests.brevo_api = { ok: true, id: msgId };
  } catch (e: any) {
    tests.brevo_api = { ok: false, error: e.message };
    issues.push({
      severity: "critical",
      message: `Brevo API error: ${e.message}`,
      fix: "Check your BREVO_API_KEY and verified sender configurations in Brevo dashboard."
    });
  }

  const fullyOperational = tests.brevo_api?.ok === true;

  return NextResponse.json({
    ok: fullyOperational,
    sentTo: toEmail,
    configuredFrom,
    apiKeyPrefix: apiKey.slice(0, 8) + "…",
    apiKeyValid: fullyOperational,
    tests,
    issues,
    summary: fullyOperational
      ? "Email system fully operational via Brevo."
      : `${issues.length} issue(s) found — see 'issues' array for fixes.`,
  });
}
