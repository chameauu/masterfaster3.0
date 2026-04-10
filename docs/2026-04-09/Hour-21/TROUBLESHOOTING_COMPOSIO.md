# Troubleshooting Composio Google Drive Connection

## Error: "Request failed" with 500 Internal Server Error

### Symptoms

- You successfully connected your Google account
- OAuth flow completed without errors
- But when trying to browse Drive folders, you get:
  ```
  Request failed: {"status":500,"statusText":"Internal Server Error"}
  ```

### Most Common Cause: Masked Tokens

**Problem:** Composio's "Mask Connected Account Secrets" setting is enabled.

When this setting is ON, Composio returns masked (shortened) OAuth tokens that look like this:
```
ya29.a0AfB_byC***************  (only ~20 characters)
```

But Google requires full tokens that are 100+ characters long:
```
ya29.a0AfB_byC1234567890abcdefghijklmnopqrstuvwxyz...  (100+ characters)
```

**Solution:**

1. Go to [Composio Dashboard](https://app.composio.dev/)
2. Click **Settings** (left sidebar or top right)
3. Go to **Project Settings**
4. Find **"Mask Connected Account Secrets"**
5. **Turn it OFF** (disable it)
6. Click **Save** (if there's a save button)
7. **Reconnect your Google account** in SurfSense:
   - Go to connectors page
   - Delete the existing Google Drive connector
   - Click "Connect to Google Drive" again
   - Grant permissions
8. Try browsing folders again

### How to Verify the Fix

After disabling secret masking and reconnecting:

1. Check backend logs for this message:
   ```
   Retrieved access token from Composio for account xxx: length=XXX chars
   ```
   
2. The length should be **100+ characters**

3. If you see:
   ```
   Access token is too short (20 chars)
   ```
   Then secret masking is still enabled or you need to reconnect.

### Other Possible Causes

#### 1. Auth Config Not Created

**Symptoms:**
- Error: "No auth config found for toolkit 'googledrive'"

**Solution:**
- Create auth config in Composio dashboard
- See `COMPOSIO_QUICK_START.md` for instructions

#### 2. Invalid API Key

**Symptoms:**
- Error: "Invalid API key" or "Unauthorized"

**Solution:**
- Check `backend/.env` file
- Make sure `COMPOSIO_API_KEY` matches your Composio dashboard
- Get API key from: Composio Dashboard → Settings → API Keys

#### 3. Expired Connection

**Symptoms:**
- Error: "Authentication expired" or "invalid_grant"

**Solution:**
- Reconnect your Google account
- Go to connectors page → Delete connector → Connect again

#### 4. Missing Scopes

**Symptoms:**
- Error: "insufficient_scope" or "Access denied"

**Solution:**
- Check auth config in Composio dashboard
- Make sure these scopes are selected:
  - `https://www.googleapis.com/auth/drive`
  - `https://www.googleapis.com/auth/drive.readonly`
  - `https://www.googleapis.com/auth/userinfo.email`

#### 5. Network Issues

**Symptoms:**
- Error: "Connection timeout" or "Network error"

**Solution:**
- Check internet connection
- Check if Composio API is accessible: https://api.composio.dev/
- Check firewall settings

## Diagnostic Steps

### Step 1: Run Diagnostic Script

```bash
cd backend
uv run python test_composio_connection.py
```

This will check:
- ✓ Composio is enabled
- ✓ API key is set
- ✓ Service can be initialized
- ✓ Auth configs exist
- ✓ Toolkits are available

### Step 2: Check Backend Logs

Look for these log messages:

**Good:**
```
Retrieved access token from Composio for account xxx: length=150 chars
Listed 10 total items (5 folders, 5 files) for Composio connector 1 in ROOT
```

**Bad:**
```
Access token is too short (20 chars)
Failed to get access token from Composio
Error listing Composio Drive contents
```

### Step 3: Check Composio Dashboard

1. Go to [Composio Dashboard](https://app.composio.dev/)
2. Check **Integrations** → **Google Drive**
   - Should have an auth config listed
   - Status should be "Active"
3. Check **Settings** → **Project Settings**
   - "Mask Connected Account Secrets" should be OFF
4. Check **Connected Accounts** (if available)
   - Should show your Google account
   - Status should be "Active"

### Step 4: Test Token Retrieval

In Python console:

```python
from app.services.composio_service import ComposioService

service = ComposioService()

# Replace with your actual connected_account_id
# (You can find this in backend logs after connecting)
connected_account_id = "your_connected_account_id_here"

try:
    token = service.get_access_token(connected_account_id)
    print(f"Token length: {len(token)} chars")
    print(f"Token preview: {token[:20]}...")
    
    if len(token) < 50:
        print("❌ Token is masked! Disable 'Mask Connected Account Secrets'")
    else:
        print("✅ Token looks good!")
except Exception as e:
    print(f"❌ Error: {e}")
```

## Common Error Messages

### "Access token is masked"

**Full error:**
```
ValueError: Access token is masked (only 20 chars). 
Disable 'Mask Connected Account Secrets' in Composio dashboard.
```

**Solution:** Disable secret masking (see above)

### "No state.val on connected account"

**Full error:**
```
ValueError: No state.val on connected account xxx
```

**Possible causes:**
- Connection not fully established
- Composio API issue
- Invalid connected_account_id

**Solution:**
- Wait a few seconds and try again
- Reconnect your Google account
- Check Composio status: https://status.composio.dev/

### "Failed to list folder contents"

**Full error:**
```
HTTPException: Failed to list folder contents: [error details]
```

**Possible causes:**
- Invalid credentials
- Expired token
- Missing scopes
- Google API error

**Solution:**
- Check backend logs for detailed error
- Reconnect your Google account
- Verify scopes in auth config

## Still Not Working?

### 1. Check Composio Status

Visit: https://status.composio.dev/

If Composio is having issues, wait for them to resolve it.

### 2. Try Native Google OAuth

If Composio continues to have issues, you can switch to native Google OAuth:

1. Follow `GOOGLE_OAUTH_SETUP.md`
2. Set `COMPOSIO_ENABLED=FALSE` in `backend/.env`
3. Restart backend
4. Connect using native Google OAuth

### 3. Check SurfSense Issues

Search for similar issues: https://github.com/yourusername/SurfSense/issues

### 4. Enable Debug Logging

In `backend/.env`, add:
```bash
LOG_LEVEL=DEBUG
```

Restart backend and check logs for more detailed error messages.

## Prevention

### Best Practices

1. **Always disable secret masking** before connecting accounts
2. **Test connection immediately** after setup
3. **Check backend logs** for any warnings
4. **Keep Composio API key secure** (don't commit to git)
5. **Monitor token expiration** (Composio handles refresh automatically)

### Regular Maintenance

1. **Check connected accounts** monthly
2. **Rotate API keys** every 6 months
3. **Review scopes** when Google updates APIs
4. **Update Composio SDK** when new versions are released

## Quick Reference

| Issue | Solution |
|-------|----------|
| 500 Error after connecting | Disable secret masking |
| No auth config found | Create auth config in dashboard |
| Invalid API key | Check .env file |
| Token too short | Disable secret masking |
| Authentication expired | Reconnect account |
| Insufficient scope | Add scopes to auth config |

---

**Last Updated:** 2026-04-09  
**Related Docs:**
- `COMPOSIO_QUICK_START.md` - Initial setup
- `COMPOSIO_SETUP.md` - Full setup guide
- `COMPOSIO_ARCHITECTURE.md` - How it works
- `GOOGLE_OAUTH_SETUP.md` - Alternative to Composio
