# Google OAuth Setup Guide

This guide will help you set up Google OAuth credentials to enable Google Drive, Gmail, and Calendar connectors.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `SurfSense Voice Assistant` (or any name you prefer)
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable the following APIs:
   - **Google Drive API**
   - **Gmail API**
   - **Google Calendar API**
   - **Google People API** (for user profile info)

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace account)
3. Click **Create**

### Fill in the required fields:

**App information:**
- App name: `SurfSense Voice Assistant`
- User support email: Your email
- App logo: (optional)

**App domain:**
- Application home page: `http://localhost:3000`
- Application privacy policy link: (optional for testing)
- Application terms of service link: (optional for testing)

**Developer contact information:**
- Email addresses: Your email

4. Click **Save and Continue**

### Add Scopes:

5. Click **Add or Remove Scopes**
6. Add the following scopes:
   - `https://www.googleapis.com/auth/drive` (Google Drive)
   - `https://www.googleapis.com/auth/gmail.readonly` (Gmail read)
   - `https://www.googleapis.com/auth/gmail.modify` (Gmail modify)
   - `https://www.googleapis.com/auth/calendar` (Calendar)
   - `https://www.googleapis.com/auth/userinfo.email` (User email)
   - `https://www.googleapis.com/auth/userinfo.profile` (User profile)
   - `openid` (OpenID Connect)

7. Click **Update** → **Save and Continue**

### Add Test Users (for development):

8. Click **Add Users**
9. Add your email address (and any other test users)
10. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. Enter name: `SurfSense Backend`

### Add Authorized redirect URIs:

5. Click **Add URI** and add these three URIs:
   ```
   http://localhost:8000/api/v1/auth/google/drive/connector/callback
   http://localhost:8000/api/v1/auth/google/gmail/connector/callback
   http://localhost:8000/api/v1/auth/google/calendar/connector/callback
   ```

6. Click **Create**

### Save Your Credentials:

7. A dialog will appear with your credentials:
   - **Client ID**: Something like `123456789-abc123.apps.googleusercontent.com`
   - **Client Secret**: Something like `GOCSPX-abc123xyz789`

8. **Copy these values** - you'll need them in the next step

## Step 5: Configure Backend Environment

1. Open `backend/.env` file
2. Uncomment and fill in the Google OAuth credentials:

```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_PICKER_API_KEY=your-picker-api-key-here  # Optional, for file picker UI
```

3. The redirect URIs should already be set:

```bash
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/calendar/connector/callback
GOOGLE_GMAIL_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/gmail/connector/callback
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/drive/connector/callback
```

## Step 6: Restart Backend

After updating the `.env` file, restart your backend server:

```bash
cd backend
# If using uv run
uv run python main.py

# Or if you activated the venv
python main.py
```

## Step 7: Test the Connection

1. Open your browser to `http://localhost:3000`
2. Navigate to the connectors page
3. Click "Connect" on Google Drive, Gmail, or Calendar
4. You should be redirected to Google's OAuth consent screen
5. Grant the requested permissions
6. You should be redirected back to your app with the connector connected

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** The redirect URI in your OAuth request doesn't match the ones configured in Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Make sure the redirect URIs exactly match:
   - `http://localhost:8000/api/v1/auth/google/drive/connector/callback`
   - `http://localhost:8000/api/v1/auth/google/gmail/connector/callback`
   - `http://localhost:8000/api/v1/auth/google/calendar/connector/callback`
4. No trailing slashes, exact protocol (http vs https)

### Error: "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen is not properly configured.

**Solution:**
1. Go to OAuth consent screen
2. Make sure all required fields are filled
3. Add your email as a test user
4. Save changes

### Error: "Failed to initiate Google Drive OAuth"

**Problem:** Backend environment variables are not set or backend is not running.

**Solution:**
1. Check that `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set in `backend/.env`
2. Restart the backend server
3. Check backend logs for errors

### Error: "insufficient_scope"

**Problem:** The OAuth consent screen doesn't have all required scopes.

**Solution:**
1. Go to OAuth consent screen → Edit App
2. Add all required scopes (see Step 3 above)
3. Save changes
4. Try connecting again (you may need to revoke and re-grant access)

## Production Deployment

For production deployment:

1. **Use HTTPS**: Update redirect URIs to use `https://` instead of `http://`
2. **Update OAuth consent screen**: Change from "Testing" to "In Production"
3. **Verify domain ownership**: Google may require domain verification
4. **Use environment variables**: Store credentials securely (not in code)
5. **Set BACKEND_URL**: If behind a reverse proxy, set `BACKEND_URL` in `.env`

Example production redirect URIs:
```
https://api.yourdomain.com/api/v1/auth/google/drive/connector/callback
https://api.yourdomain.com/api/v1/auth/google/gmail/connector/callback
https://api.yourdomain.com/api/v1/auth/google/calendar/connector/callback
```

## Security Best Practices

1. **Never commit credentials**: Keep `.env` files out of version control
2. **Use different credentials**: Use separate OAuth clients for dev/staging/prod
3. **Rotate secrets regularly**: Change client secrets periodically
4. **Limit scopes**: Only request the minimum scopes needed
5. **Monitor usage**: Check Google Cloud Console for unusual activity

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)

---

**Last Updated:** 2026-04-09  
**Maintained By:** Voice Assistant Development Team
