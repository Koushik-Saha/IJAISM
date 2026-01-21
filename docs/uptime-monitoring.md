# Uptime Monitoring Setup (UptimeRobot)

## 1. Create Monitors
1. Sign up/Login to [UptimeRobot](https://uptimerobot.com).
2. Click **Add New Monitor**.

### Monitor 1: Homepage
- **Monitor Type**: HTTP(s)
- **Friendly Name**: C5K Homepage
- **URL**: `https://c5k-platform.vercel.app` (or your domain)
- **Monitoring Interval**: 5 minutes

### Monitor 2: API Health Check
- **Monitor Type**: HTTP(s)
- **Friendly Name**: API Health & DB
- **URL**: `https://c5k-platform.vercel.app/api/health`
- **Keyword to Look For**: `healthy` (Case-sensitive? No usually)
- **Alert Contacts**: Select your email/Slack.

## 2. Status Page
1. Go to **Status Pages** in UptimeRobot.
2. Click **Add Status Page**.
3. Select **Public**.
4. Add the monitors you created.
5. Save. You get a public URL (e.g., `stats.uptimerobot.com/xxxxx`).

This ensures you are alerted immediately if the deployment fails or the database disconnects.
