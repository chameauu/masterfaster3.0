# Google Drive Connector - Action Items

## Current Status

✅ **Backend is configured** - Composio API key is set in `backend/.env`  
✅ **Composio is enabled** - `COMPOSIO_ENABLED=TRUE`  
❌ **Auth config missing** - Need to create in Composio dashboard  

## The Error You're Seeing

```
ValueError: No auth config found for toolkit 'googledrive'. 
Please create an auth config for Google Drive in your Composio 
dashboard at https://app.composio.dev
```

## What This Means

Composio requires you to create an "auth config" in their dashboard before you can use any integration. Think of it as enabling the integration.

## What You Need to Do (5 Minutes)

### Option 1: Use Composio (Recommended - Easier)

Follow these steps in order:

1. **Open Composio Dashboard**
   - Go to: https://app.composio.dev/
   - Log in with your account

2. **Create Google Drive Auth Config**
   - Click "Integrations" in left sidebar
   - Search for "Google Drive"
   - Click on Google Drive integration
   - Click "Add Auth Config" or "Create Auth Config"
   - Fill in:
     - Name: `SurfSense Google Drive`
     - Scopes: Select Drive and email scopes
   - Click "Create"

3. **Disable Secret Masking (IMPORTANT!)**
   - Go to Settings → Project Settings
   - Find "Mask Connected Account Secrets"
   - Turn it OFF (disable)
   - Save changes
   - This is required for indexing to work!

4. **Test in SurfSense**
   - Go to http://localhost:3000
   - Navigate to connectors page
   - Click "Connect to Google Drive"
   - Should work now! ✅

**Detailed Guide:** See `docs/COMPOSIO_QUICK_START.md`

### Option 2: Use Native Google OAuth (More Setup)

If you prefer not to use Composio (for privacy or other reasons):

1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Create new project

2. **Enable APIs**
   - Enable Google Drive API
   - Enable Gmail API (optional)
   - Enable Google Calendar API (optional)

3. **Configure OAuth Consent Screen**
   - Set up app information
   - Add scopes
   - Add test users

4. **Create OAuth Credentials**
   - Create OAuth client ID
   - Add redirect URIs
   - Get client ID and secret

5. **Update backend/.env**
   - Add GOOGLE_OAUTH_CLIENT_ID
   - Add GOOGLE_OAUTH_CLIENT_SECRET
   - Disable Composio: COMPOSIO_ENABLED=FALSE

6. **Restart backend and test**

**Detailed Guide:** See `docs/GOOGLE_OAUTH_SETUP.md`

## Comparison

| Feature | Composio | Native OAuth |
|---------|----------|--------------|
| Setup Time | ⏱️ 5 minutes | ⏱️ 30-60 minutes |
| Complexity | ⭐ Easy | ⭐⭐⭐ Complex |
| Token Storage | Composio Cloud | Your Database |
| Token Refresh | Automatic | Manual code |
| Privacy | Third-party | Direct |
| Cost | Free tier | Free |

## Recommended Path

**For Development:** Use Composio (faster setup)  
**For Production:** Consider Native OAuth (more control)

## Quick Links

- 🚀 **Quick Start:** `docs/COMPOSIO_QUICK_START.md`
- 📖 **Full Composio Guide:** `docs/COMPOSIO_SETUP.md`
- 🔧 **Native OAuth Guide:** `docs/GOOGLE_OAUTH_SETUP.md`
- 🏗️ **Architecture Explanation:** `docs/COMPOSIO_ARCHITECTURE.md`

## Need Help?

1. **Check the guides** - All steps are documented
2. **Check Composio dashboard** - Make sure auth config is created
3. **Check backend logs** - Look for error messages
4. **Verify .env file** - Make sure API key is correct

## After Setup

Once connected, you can:
- ✅ Browse Google Drive folders
- ✅ Select files/folders to index
- ✅ Search across your Drive files
- ✅ Get AI-powered answers from your documents

---

**Last Updated:** 2026-04-09  
**Status:** Waiting for auth config creation in Composio dashboard
