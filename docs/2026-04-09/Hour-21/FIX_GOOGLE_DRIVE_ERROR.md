# Fix Google Drive 500 Error - Quick Checklist

## Current Status

✅ You successfully connected your Google account  
❌ Getting 500 error when trying to browse Drive folders

## The Problem

Most likely: **"Mask Connected Account Secrets" is enabled in Composio**

This causes Composio to return shortened (masked) OAuth tokens that Google rejects.

## The Fix (2 Minutes)

### Step 1: Disable Secret Masking

1. Go to: https://app.composio.dev/
2. Click **Settings** (left sidebar)
3. Go to **Project Settings**
4. Find: **"Mask Connected Account Secrets"**
5. **Turn it OFF** (toggle to disabled)
6. Save if needed

### Step 2: Reconnect Your Google Account

1. Go to: http://localhost:3000
2. Navigate to connectors page
3. Find your Google Drive connector
4. **Delete it** (click delete/remove)
5. Click **"Connect to Google Drive"** again
6. Grant permissions
7. You'll be redirected back

### Step 3: Test

1. Try browsing Drive folders
2. Should work now! ✅

## How to Verify It Worked

Check your backend terminal logs. You should see:

**Good (working):**
```
Retrieved access token from Composio for account xxx: length=150 chars
Listed 10 total items (5 folders, 5 files) for Composio connector 1
```

**Bad (still broken):**
```
Access token is too short (20 chars)
```

If you see "too short", secret masking is still enabled or you need to reconnect.

## Alternative: Run Diagnostic

```bash
cd backend
uv run python test_composio_connection.py
```

This will check your Composio configuration and tell you what's wrong.

## Still Not Working?

### Check These:

1. **Secret masking is OFF** in Composio dashboard
2. **You reconnected** after disabling it (old connection won't work)
3. **Backend is running** (check terminal)
4. **No errors in backend logs** (check terminal output)

### Get More Help:

- Full troubleshooting: `docs/TROUBLESHOOTING_COMPOSIO.md`
- Composio setup: `docs/COMPOSIO_QUICK_START.md`
- Alternative option: `docs/GOOGLE_OAUTH_SETUP.md` (native OAuth)

## Why This Happens

Composio has a security feature called "Mask Connected Account Secrets" that hides OAuth tokens in their dashboard. But when enabled, it also masks tokens in API responses, making them too short for Google to accept.

For SurfSense to index your files, it needs the full OAuth token. So you must disable this setting.

**This is safe** because:
- Tokens are still encrypted in transit (HTTPS)
- Only your API key can access them
- Tokens are never exposed to end users
- SurfSense only uses them to access your Drive files

---

**Last Updated:** 2026-04-09  
**Estimated Fix Time:** 2 minutes
