# Composio Architecture - How It Works

## The Problem You're Solving

When you want to connect to Google Drive, you need OAuth credentials. Normally, you'd have to:

1. Create a Google Cloud project
2. Enable Google Drive API
3. Configure OAuth consent screen
4. Create OAuth credentials
5. Handle token refresh logic
6. Store tokens securely

This is complex and time-consuming. Composio simplifies this.

## How Composio Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR SETUP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Composio Account                                     │
│     └─> Get API Key: ak_6X0eHY2DBFyDlMiOd7PU                   │
│                                                                 │
│  2. Create Auth Config in Composio Dashboard                    │
│     └─> Tell Composio: "I want to use Google Drive"           │
│     └─> Composio creates OAuth app for you                     │
│                                                                 │
│  3. Add API Key to SurfSense backend/.env                       │
│     └─> COMPOSIO_API_KEY=ak_6X0eHY2DBFyDlMiOd7PU              │
│     └─> COMPOSIO_ENABLED=TRUE                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WHEN USER CONNECTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Connect to Google Drive" in SurfSense             │
│         │                                                       │
│         ▼                                                       │
│  SurfSense Backend calls Composio API                           │
│         │                                                       │
│         ▼                                                       │
│  Composio generates OAuth URL                                   │
│         │                                                       │
│         ▼                                                       │
│  User redirected to Google OAuth screen                         │
│         │                                                       │
│         ▼                                                       │
│  User grants permissions                                        │
│         │                                                       │
│         ▼                                                       │
│  Google redirects to Composio                                   │
│         │                                                       │
│         ▼                                                       │
│  Composio exchanges code for tokens                             │
│         │                                                       │
│         ▼                                                       │
│  Composio stores tokens securely                                │
│         │                                                       │
│         ▼                                                       │
│  Composio redirects to SurfSense callback                       │
│         │                                                       │
│         ▼                                                       │
│  SurfSense saves connector with connected_account_id            │
│         │                                                       │
│         ▼                                                       │
│  ✅ Connected! User can now index Google Drive                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WHEN INDEXING FILES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SurfSense needs to list/download files                         │
│         │                                                       │
│         ▼                                                       │
│  SurfSense calls Composio API with connected_account_id         │
│         │                                                       │
│         ▼                                                       │
│  Composio retrieves stored OAuth tokens                         │
│         │                                                       │
│         ▼                                                       │
│  Composio calls Google Drive API with tokens                    │
│         │                                                       │
│         ▼                                                       │
│  Google returns files/content                                   │
│         │                                                       │
│         ▼                                                       │
│  Composio returns data to SurfSense                             │
│         │                                                       │
│         ▼                                                       │
│  SurfSense indexes the files                                    │
│         │                                                       │
│         ▼                                                       │
│  ✅ Files indexed and searchable!                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Auth Config

An "auth config" in Composio is like saying: "I want to use Google Drive integration."

When you create an auth config:
- Composio creates a Google OAuth app for you (behind the scenes)
- Composio configures all the OAuth settings
- Composio handles token refresh automatically

**You must create an auth config for each service you want to use:**
- Google Drive → Create "Google Drive" auth config
- Gmail → Create "Gmail" auth config
- Google Calendar → Create "Google Calendar" auth config

### 2. Connected Account

A "connected account" is a specific user's connection to a service.

Example:
- Auth Config: "Google Drive" (the integration itself)
- Connected Account 1: john@gmail.com's Google Drive
- Connected Account 2: jane@gmail.com's Google Drive

Each user can have multiple connected accounts (e.g., personal and work Google accounts).

### 3. API Key

Your Composio API key (`ak_6X0eHY2DBFyDlMiOd7PU`) is like a password that lets SurfSense talk to Composio.

It's stored in `backend/.env`:
```bash
COMPOSIO_API_KEY=ak_6X0eHY2DBFyDlMiOd7PU
```

### 4. Mask Connected Account Secrets

By default, Composio "masks" (hides) OAuth tokens for security.

But SurfSense needs the actual tokens to index your files.

So you must disable this setting:
- Composio Dashboard → Settings → Project Settings
- Turn OFF "Mask Connected Account Secrets"

## Data Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  SurfSense   │◄───────►│   Composio   │◄───────►│    Google    │
│   Backend    │         │     API      │         │     APIs     │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
      │                        │                        │
      │                        │                        │
      ▼                        ▼                        ▼
  Your Server            Composio Cloud          Google Cloud
  (localhost)            (composio.dev)          (google.com)
```

## Why "No auth config found" Error?

```
You clicked "Connect to Google Drive"
         │
         ▼
SurfSense asks Composio: "Give me OAuth URL for Google Drive"
         │
         ▼
Composio checks: "Do I have a Google Drive auth config for this API key?"
         │
         ├─> YES: Generate OAuth URL ✅
         │
         └─> NO: Error "No auth config found" ❌
                 (This is what you're seeing!)
```

**Solution:** Create the auth config in Composio dashboard!

## Security & Privacy

### What Composio Stores:
- OAuth access tokens (encrypted)
- OAuth refresh tokens (encrypted)
- User's email address
- Connected account metadata

### What Composio Does NOT Store:
- Your actual files/emails/calendar events
- File contents
- Personal data beyond what's needed for OAuth

### Data Flow:
1. User grants permission to Google
2. Google gives tokens to Composio
3. Composio stores tokens (encrypted)
4. SurfSense asks Composio for data
5. Composio uses tokens to fetch from Google
6. Composio returns data to SurfSense
7. SurfSense indexes data locally

### Alternative: Native OAuth

If you don't want to use Composio (for privacy or other reasons), you can set up native Google OAuth:

See `GOOGLE_OAUTH_SETUP.md` for instructions.

With native OAuth:
- Tokens stored in your database (not Composio)
- Direct communication with Google (no middleman)
- More setup work required
- You handle token refresh logic

## Comparison

| Feature | Composio | Native OAuth |
|---------|----------|--------------|
| Setup Time | 5 minutes | 30-60 minutes |
| OAuth App Creation | Automatic | Manual |
| Token Refresh | Automatic | Manual code |
| Multiple Services | Easy | Repeat setup for each |
| Data Privacy | Tokens in Composio | Tokens in your DB |
| Cost | Free tier available | Free |
| Maintenance | Low | Medium |

## Next Steps

1. **Create auth config** in Composio dashboard (see `COMPOSIO_QUICK_START.md`)
2. **Disable secret masking** in Composio settings
3. **Test connection** in SurfSense
4. **Index your files** and start searching!

---

**Last Updated:** 2026-04-09
