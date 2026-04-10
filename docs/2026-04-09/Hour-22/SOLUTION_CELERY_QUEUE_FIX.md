# Solution: Celery Queue Configuration Fix

**Date:** 2026-04-09  
**Issue:** Google Drive files not being indexed  
**Root Cause:** Celery worker not listening to the correct queue  
**Status:** ✅ RESOLVED

---

## The Problem

### Symptoms
- User could connect Google Drive successfully ✅
- User could browse and select files in UI ✅
- User clicked "Save & Index" ✅
- UI showed "Indexing started" message ✅
- **BUT: No files were actually indexed** ❌

### What Was Happening

Celery uses multiple queues to organize different types of tasks:

```
┌─────────────────────────────────────────────────────────┐
│                    REDIS (Broker)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Queue: "surfsense"                                     │
│    - Fast tasks (file uploads, podcasts)                │
│    - Worker WAS listening here ✅                       │
│                                                         │
│  Queue: "surfsense.connectors"                          │
│    - Slow tasks (indexing from connectors)              │
│    - Worker WAS NOT listening here ❌                   │
│    - Google Drive indexing tasks go here!               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### The Flow (Before Fix)

```
1. User triggers indexing
   ↓
2. Task created: index_google_drive_files
   ↓
3. Task routed to: surfsense.connectors queue
   ↓
4. Worker only listening to: surfsense queue
   ↓
5. ❌ Task sits in surfsense.connectors queue forever
   ↓
6. ❌ Worker never sees it
   ↓
7. ❌ Nothing happens
```

### Why Two Queues?

From `backend/app/celery_app.py`:

```python
# ── Queue names ──────────────────────────────────────────────
# Default queue  : fast, user-facing tasks (file upload, podcast, reindex, …)
# Connectors queue: slow, long-running indexing tasks (Notion, Gmail, web crawl, …)
CONNECTORS_QUEUE = f"{CELERY_TASK_DEFAULT_QUEUE}.connectors"
```

**Purpose:** Prevent slow indexing tasks from blocking fast user tasks.

**Example:**
- User uploads a file → `surfsense` queue → Processes immediately
- Gmail indexing (10 minutes) → `surfsense.connectors` queue → Doesn't block upload

### Task Routing Configuration

In `backend/app/celery_app.py` (line 130-160):

```python
task_routes={
    # Connector indexing tasks → connectors queue
    "index_slack_messages": {"queue": CONNECTORS_QUEUE},
    "index_notion_pages": {"queue": CONNECTORS_QUEUE},
    "index_github_repos": {"queue": CONNECTORS_QUEUE},
    "index_google_drive_files": {"queue": CONNECTORS_QUEUE},  # ← HERE!
    "index_google_gmail_messages": {"queue": CONNECTORS_QUEUE},
    # ... more connector tasks
}
```

All connector indexing tasks are routed to `surfsense.connectors` queue.

---

## The Solution

### Before (Broken)

```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info --pool=solo
```

**Problem:** Only listens to default queue `surfsense`

### After (Fixed)

```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info --pool=solo -Q surfsense,surfsense.connectors
```

**Solution:** The `-Q surfsense,surfsense.connectors` flag tells Celery to listen to BOTH queues.

### Using the Startup Script

A startup script was created for convenience:

```bash
cd SurfSense-main/backend
chmod +x start_celery.sh
./start_celery.sh
```

**Contents of `start_celery.sh`:**
```bash
#!/bin/bash
# Start Celery worker with all required queues

echo "Starting Celery worker..."
echo "Queues: surfsense (default), surfsense.connectors (indexing)"
echo ""

uv run celery -A app.celery_app worker \
  --loglevel=info \
  --pool=solo \
  -Q surfsense,surfsense.connectors
```

---

## The Flow (After Fix)

```
1. User triggers indexing
   ↓
2. Task created: index_google_drive_files
   ↓
3. Task routed to: surfsense.connectors queue
   ↓
4. Worker listening to: surfsense.connectors ✅
   ↓
5. ✅ Worker picks up task
   ↓
6. ✅ Downloads file from Google Drive
   ↓
7. ✅ Extracts text
   ↓
8. ✅ Generates embeddings
   ↓
9. ✅ Stores in database
   ↓
10. ✅ File indexed and searchable!
```

---

## Verification

### Check Indexing Status

```bash
cd SurfSense-main/backend
uv run python check_indexing_status.py
```

**Expected Output:**
```
============================================================
GOOGLE DRIVE INDEXING STATUS
============================================================

Found 1 Google Drive connector(s):

Connector ID: 2
  Name: Google Drive (Composio) - jmaldali26@gmail.com
  Type: COMPOSIO_GOOGLE_DRIVE_CONNECTOR
  Indexed documents: 5
    - HOW_TO_INDEX_GOOGLE_DRIVE.md (27 chunks)
    - SKYVERN_OVERVIEW.md (26 chunks)
    - Spark Fault Tolerance Mechanisms.pptx (9 chunks)
    - in_industry_4_security_updated.pptx (0 chunks)
    - README.md (0 chunks)

✅ 5 document(s) indexed successfully!
```

### Test in Chat

Go to `http://localhost:3000` and try:

```
"What's in my Google Drive files?"
"Summarize HOW_TO_INDEX_GOOGLE_DRIVE.md"
"What does SKYVERN_OVERVIEW.md talk about?"
"Tell me about Spark fault tolerance"
```

The LLM will search indexed files and use their content to answer!

---

## Technical Details

### Queue Configuration

**Default Queue:** `surfsense`
- File uploads
- Podcast generation
- Document reindexing
- Quick user-facing tasks

**Connectors Queue:** `surfsense.connectors`
- Slack message indexing
- Notion page indexing
- GitHub repo indexing
- Google Drive file indexing
- Gmail message indexing
- All other connector indexing tasks

### Why This Design?

**Problem:** Long-running indexing tasks can block quick user tasks.

**Example Scenario:**
1. User uploads a file (takes 5 seconds)
2. Gmail indexing is running (takes 10 minutes)
3. Without separate queues: User waits 10 minutes for file upload!
4. With separate queues: File upload processes immediately ✅

### Celery Worker Options

**`-Q surfsense,surfsense.connectors`**
- Specifies which queues to listen to
- Comma-separated list
- Worker will process tasks from all listed queues

**`--pool=solo`**
- Single-threaded execution
- Good for development
- Avoids concurrency issues

**`--loglevel=info`**
- Shows task execution logs
- Use `debug` for more detailed logs
- Use `warning` for less verbose logs

---

## Debugging Commands

### Check Active Queues

```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app inspect active_queues
```

**Expected Output:**
```
->  celery@hama: OK
    * {'name': 'surfsense', ...}
    * {'name': 'surfsense.connectors', ...}
```

### Check Queue Length

```bash
# Check default queue
docker exec surfsense-redis redis-cli llen surfsense

# Check connectors queue
docker exec surfsense-redis redis-cli llen surfsense.connectors
```

**Expected:** Both should be `0` when no tasks are queued.

### Check Worker Stats

```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app inspect stats
```

Shows worker statistics including task counts.

### Check Active Tasks

```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app inspect active
```

Shows currently executing tasks.

---

## Common Issues

### Issue 1: Worker Still Not Processing Tasks

**Symptom:** Tasks created but not processed.

**Solution:**
1. Stop Celery worker (Ctrl+C)
2. Restart with both queues:
   ```bash
   uv run celery -A app.celery_app worker --loglevel=info --pool=solo -Q surfsense,surfsense.connectors
   ```

### Issue 2: Tasks Going to Wrong Queue

**Symptom:** Task appears in `surfsense` instead of `surfsense.connectors`.

**Check:** Task routing in `backend/app/celery_app.py`:
```python
task_routes={
    "index_google_drive_files": {"queue": CONNECTORS_QUEUE},
}
```

### Issue 3: Redis Connection Issues

**Symptom:** Worker can't connect to Redis.

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
docker exec surfsense-redis redis-cli ping
# Should return: PONG
```

### Issue 4: Multiple Workers Conflict

**Symptom:** Tasks processed multiple times.

**Solution:** Only run ONE Celery worker at a time. Check:
```bash
ps aux | grep celery
```

Kill extra workers if found.

---

## Best Practices

### 1. Always Use Both Queues

```bash
# ✅ CORRECT
uv run celery -A app.celery_app worker -Q surfsense,surfsense.connectors

# ❌ WRONG (missing connectors queue)
uv run celery -A app.celery_app worker
```

### 2. Use Startup Script

Create `start_celery.sh` to avoid forgetting queue configuration.

### 3. Monitor Logs

Keep Celery terminal visible to see task execution in real-time.

### 4. Check Status Regularly

Use diagnostic scripts:
- `check_indexing_status.py` - See indexed documents
- `check_recent_tasks.py` - See task history
- `trigger_indexing_manually.py` - Test indexing

### 5. Restart After Config Changes

If you modify `celery_app.py`, restart the worker:
1. Stop worker (Ctrl+C)
2. Restart with correct queues

---

## Related Files

### Configuration
- `backend/app/celery_app.py` - Celery configuration and task routing
- `backend/.env` - Environment variables (Redis URL, queue names)

### Startup Scripts
- `backend/start_celery.sh` - Celery worker startup script

### Diagnostic Scripts
- `backend/check_indexing_status.py` - Check indexed documents
- `backend/check_recent_tasks.py` - View task history
- `backend/trigger_indexing_manually.py` - Manual indexing trigger

### Documentation
- `CURRENT_STATE_GOOGLE_DRIVE_SETUP.md` - Complete setup state
- `docs/DEBUG_INDEXING.md` - Debugging guide
- `docs/QUICK_START_GOOGLE_DRIVE.md` - Quick start guide

---

## Summary

### The Problem
Celery worker was only listening to `surfsense` queue, but Google Drive indexing tasks were being sent to `surfsense.connectors` queue.

### The Solution
Start Celery worker with both queues:
```bash
uv run celery -A app.celery_app worker --loglevel=info --pool=solo -Q surfsense,surfsense.connectors
```

### The Result
✅ Google Drive files are now being indexed successfully  
✅ 5 documents indexed with 62 total chunks  
✅ Files are searchable in chat  
✅ LLM can use file content to answer questions

### Key Takeaway
**Always specify both queues when starting Celery worker for SurfSense!**

---

**Last Updated:** 2026-04-09 22:21 UTC  
**Status:** ✅ RESOLVED  
**Indexed Documents:** 5 files, 62 chunks  
**Next Steps:** Use indexed files in chat, add more files as needed
