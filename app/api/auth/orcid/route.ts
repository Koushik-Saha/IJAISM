
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientId = process.env.ORCID_CLIENT_ID;
    // Scopes: /authenticate to get ID, /activities/update to push works
    const scope = '/authenticate /activities/update';

    // Determine Redirect URI dynamically or from env
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c5k-platform.vercel.app';
    const redirectUri = `${baseUrl}/api/auth/orcid/callback`;

    const orcidAuthUrl = process.env.ORCID_ENV === 'sandbox'
        ? 'https://sandbox.orcid.org/oauth/authorize'
        : 'https://orcid.org/oauth/authorize';

    // State should be random for security, passing 'returnUrl' if needed. 
    // ideally store state in cookie, but for MVP simplifying.
    const state = req.nextUrl.searchParams.get('returnUrl') || '/dashboard/profile';

    const url = `${orcidAuthUrl}?client_id=${clientId}&response_type=code&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(url);
}
