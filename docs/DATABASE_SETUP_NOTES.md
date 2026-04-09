# Database Setup Notes

**Date:** 2026-04-09  
**Status:** Partial migration completed (0-116 of 120)

---

## Current Status

### ✅ Completed Migrations (0-116)
- Initial schema setup
- All connector types (GitHub, Linear, Jira, Confluence, etc.)
- LLM configurations
- Chat threads and messages
- Documents and folders
- RBAC (Role-Based Access Control)
- Podcasts and reports
- Image generation
- Notifications
- Comments and mentions
- Public chat sharing
- Prompt library
- Page purchases

### ❌ Failed Migration (117)
**Migration:** `117_optimize_zero_publication_column_lists.py`  
**Error:** `LOCK TABLE can only be used in transaction blocks`  
**Reason:** Zero-cache replication optimization (not needed for voice assistant)

### ⏸️ Pending Migrations (118-120)
- 118: Local folder sync and versioning
- 119: Vision LLM ID to search spaces
- 120: Vision LLM configs table

---

## Why This Is OK for Voice Assistant

The failed migration (117) and pending migrations (118-120) are related to features NOT needed for the voice assistant:

1. **Migration 117** - Zero-cache replication optimization
   - Used for real-time collaboration features
   - Voice assistant is single-user, no collaboration needed

2. **Migration 118** - Local folder sync
   - For syncing local file system folders
   - Voice assistant searches existing documents only

3. **Migration 119-120** - Vision LLM configs
   - For image analysis features
   - Voice assistant is audio-only (accessibility-first)

---

## Database Schema Status

### ✅ Tables Created (Essential for Voice Assistant)

**Users & Auth:**
- `users` - User accounts
- `refresh_tokens` - Session management

**Search Spaces:**
- `search_spaces` - User workspaces
- `search_space_memberships` - RBAC memberships
- `roles` - Access control roles
- `permissions` - Permission definitions

**Documents:**
- `documents` - Indexed documents
- `chunks` - Document chunks for RAG
- `folders` - Document organization

**Connectors:**
- `search_source_connectors` - Data source connections
- Supports: Gmail, Drive, Notion, Slack, GitHub, etc.

**Chat:**
- `new_chat_threads` - Conversation threads
- `new_chat_messages` - Chat messages
- `chat_session_state` - Live session state

**LLM:**
- `new_llm_configs` - LLM configurations
- Supports: OpenAI, Anthropic, Ollama, etc.

**Voice Assistant (Future):**
- Will add: `voice_sessions`, `voice_conversations`, `voice_settings`

---

## Workaround for Migration 117

### Option 1: Skip Migration 117 (Recommended)

Since Zero-cache replication is not needed for voice assistant, we can skip this migration:

```bash
cd backend

# Mark migration 117 as completed without running it
uv run alembic stamp 117

# Continue with remaining migrations
uv run alembic upgrade head
```

### Option 2: Fix Migration 117

If you need Zero-cache replication later, fix the migration:

```python
# Edit: backend/alembic/versions/117_optimize_zero_publication_column_lists.py

# Change line 87 from:
conn.execute(sa.text(f'LOCK TABLE "{tbl}" IN ACCESS EXCLUSIVE MODE'))

# To:
conn.execute(sa.text(f'BEGIN; LOCK TABLE "{tbl}" IN ACCESS EXCLUSIVE MODE; COMMIT;'))
```

### Option 3: Fresh Database (Nuclear Option)

If you want a completely clean start:

```bash
# Stop backend
# Drop and recreate database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to start
sleep 5

# Run migrations
cd backend
uv run alembic upgrade head
```

---

## Verification

Check current migration status:

```bash
cd backend
uv run alembic current
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
116 (head)
```

Or if you skipped 117:
```
117 (head)
```

---

## Next Steps

1. **For Voice Assistant Development:**
   - Database is ready! Migrations 0-116 are sufficient
   - Skip migrations 117-120 (not needed)
   - Start backend: `uv run python main.py`

2. **If You Need Full Migration:**
   - Use Option 1 (skip 117) or Option 2 (fix 117)
   - Complete migrations 118-120

---

## Database Connection Info

From `.env`:
```
DATABASE_URL=postgresql+asyncpg://surfsense:surfsense@localhost:5432/surfsense
```

**Host:** localhost  
**Port:** 5432  
**User:** surfsense  
**Password:** surfsense  
**Database:** surfsense

---

## Troubleshooting

### "Connection refused" error
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.dev.yml ps

# Start if not running
docker-compose -f docker-compose.dev.yml up -d postgres
```

### "Database does not exist" error
```bash
# Recreate database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### "Migration already exists" error
```bash
# Check current version
uv run alembic current

# Downgrade if needed
uv run alembic downgrade <version>
```

---

## Related Documentation

- [Voice Assistant Implementation Roadmap](./VOICE_ASSISTANT_IMPLEMENTATION_ROADMAP.md)
- [Disabled Features](./DISABLED_FEATURES.md)
- [Backend .env Configuration](../backend/.env)

---

**Summary:** Database is 97% ready (116/120 migrations). The remaining 3 migrations are for features not needed by the voice assistant. You can proceed with development!
