# Celery Worker & Document Processing Guide

**Last Updated:** 2026-04-09  
**Issue:** Documents not appearing after upload

---

## 🎯 What is Celery?

**Celery is a background task queue system** that processes time-consuming tasks asynchronously.

Think of it like this:
- **Backend (FastAPI)** = Restaurant waiter (takes orders, serves food)
- **Celery Worker** = Kitchen staff (cooks the food)
- **Redis** = Order ticket system (connects waiter to kitchen)

Without the kitchen staff (Celery worker), orders pile up but nothing gets cooked!

---

## 📋 What Celery Does in SurfSense

### Document Processing (Your Issue)
When you upload a document:

```
┌─────────────────────────────────────────────────────────┐
│  Upload Flow (What Happens Behind the Scenes)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. You click "Upload" → File sent to backend          │
│  2. Backend saves file to disk                         │
│  3. Backend creates document record in database        │
│  4. Backend sends task to Celery queue                 │
│  5. Backend returns "success" to you                   │
│     ✅ You see "Processing..." notification            │
│                                                         │
│  ─── Background Processing (Celery Worker) ───         │
│                                                         │
│  6. Celery worker picks up task from queue             │
│  7. Reads file content                                 │
│  8. Extracts text (PDF, DOCX, etc.)                    │
│  9. Splits into chunks (~500 words each)               │
│  10. Generates embeddings for each chunk               │
│      (Uses sentence-transformers model)                │
│  11. Stores chunks + embeddings in database            │
│  12. Updates document status to "completed"            │
│      ✅ Document appears in your list!                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**⚠️ If Celery worker is NOT running:**
- Steps 1-5 happen ✅
- Steps 6-12 NEVER happen ❌
- Document stuck in "processing" forever
- Never appears in documents list

---

### Other Tasks Celery Handles

| Task Type | What It Does | Time |
|-----------|--------------|------|
| **Document Upload** | Extract text, generate embeddings | 10-60s |
| **Connector Sync** | Fetch from Notion, Drive, Slack, etc. | 1-30min |
| **Podcast Generation** | Generate audio from documents | 2-10min |
| **Video Presentation** | Create video from slides | 5-20min |
| **Document Reindex** | Regenerate embeddings | 5-30s |
| **Scheduled Tasks** | Auto-sync connectors | Varies |

---

## 🚀 How to Start Celery Worker

### Option 1: Manual Start (Recommended for Development)

Open a **new terminal** (keep it open while using the app):

```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info --pool=solo
```

**What you'll see:**
```
 -------------- celery@hostname v5.x.x
---- **** ----- 
--- * ***  * -- Linux-x.x.x
-- * - **** --- 
- ** ---------- [config]
- ** ---------- .> app:         surfsense:0x...
- ** ---------- .> transport:   redis://localhost:6379/0
- ** ---------- .> results:     redis://localhost:6379/0
- *** --- * --- .> concurrency: 1 (solo)
-- ******* ---- .> task events: OFF
--- ***** ----- 
 -------------- [queues]
                .> surfsense           exchange=surfsense(direct) key=surfsense

[tasks]
  . process_file_upload
  . process_youtube_video
  . index_notion_pages
  ... (more tasks)

[2026-04-09 18:30:00,000: INFO/MainProcess] Connected to redis://localhost:6379/0
[2026-04-09 18:30:00,000: INFO/MainProcess] celery@hostname ready.
```

**✅ When you see "ready", the worker is running!**

---

### Option 2: Background Start (For Production)

```bash
cd SurfSense-main/backend
nohup uv run celery -A app.celery_app worker --loglevel=info --pool=solo > celery.log 2>&1 &
```

Check if it's running:
```bash
ps aux | grep celery
```

View logs:
```bash
tail -f celery.log
```

Stop it:
```bash
pkill -f "celery.*app.celery_app"
```

---

### Option 3: Using Docker Compose (Production)

The production `docker-compose.yml` includes Celery worker:

```yaml
celery_worker:
  image: ghcr.io/modsetter/surfsense-backend:latest
  environment:
    SERVICE_ROLE: worker
  # ... (automatically starts)
```

For development, you can add it to `docker-compose.dev.yml` (not recommended - harder to debug).

---

## 🔍 Troubleshooting Document Upload Issues

### Issue 1: Documents Not Appearing

**Symptoms:**
- Upload succeeds
- "Processing..." notification appears
- Document never shows up in list
- No errors in backend logs

**Cause:** Celery worker not running

**Solution:**
```bash
# Start Celery worker in new terminal
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info --pool=solo
```

**Verify it's working:**
1. Upload a document
2. Watch Celery terminal for:
   ```
   [2026-04-09 18:30:00,000: INFO/MainProcess] Task process_file_upload[abc-123] received
   [2026-04-09 18:30:05,000: INFO/MainProcess] Task process_file_upload[abc-123] succeeded
   ```
3. Document should appear in list

---

### Issue 2: Celery Worker Crashes

**Symptoms:**
- Worker starts but crashes immediately
- Error messages in terminal

**Common Causes:**

#### A. Redis Not Running
```
Error: Error 111 connecting to localhost:6379. Connection refused.
```

**Solution:**
```bash
# Start Redis
docker-compose -f docker-compose.dev.yml up -d redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

---

#### B. Database Not Running
```
Error: could not connect to server: Connection refused
```

**Solution:**
```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d postgres

# Verify database is running
psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "SELECT 1"
```

---

#### C. Missing Dependencies
```
ModuleNotFoundError: No module named 'xxx'
```

**Solution:**
```bash
cd SurfSense-main/backend
uv sync
```

---

#### D. LLM Configuration Error
```
Error: Failed to initialize LLM router
```

**Solution:**
This is usually fine - the worker will still process documents. The LLM is only needed for summarization (optional feature).

If you want to fix it, ensure Azure OpenAI is configured (but you said it works without .env).

---

### Issue 3: Documents Stuck in "Processing"

**Symptoms:**
- Document uploaded hours ago
- Still shows "Processing..."
- Celery worker is running

**Possible Causes:**

#### A. Task Failed Silently
Check Celery logs for errors:
```bash
# In Celery terminal, look for:
[ERROR/MainProcess] Task process_file_upload[abc-123] raised unexpected: ...
```

#### B. File Format Not Supported
Supported formats:
- PDF, DOCX, PPTX, XLSX
- TXT, MD, CSV
- HTML, JSON, XML

Unsupported formats will fail.

#### C. File Too Large
Default limit: 100MB per file

Check backend logs:
```bash
# Look for:
ERROR: File size exceeds limit
```

#### D. Embedding Model Not Downloaded
First upload downloads the model (~90MB):
```bash
# In Celery terminal:
Downloading sentence-transformers/all-MiniLM-L6-v2...
```

This can take 1-2 minutes. Subsequent uploads are fast.

---

### Issue 4: Slow Document Processing

**Symptoms:**
- Documents take 5+ minutes to process
- Small files taking forever

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| CPU-only embeddings | Normal - embeddings are CPU-intensive |
| Large file (50MB+) | Split into smaller files |
| Many chunks (1000+) | Expected - each chunk needs embedding |
| Slow disk I/O | Use SSD, not HDD |
| Low RAM (<4GB) | Close other applications |

**Expected Processing Times:**
- Small PDF (10 pages): 10-30 seconds
- Medium PDF (100 pages): 1-3 minutes
- Large PDF (500 pages): 5-10 minutes
- DOCX (50 pages): 20-60 seconds

---

## 📊 Monitoring Celery

### Check Task Queue Status

```bash
# Connect to Redis
redis-cli

# Check queue length
LLEN surfsense
# Returns: number of pending tasks

# View pending tasks
LRANGE surfsense 0 -1
```

---

### View Active Tasks

```bash
# In Celery terminal, you'll see:
[2026-04-09 18:30:00,000: INFO/MainProcess] Task process_file_upload[abc-123] received
[2026-04-09 18:30:00,000: INFO/MainProcess] Task process_file_upload[abc-123] succeeded in 15.2s
```

---

### Check Database for Stuck Documents

```bash
psql postgresql://surfsense:surfsense@localhost:5432/surfsense

-- Find documents stuck in processing
SELECT id, filename, status, created_at 
FROM documents 
WHERE status = 'PROCESSING' 
  AND created_at < NOW() - INTERVAL '1 hour';
```

---

## 🔧 Advanced Configuration

### Increase Worker Concurrency

Process multiple documents simultaneously:

```bash
# Use prefork pool with 4 workers
uv run celery -A app.celery_app worker --loglevel=info --pool=prefork --concurrency=4
```

**Note:** Each worker uses ~1GB RAM + CPU. Don't exceed your CPU cores.

---

### Separate Queues for Fast/Slow Tasks

The app already does this:
- **Default queue** (`surfsense`): Fast tasks (document upload, podcast)
- **Connectors queue** (`surfsense.connectors`): Slow tasks (Notion sync, web crawl)

Start workers for each queue:

```bash
# Terminal 1: Fast tasks
uv run celery -A app.celery_app worker -Q surfsense --loglevel=info --pool=solo

# Terminal 2: Slow tasks
uv run celery -A app.celery_app worker -Q surfsense.connectors --loglevel=info --pool=solo
```

---

### Enable Celery Flower (Web UI)

Monitor tasks in browser:

```bash
uv run celery -A app.celery_app flower --port=5555
```

Open: http://localhost:5555

You'll see:
- Active tasks
- Task history
- Worker status
- Queue lengths
- Task execution times

---

## 📝 Quick Reference

### Start Everything

```bash
# Terminal 1: Database & Redis
docker-compose -f docker-compose.dev.yml up -d

# Terminal 2: Backend
cd backend
uv run python main.py

# Terminal 3: Celery Worker
cd backend
uv run celery -A app.celery_app worker --loglevel=info --pool=solo

# Terminal 4: Frontend
cd frontend
npm run dev
```

---

### Stop Everything

```bash
# Stop Celery (Ctrl+C in terminal)
# Stop Backend (Ctrl+C in terminal)
# Stop Frontend (Ctrl+C in terminal)

# Stop Docker services
docker-compose -f docker-compose.dev.yml down
```

---

### Check Status

```bash
# Backend
curl http://localhost:8000/health

# Redis
redis-cli ping

# PostgreSQL
psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "SELECT 1"

# Celery (check if process is running)
ps aux | grep celery
```

---

## 🎯 Summary

**To fix your document upload issue:**

1. **Start Celery worker** (if not running):
   ```bash
   cd SurfSense-main/backend
   uv run celery -A app.celery_app worker --loglevel=info --pool=solo
   ```

2. **Upload a document** in the frontend

3. **Watch Celery terminal** for processing messages

4. **Document should appear** in your list within 10-60 seconds

**Keep the Celery terminal open** while using the application. It's like keeping the kitchen staff at work!

---

## 📚 Related Documentation

- [Current Status](./CURRENT_STATUS.md) - Overall project status
- [Models Guide](./MODELS_GUIDE.md) - Embedding model details
- [Database Setup](./DATABASE_SETUP_NOTES.md) - Database configuration

---

**Need Help?**
- Check Celery terminal for error messages
- Check backend logs for upload errors
- Check Redis is running: `redis-cli ping`
- Check database is running: `psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "SELECT 1"`

---

**Last Updated:** 2026-04-09  
**Maintained By:** Voice Assistant Development Team
