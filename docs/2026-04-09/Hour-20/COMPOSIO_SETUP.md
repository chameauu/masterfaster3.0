# Composio Setup Guide (Alternative to Native Google OAuth)

Composio is a unified API platform that simplifies OAuth integration for multiple services. It's an easier alternative to setting up individual Google OAuth credentials.

## Why Use Composio?

- **Simpler Setup**: One API key instead of multiple OAuth apps
- **Unified Management**: Manage all integrations in one dashboard
- **Built-in Token Refresh**: Automatic token refresh handling
- **Multiple Services**: Supports 100+ integrations beyond Google

## Prerequisites

- A Composio account (free tier available)
- Email address for registration

## Step 1: Create Composio Account

1. Go to [Composio Dashboard](https://app.composio.dev/)
2. Sign up with your email or GitHub account
3. Verify your email if required

## Step 2: Get API Key

1. Once logged in, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Give it a name: `SurfSense Development`
4. Copy the API key (starts with `sk_...`)
5. **Save this key securely** - you won't be able to see it again

## Step 3: Create Auth Configs for Google Services

This is the most important step! You need to create auth configs in Composio for each Google service you want to use.

### 3.1: Create Google Drive Auth Config

1. In Composio Dashboard, go to **Integrations** (left sidebar)
2. Search for **"Google Drive"** in the search bar
3. Click on **Google Drive** integration
4. Click **"Add Auth Config"** or **"Create Auth Config"**
5. Fill in the form:
   - **Name**: `Google Drive - SurfSense` (or any name you prefer)
   - **Scopes**: Select the following scopes:
     - `https://www.googleapis.com/auth/drive` (Full Drive access)
     - `https://www.googleapis.com/auth/drive.readonly` (Read-only access)
     - `https://www.googleapis.com/auth/userinfo.email` (User email)
   - **Redirect URI**: Leave as default (Composio handles this)
6. Click **"Create"** or **"Save"**

### 3.2: Create Gmail Auth Config (Optional)

If you want to use Gmail connector:

1. Search for **"Gmail"** in Integrations
2. Click on **Gmail** integration
3. Click **"Add Auth Config"**
4. Fill in:
   - **Name**: `Gmail - SurfSense`
   - **Scopes**: Select Gmail scopes (read, modify)
5. Click **"Create"**

### 3.3: Create Google Calendar Auth Config (Optional)

If you want to use Calendar connector:

1. Search for **"Google Calendar"** in Integrations
2. Click on **Google Calendar** integration
3. Click **"Add Auth Config"**
4. Fill in:
   - **Name**: `Google Calendar - SurfSense`
   - **Scopes**: Select Calendar scopes
5. Click **"Create"**

### 3.4: Important - Disable Secret Masking

For Google Drive/Gmail indexing to work, you need to disable secret masking:

1. In Composio Dashboard, go to **Settings** → **Project Settings**
2. Find **"Mask Connected Account Secrets"**
3. **Turn this OFF** (disable it)
4. Save changes

This allows SurfSense to access the OAuth tokens needed for indexing your documents.

## Step 4: Verify Auth Configs

After creating auth configs, verify they're set up correctly:

1. Go to **Integrations** in Composio Dashboard
2. You should see your auth configs listed under each integration:
   - Google Drive: "Google Drive - SurfSense"
   - Gmail: "Gmail - SurfSense" (if created)
   - Google Calendar: "Google Calendar - SurfSense" (if created)
3. Each should show status as "Active" or "Ready"

## Step 5: Configure Backend Environment

1. Open `backend/.env` file
2. Add your Composio API key:

```bash
# Composio Connector
COMPOSIO_API_KEY=sk_your_api_key_here
COMPOSIO_ENABLED=TRUE
COMPOSIO_REDIRECT_URI=http://localhost:8000/api/v1/auth/composio/connector/callback
```

## Step 6: Restart Backend

After updating the `.env` file, restart your backend server:

```bash
cd backend
# Stop the current server (Ctrl+C)

# Restart with uv run
uv run python main.py
```

## Step 7: Test the Connection

1. Open your browser to `http://localhost:3000`
2. Navigate to the connectors page
3. Look for **Composio** connectors:
   - Google Drive (Composio)
   - Gmail (Composio)
   - Google Calendar (Composio)
4. Click "Connect" on any of them
5. You should be redirected to Composio's OAuth flow
6. Grant the requested permissions
7. You should be redirected back to your app with the connector connected

## Supported Composio Integrations

Currently configured in SurfSense:

- **Google Drive** - Index and search your Drive files
- **Gmail** - Index and search your emails
- **Google Calendar** - Index and search your calendar events

## Composio vs Native OAuth

| Feature | Composio | Native OAuth |
|---------|----------|--------------|
| Setup Complexity | ⭐ Easy (1 API key) | ⭐⭐⭐ Complex (OAuth app per service) |
| Token Management | ✅ Automatic | ⚠️ Manual refresh logic |
| Multiple Accounts | ✅ Supported | ✅ Supported |
| Cost | 💰 Free tier available | 🆓 Free |
| Data Privacy | ⚠️ Tokens stored in Composio | ✅ Tokens stored locally |
| Offline Access | ❌ Requires Composio API | ✅ Works offline |

## Troubleshooting

### Error: "No auth config found for toolkit 'googledrive'"

**Problem:** You haven't created an auth config in Composio dashboard yet.

**Solution:**
1. Go to [Composio Dashboard](https://app.composio.dev/)
2. Navigate to **Integrations** (left sidebar)
3. Search for **"Google Drive"**
4. Click on the Google Drive integration
5. Click **"Add Auth Config"** or **"Create Auth Config"**
6. Fill in the required fields:
   - Name: `Google Drive - SurfSense`
   - Scopes: Select Drive and email scopes
7. Click **"Create"**
8. Repeat for Gmail and Calendar if needed
9. Try connecting again in SurfSense

### Error: "Composio integration is not enabled"

**Problem:** `COMPOSIO_ENABLED` is not set to `TRUE` or `COMPOSIO_API_KEY` is missing.

**Solution:**
1. Check `backend/.env` file
2. Make sure these lines are present and uncommented:
   ```bash
   COMPOSIO_API_KEY=sk_your_key_here
   COMPOSIO_ENABLED=TRUE
   ```
3. Restart the backend server

### Error: "Invalid API key"

**Problem:** The Composio API key is incorrect or expired.

**Solution:**
1. Go to Composio Dashboard → Settings → API Keys
2. Create a new API key
3. Update `COMPOSIO_API_KEY` in `backend/.env`
4. Restart the backend

### Error: "Failed to get authorization URL"

**Problem:** Composio service is down or network issue.

**Solution:**
1. Check [Composio Status Page](https://status.composio.dev/)
2. Check your internet connection
3. Try again in a few minutes

### Indexing Not Working

**Problem:** "Mask Connected Account Secrets" is enabled in Composio.

**Solution:**
1. Go to Composio Dashboard → Settings → Project Settings
2. Find "Mask Connected Account Secrets"
3. **Disable it** (turn OFF)
4. Reconnect your Google Drive/Gmail connectors
5. Try indexing again

### Multiple Accounts

**Problem:** Want to connect multiple Google accounts.

**Solution:**
- Composio supports multiple accounts automatically
- Each time you connect, it creates a new connector
- The connector name will include the email address
- Example: "Google Drive (Composio) - john@gmail.com"

## Security Considerations

### Data Privacy

- **Tokens stored in Composio**: OAuth tokens are stored in Composio's infrastructure
- **Encrypted in transit**: All communication uses HTTPS
- **Access control**: Only your API key can access your connected accounts

### Best Practices

1. **Keep API key secret**: Never commit it to version control
2. **Use environment variables**: Store in `.env` file (already in `.gitignore`)
3. **Rotate keys regularly**: Create new API keys periodically
4. **Monitor usage**: Check Composio dashboard for unusual activity
5. **Revoke unused keys**: Delete old API keys you're not using

### For Production

1. **Use separate API keys**: Different keys for dev/staging/prod
2. **Enable IP whitelisting**: Restrict API access to your server IPs (if available)
3. **Set up monitoring**: Use Composio webhooks for connection status
4. **Update redirect URIs**: Use HTTPS URLs for production

Example production config:
```bash
COMPOSIO_API_KEY=sk_prod_your_key_here
COMPOSIO_ENABLED=TRUE
COMPOSIO_REDIRECT_URI=https://api.yourdomain.com/api/v1/auth/composio/connector/callback
```

## Switching from Native OAuth to Composio

If you already have native Google OAuth connectors:

1. **Keep existing connectors**: They will continue to work
2. **Add Composio connectors**: New connectors will use Composio
3. **Migrate gradually**: No need to disconnect existing connectors
4. **Both can coexist**: Native and Composio connectors work side-by-side

## Switching from Composio to Native OAuth

If you want to switch back:

1. Set up native Google OAuth (see `GOOGLE_OAUTH_SETUP.md`)
2. Disconnect Composio connectors
3. Connect using native Google OAuth connectors
4. Optionally disable Composio:
   ```bash
   COMPOSIO_ENABLED=FALSE
   ```

## Additional Resources

- [Composio Documentation](https://docs.composio.dev/)
- [Composio Dashboard](https://app.composio.dev/)
- [Composio API Reference](https://docs.composio.dev/api-reference)
- [Composio Status Page](https://status.composio.dev/)
- [Composio Support](https://discord.gg/composio)

## Pricing

Composio offers a free tier with:
- Unlimited connected accounts
- 1,000 API calls per month
- Basic support

For production use, check [Composio Pricing](https://composio.dev/pricing) for paid plans.

---

**Last Updated:** 2026-04-09  
**Maintained By:** Voice Assistant Development Team
