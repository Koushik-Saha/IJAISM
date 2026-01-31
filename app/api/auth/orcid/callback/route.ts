
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { exchangeOrcidCode } from '@/lib/orcid/client';

// Helper to get cookie because verifyToken usually checks header, but here we might need to check cookie if this is a browser redirect
// Or we assume the user triggers this from settings and we link by matching... wait.
// OAuth callback comes from ORCID to Server. The Server needs to know WHO the user is.
// Standard pattern: The user must be logged in via session cookie OR we identify them some other way.
// Since we used JWT in localstorage, we can't easily access it in a server-side callback from a third party unless we used cookies.
// OR: We're doing a popup flow? No, full redirect.
// FIX: We need to set a temporary cookie "auth_pending_user_id" before redirecting to ORCID?
// OR: We just assume this feature is only for "Connect Account" and they must have a session cookie.
// BUT: our auth uses Headers 'Authorization: Bearer'. Browser navigation doesn't send that.
// OPTION: We rely on a secure cookie for the session if it exists, or we passed a temporary token in the `state` param (less secure but MVP viable).
// SAFE MVP: Pass a short-lived token in `state`.

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state'); // Contains returnUrl or token?

    if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

    try {
        // Exchange Code
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/auth/orcid/callback`;

        const tokenData = await exchangeOrcidCode(code, redirectUri);

        // tokenData = { fit_orcid_profile, access_token, refresh_token, orcid, name, ... }

        // Here is the problem: We need to know which Local User to attach this ORCID to.
        // In a real app with cookie sessions, we'd read the session.
        // Since we are token based:
        // A) The user started the flow. We can put a signed JWT in a Cookie before redirecting?
        // Let's assume for MVP we set a cookie 'c5k_temp_auth' in the client before clicking "Connect ORCID".

        // Simpler: The State param could contain the encoded UserId (only if signed, but let's assume secure enough for MVP demo).
        // Actually, let's just create a generic "success" page that sends the code to the frontend?
        // NO, that exposes the code.

        // Let's try to extract a cookie. If not, we fail.
        // Assuming we add a cookie in the future. For now, let's handle the "Update User" part.

        // Wait, if we can't identify the user, we can't link it.
        // Use Case: User is in Profile. Clicks "Connect".
        // Solution: Frontend opens specific URL -> /api/auth/orcid?token=JWT
        // Then /api/auth/orcid validates JWT and sets a HTTPOnly cookie "pending_link_user".
        // Then Callback reads cookie.

        // Let's implement the "Cookie strategy" in the init route first? 
        // Or simpler: Return a HTML page that says "Connected! Closing..." and sends message to parent window (Authorization Code Flow with PKCE/Popup pattern).

        // MVP: Just updated the URL to include token query param in init.
        // See updated init route (we didn't do it yet).

        // Let's assume we can find the user by ORCID if they are logging in?
        // But the requirement is "improved Oauth2 integration... to pull verification".

        // Let's Update User if we can find them, or just return success and let frontend handle?
        // "Update User model to store orcidId..."

        // I'll make a specialized HTML response that posts the data back to the opener or redirects to a frontend route with the token data (risky but easy MVP).
        // Let's go with: Redirect to /dashboard/profile?orcid_connected=true&orcid=${orcid}&token=${access_token}... NO that exposes secrets.

        // BACKTRACK: We need to persist this server side.
        // Let's assume the user has a cookie. I will try to read 'token' cookie even if we haven't implemented it fully globally.
        // OR: I will modify the Init route to accept `?token=` and set a cookie.

        // For now, let's mock the "linking" logic assuming we can get the user.
        // If we can't, we redirect to a frontend page where they "complete" the linking by POSTing the code?
        // Standard Modern Pattern: Frontend calls "Exchange" API with the code.
        // 1. User -> ORCID (Redirect) -> Callback (Frontend Route) -> API (POST code + JWT).
        // That is much cleaner.

        // SO: This file (`app/api/auth/orcid/callback/route.ts`) should essentially be a UI Redirect to the Frontend, passing the CODE.
        // Then Frontend calls `POST /api/auth/orcid/link { code }`.

        return NextResponse.redirect(`${baseUrl}/dashboard/profile?orcid_code=${code}`);

    } catch (error) {
        console.error("ORCID Callback Error", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?error=orcid_failed`);
    }
}
