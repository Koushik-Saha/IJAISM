# Connecting Hostinger Domain to Vercel

Here is the step-by-step guide to connect your domain (purchased on Hostinger) to your Vercel deployment.

## Step 1: Vercel Configuration
1.  Go to your **Vercel Dashboard**.
2.  Select your project (`c5k-platform`).
3.  Go to **Settings** > **Domains**.
4.  Enter your domain name (e.g., `yourdomain.com`) in the input box and click **Add**.
5.  Vercel will provide you with the required DNS records. It usually looks like this:
    *   **Type**: `A` | **Value**: `76.76.21.21`
    *   **Type**: `CNAME` | **Name**: `www` | **Value**: `cname.vercel-dns.com`

## Step 2: Hostinger Configuration (DNS)
1.  Log in to your **Hostinger** account.
2.  Go to **Domains** and select your domain.
3.  Click on **DNS / Name Servers** in the sidebar.
4.  **Delete any default A records** that point to Hostinger (Parked) or 0.0.0.0.
5.  **Add the Vercel Records**:

### Record 1 (Root Domain)
*   **Type**: `A`
*   **Name**: `@` (or leave blank)
*   **Points to**: `76.76.21.21`
*   **TTL**: `3600` (default) -> Click **Add Record**

### Record 2 (WWW Subdomain)
*   **Type**: `CNAME`
*   **Name**: `www`
*   **Points to**: `cname.vercel-dns.com`
*   **TTL**: `3600` (default) -> Click **Add Record**

## Step 3: Verification
1.  Go back to the Vercel Domains page.
2.  Vercel will automatically check the DNS records.
3.  It might show "Invalid Configuration" for a few minutes.
4.  Wait for **DNS Propagation** (can take from 5 minutes to 24 hours).
5.  Once the icons turn **Green**, your site is live!

> [!NOTE]
> If you have existing email setup (MX records) on Hostinger, **DO NOT** change your Nameservers. Only change the **A** and **CNAME** records in the DNS Zone Editor as described above.
