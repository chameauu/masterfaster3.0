# Composio Quick Start - Fix "No auth config found" Error

You're seeing this error because Composio requires you to create "auth configs" in their dashboard before you can use any integration.

## What You Need to Do (5 minutes)

### Step 1: Go to Composio Dashboard

1. Open [https://app.composio.dev/](https://app.composio.dev/)
2. Log in with your account

### Step 2: Create Google Drive Auth Config

1. Click **"Integrations"** in the left sidebar
2. In the search bar, type: **"Google Drive"**
3. Click on the **Google Drive** card/integration
4. Look for a button that says **"Add Auth Config"** or **"Create Auth Config"** or **"Configure"**
5. Click it

You'll see a form. Fill it in:

**Name:** `SurfSense Google Drive` (or any name you like)

**Scopes:** Select these checkboxes:
- ✅ `https://www.googleapis.com/auth/drive` (Full access)
- ✅ `https://www.googleapis.com/auth/drive.readonly` (Read access)
- ✅ `https://www.googleapis.com/auth/userinfo.email` (Email)

**Redirect URI:** Leave as default (Composio handles this automatically)

6. Click **"Create"** or **"Save"**

### Step 3: Disable Secret Masking (IMPORTANT!)

This is required for indexing to work:

1. In Composio Dashboard, click **"Settings"** (left sidebar or top right)
2. Go to **"Project Settings"**
3. Find the setting: **"Mask Connected Account Secrets"**
4. **Turn it OFF** (toggle to disabled)
5. Click **"Save"** if there's a save button

### Step 4: Verify Your Setup

1. Go back to **"Integrations"**
2. Click on **"Google Drive"**
3. You should see your auth config listed: "SurfSense Google Drive"
4. Status should be "Active" or "Ready"

### Step 5: Test in SurfSense

1. Go back to your SurfSense app: `http://localhost:3000`
2. Navigate to the connectors page
3. Click **"Connect to Google Drive"**
4. You should now be redirected to Google's OAuth screen
5. Grant permissions
6. You'll be redirected back to SurfSense with the connector connected!

## What Just Happened?

Composio is a platform that manages OAuth connections for you. Instead of setting up Google OAuth credentials yourself (which requires creating a Google Cloud project, enabling APIs, configuring consent screens, etc.), Composio does all that for you.

But you still need to tell Composio which services you want to use by creating "auth configs" in their dashboard. Think of it as enabling the integration.

## Optional: Add Gmail and Calendar

If you want to connect Gmail or Google Calendar too, repeat Step 2 for:

**Gmail:**
1. Integrations → Search "Gmail"
2. Add Auth Config
3. Name: `SurfSense Gmail`
4. Select Gmail scopes
5. Create

**Google Calendar:**
1. Integrations → Search "Google Calendar"
2. Add Auth Config
3. Name: `SurfSense Calendar`
4. Select Calendar scopes
5. Create

## Still Having Issues?

### Error: "No auth config found"
- Make sure you created the auth config in Composio dashboard
- Make sure you're logged into the correct Composio account
- Try refreshing the Composio dashboard page

### Error: "Invalid API key"
- Check that `COMPOSIO_API_KEY` in `backend/.env` matches your Composio API key
- Get your API key from: Composio Dashboard → Settings → API Keys

### Error: "Indexing not working"
- Make sure you disabled "Mask Connected Account Secrets" in Composio settings
- This is required for SurfSense to access the OAuth tokens

## Need More Help?

- Full setup guide: See `COMPOSIO_SETUP.md`
- Alternative option: Use native Google OAuth instead (see `GOOGLE_OAUTH_SETUP.md`)
- Composio docs: [https://docs.composio.dev/](https://docs.composio.dev/)

---

**Last Updated:** 2026-04-09
