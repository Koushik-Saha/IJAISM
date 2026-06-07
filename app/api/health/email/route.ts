import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { Resend } from "resend";

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

  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.SMTP_FROM_EMAIL || "noreply@c5k.co";
  const fromName = process.env.SMTP_FROM_NAME || "C5K Platform";

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      issues: [{ severity: "critical", message: "RESEND_API_KEY is missing from environment variables." }],
      fix: "Add RESEND_API_KEY to your .env and Vercel environment variables.",
    });
  }

  const body = await req.json().catch(() => ({}));
  const toEmail: string = body.to || decoded.email;

  const resend = new Resend(apiKey);
  const tests: Record<string, any> = {};
  const issues: { severity: string; message: string; fix: string }[] = [];

  // ── Test 1: send to Resend account owner's email (always deliverable) ──
  try {
    const r1 = await resend.emails.send({
      from: "C5K Test <onboarding@resend.dev>",
      to: toEmail,
      subject: "✅ C5K Email Test — API Check",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#1a1f35;margin-top:0">C5K Email System Test</h2>
          <p>Your <strong>Resend API key is valid</strong>. This is a delivery test from the platform.</p>
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

    if (r1.error) {
      const msg = r1.error.message || "";
      // Resend restricts test-mode to account owner's email only
      if (msg.includes("own email address")) {
        tests.resend_dev = {
          ok: "restricted",
          note: "Resend requires a verified domain to send to external addresses.",
          resendAccountEmail: msg.match(/\(([^)]+)\)/)?.[1] || "your Resend account email",
        };
        issues.push({
          severity: "warning",
          message: "Resend is in test mode — emails can only be sent to your Resend account email until a domain is verified.",
          fix: `In Resend dashboard → Domains, verify your domain. Then emails will reach any recipient.`,
        });
      } else {
        tests.resend_dev = { ok: false, error: r1.error };
        issues.push({ severity: "error", message: `Resend API error: ${msg}`, fix: "Check your API key." });
      }
    } else {
      tests.resend_dev = { ok: true, id: r1.data?.id };
    }
  } catch (e: any) {
    tests.resend_dev = { ok: false, error: e.message };
  }

  // ── Test 2: send from configured domain ──
  try {
    const r2 = await resend.emails.send({
      from: `${fromName} <${configuredFrom}>`,
      to: toEmail,
      subject: "🔑 C5K Email Test — Custom Domain",
      html: `<p>Domain verification test from ${configuredFrom}</p>`,
    });

    if (r2.error) {
      const msg = r2.error.message || "";
      const configuredDomain = configuredFrom.split("@")[1];

      if (msg.includes("not verified") || msg.includes("domain")) {
        tests.custom_domain = { ok: false, error: msg };
        issues.push({
          severity: "critical",
          message: `Domain "${configuredDomain}" is not verified in Resend.`,
          fix: `Step 1: Make sure the domain in your .env SMTP_FROM_EMAIL matches a domain added in Resend (you have "c5k.com" in Resend but SMTP_FROM_EMAIL uses "c5k.co"). Step 2: In Resend → Domains → click your domain → add the DNS records shown (MX, SPF TXT, DKIM TXT). Step 3: Wait up to 48h for DNS propagation. Domain status will change to "Verified".`,
        });
      } else {
        tests.custom_domain = { ok: false, error: r2.error };
      }
    } else {
      tests.custom_domain = { ok: true, id: r2.data?.id };
    }
  } catch (e: any) {
    tests.custom_domain = { ok: false, error: e.message };
  }

  const apiKeyValid = tests.resend_dev?.ok === true || tests.resend_dev?.ok === "restricted";
  const domainVerified = tests.custom_domain?.ok === true;
  const fullyOperational = apiKeyValid && domainVerified;

  return NextResponse.json({
    ok: fullyOperational,
    sentTo: toEmail,
    configuredFrom,
    apiKeyPrefix: apiKey.slice(0, 8) + "…",
    apiKeyValid,
    domainVerified,
    tests,
    issues,
    summary: fullyOperational
      ? "Email system fully operational."
      : `${issues.length} issue(s) found — see 'issues' array for fixes.`,
  });
}
