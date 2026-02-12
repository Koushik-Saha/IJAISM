import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const nextPublicClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId || !clientSecret) {
        return NextResponse.json({
            status: 'error',
            message: 'Missing Environment Variables',
            debug: {
                PAYPAL_CLIENT_ID_EXISTS: !!clientId,
                PAYPAL_CLIENT_SECRET_EXISTS: !!clientSecret,
                NEXT_PUBLIC_PAYPAL_CLIENT_ID_EXISTS: !!nextPublicClientId
            }
        }, { status: 500 });
    }

    try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json({
                status: 'success',
                message: 'PayPal Credentials are VALID ✅',
                credentials_used: {
                    clientId: clientId.substring(0, 5) + '...' + clientId.substring(clientId.length - 5),
                    nextPublicClientId: nextPublicClientId ? (nextPublicClientId.substring(0, 5) + '...' + nextPublicClientId.substring(nextPublicClientId.length - 5)) : 'NOT SET'
                },
                paypal_response: {
                    scope: data.scope,
                    access_token: 'HIDDEN',
                    token_type: data.token_type,
                    expires_in: data.expires_in
                }
            });
        } else {
            return NextResponse.json({
                status: 'failed',
                message: 'PayPal Credentials are INVALID ❌',
                paypal_error: data,
                credentials_used: {
                    clientId: clientId.substring(0, 5) + '...' + clientId.substring(clientId.length - 5)
                }
            }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: 'Server Error during verification',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
