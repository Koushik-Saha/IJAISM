
/**
 * ORCID API Client
 * 
 * Handles interaction with the ORCID Public or Member API.
 * Capabilities:
 * - OAuth 2.0 Token Exchange
 * - Pushing works (articles) to user profiles
 */

import { logger } from '@/lib/logger';

const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID;
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET;
const ORCID_API_URL = process.env.ORCID_ENV === 'sandbox'
    ? 'https://api.sandbox.orcid.org/v3.0'
    : 'https://api.orcid.org/v3.0';

export async function exchangeOrcidCode(code: string, redirectUri: string) {
    if (!ORCID_CLIENT_ID || !ORCID_CLIENT_SECRET) {
        throw new Error("ORCID credentials missing");
    }

    const params = new URLSearchParams();
    params.append('client_id', ORCID_CLIENT_ID);
    params.append('client_secret', ORCID_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const endpoint = process.env.ORCID_ENV === 'sandbox'
        ? 'https://sandbox.orcid.org/oauth/token'
        : 'https://orcid.org/oauth/token';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!response.ok) {
        const error = await response.text();
        logger.error("ORCID Token Exchange Failed", { error });
        throw new Error("Failed to exchange code for token");
    }

    return await response.json();
}

/**
 * Pushes a published work to the user's ORCID record.
 * Requires scope: /activities/update
 */
export async function pushToOrcid(
    orcidId: string,
    accessToken: string,
    article: {
        title: string;
        type: string;
        publicationDate: Date;
        journalName: string;
        doi?: string;
        url: string;
        abstract?: string;
    }
) {
    if (!ORCID_CLIENT_ID) {
        logger.warn("ORCID Push skipped: No credentials");
        return { success: false, message: "No credentials" };
    }

    const xmlBody = `
<work:work xmlns:common="http://www.orcid.org/ns/common" xmlns:work="http://www.orcid.org/ns/work" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.orcid.org/ns/work/work-3.0.xsd">
    <work:title>
        <common:title>${escapeXml(article.title)}</common:title>
    </work:title>
    <work:journal-title>${escapeXml(article.journalName)}</work:journal-title>
    <work:short-description>${escapeXml(article.abstract?.substring(0, 1000) || '')}</work:short-description>
    <work:type>journal-article</work:type>
    <common:publication-date>
        <common:year>${article.publicationDate.getFullYear()}</common:year>
        <common:month>${String(article.publicationDate.getMonth() + 1).padStart(2, '0')}</common:month>
        <common:day>${String(article.publicationDate.getDate()).padStart(2, '0')}</common:day>
    </common:publication-date>
    <common:url>${escapeXml(article.url)}</common:url>
    ${article.doi ? `
    <common:external-ids>
        <common:external-id>
            <common:external-id-type>doi</common:external-id-type>
            <common:external-id-value>${article.doi}</common:external-id-value>
            <common:external-id-url>https://doi.org/${article.doi}</common:external-id-url>
            <common:external-id-relationship>self</common:external-id-relationship>
        </common:external-id>
    </common:external-ids>` : ''}
</work:work>`;

    try {
        const response = await fetch(`${ORCID_API_URL}/${orcidId}/work`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/vnd.orcid+xml'
            },
            body: xmlBody
        });

        if (response.status === 201) {
            logger.info("ORCID Push Successful", { orcidId });
            return { success: true };
        } else {
            const error = await response.text();
            logger.error("ORCID Push Failed", { status: response.status, error });
            return { success: false, message: error };
        }
    } catch (error: any) {
        logger.error("ORCID Push Exception", error);
        return { success: false, message: error.message };
    }
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
