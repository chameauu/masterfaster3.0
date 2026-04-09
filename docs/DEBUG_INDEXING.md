# Debugging Indexing Issues

## Quick Checklist

Before diving deep, check these common issues:

- [ ] Backend is running
- [ ] Celery worker is running (handles background indexing tasks)
- [ ] Redis is running (required for Celery)
- [ ] PostgreSQL is running (stores indexed data)
- [ ] Connector is connected (green status)
- [ ] Files are selected for indexing
- [ ] Enough disk space available

## Understanding the Indexing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                   INDEXING PIPELINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User selects files in UI                                │
│         ↓                                                   │
│  2. Frontend sends indexing request to Backend              │
│         ↓                                                   │
│  3. Backend creates Celery task                             │
│         ↓                                                   │
│  4. Celery worker picks up task                             │
│         ↓                                                   │
│  5. Download file from Google Drive                         │
│         ↓                                                   │
│  6. Extract text (using Docling/Unstructured)               │
│         ↓                                                   │
│  7. Split into chunks                                       │
│         ↓                                                   │
│  8. Generate embeddings                                     │
│         ↓                                                   │
│  9. Store in PostgreSQL                                     │
│         ↓                                                   │
│  10. Update status in UI                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Any step can fail. Let's debug each one.

## Step 1: Check All Services Are Running

### Check Backend

```bash
# Should see FastAPI server running on port 8000
curl http://localhost:8000/api/v1/health
```

**Expected:** `{"status": "healthy"}` or similar

**If not running:**
```bash
cd SurfSense-main/backend
uv run python main.py
```

### Check Celery Worker

This is the most common issue! Celery handles background indexing tasks.

```bash
# Check if Celery is running
ps aux | grep celery
```

**Expected:** Should see celery worker process

**If not running:**
```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info
```

**Important:** Keep this terminal open! Watch for indexing logs here.

### Check Redis

```bash
# Check if Redis is running
redis-cli ping
```

**Expected:** `PONG`

**If not running:**
```bash
# Start Redis
redis-server
# Or with Docker
docker run -d -p 6379:6379 redis:latest
```

### Check PostgreSQL

```bash
# Check if PostgreSQL is running
psql -U surfsense -d surfsense -c "SELECT 1;"
```

**Expected:** Returns `1`

**If not running:**
```bash
# Start PostgreSQL (depends on your setup)
# Docker:
docker-compose up -d postgres
# Or system service:
sudo systemctl start postgresql
```

## Step 2: Enable Debug Logging

### Backend Logs

In `backend/.env`, add:
```bash
LOG_LEVEL=DEBUG
```

Restart backend to see detailed logs.

### Celery Logs

Run Celery with debug level:
```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=debug
```

### Watch Logs in Real-Time

**Terminal 1 - Backend:**
```bash
cd SurfSense-main/backend
uv run python main.py | tee backend.log
```

**Terminal 2 - Celery:**
```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info | tee celery.log
```

**Terminal 3 - Monitor:**
```bash
# Watch both logs
tail -f backend.log celery.log
```

## Step 3: Check Indexing Status

### Via UI

1. Go to connector page
2. Look for status indicators:
   - ⏳ **Pending** - Task queued
   - 🔄 **Processing** - Currently indexing
   - ✅ **Completed** - Successfully indexed
   - ❌ **Failed** - Error occurred

### Via Database

```bash
# Connect to database
psql -U surfsense -d surfsense

# Check documents table
SELECT id, title, connector_id, created_at, updated_at 
FROM documents 
ORDER BY created_at DESC 
LIMIT 10;

# Check chunks table
SELECT COUNT(*) as chunk_count, document_id 
FROM chunks 
GROUP BY document_id 
ORDER BY chunk_count DESC 
LIMIT 10;

# Check connector status
SELECT id, name, connector_type, config 
FROM search_source_connectors 
WHERE connector_type LIKE '%GOOGLE_DRIVE%';
```

### Via Celery

```bash
# Check Celery task status
cd SurfSense-main/backend
uv run celery -A app.celery_app inspect active
uv run celery -A app.celery_app inspect scheduled
uv run celery -A app.celery_app inspect reserved
```

## Step 4: Common Issues and Solutions

### Issue 1: "Indexing stuck at 0%"

**Symptoms:**
- Progress bar doesn't move
- No logs in Celery terminal

**Causes:**
1. Celery worker not running
2. Redis not running
3. Task not created

**Debug:**
```bash
# Check Celery worker
ps aux | grep celery

# Check Redis
redis-cli ping

# Check Celery queue
cd SurfSense-main/backend
uv run celery -A app.celery_app inspect active
```

**Solution:**
1. Start Celery worker (see above)
2. Start Redis (see above)
3. Try indexing again

### Issue 2: "Failed to download file"

**Symptoms:**
- Error in Celery logs: "Failed to download file from Google Drive"

**Causes:**
1. OAuth token expired
2. File permissions changed
3. File deleted from Drive
4. Network error

**Debug:**
```bash
# Check Celery logs for exact error
tail -f celery.log | grep -i "error\|failed"

# Check connector config
psql -U surfsense -d surfsense -c "
  SELECT config 
  FROM search_source_connectors 
  WHERE id = YOUR_CONNECTOR_ID;
"
```

**Solution:**
1. Reconnect Google Drive connector
2. Check file still exists in Drive
3. Verify file permissions
4. Check network connection

### Issue 3: "Failed to extract text"

**Symptoms:**
- Error in Celery logs: "Failed to extract text" or "ETL service error"

**Causes:**
1. Unsupported file format
2. Corrupted file
3. ETL service (Docling) error
4. File too large

**Debug:**
```bash
# Check which ETL service is configured
grep ETL_SERVICE backend/.env

# Check Celery logs for extraction errors
tail -f celery.log | grep -i "extract\|etl\|docling"

# Try extracting manually
cd SurfSense-main/backend
uv run python -c "
from app.etl.docling_etl import extract_text_from_file
result = extract_text_from_file('/path/to/test/file.pdf')
print(f'Extracted {len(result)} characters')
"
```

**Solution:**
1. Check file format is supported
2. Try opening file manually (is it corrupted?)
3. Reduce file size if too large
4. Check ETL service logs

### Issue 4: "Failed to generate embeddings"

**Symptoms:**
- Error in Celery logs: "Failed to generate embeddings"

**Causes:**
1. Embedding model not loaded
2. Out of memory
3. GPU issues (if using GPU)
4. Text too long

**Debug:**
```bash
# Check embedding model configuration
grep EMBEDDING_MODEL backend/.env

# Check memory usage
free -h

# Test embedding generation
cd SurfSense-main/backend
uv run python -c "
from app.config import config
embeddings = config.embedding_model_instance
test_text = 'This is a test'
result = embeddings.embed([test_text])
print(f'Generated embedding with {len(result[0])} dimensions')
"
```

**Solution:**
1. Restart backend to reload model
2. Free up memory (close other apps)
3. Use CPU instead of GPU if GPU issues
4. Split long texts into smaller chunks

### Issue 5: "Database error"

**Symptoms:**
- Error in Celery logs: "Database error" or "IntegrityError"

**Causes:**
1. PostgreSQL not running
2. Database connection lost
3. Duplicate entries
4. Schema mismatch

**Debug:**
```bash
# Check PostgreSQL is running
psql -U surfsense -d surfsense -c "SELECT 1;"

# Check database connections
psql -U surfsense -d surfsense -c "
  SELECT count(*) 
  FROM pg_stat_activity 
  WHERE datname = 'surfsense';
"

# Check for errors in PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**Solution:**
1. Restart PostgreSQL
2. Check DATABASE_URL in .env
3. Run database migrations
4. Check disk space

## Step 5: Manual Indexing Test

Test indexing a single file manually to isolate issues:

```python
# Create file: test_indexing.py
import asyncio
from app.db import get_async_session
from app.services.composio_service import ComposioService
from app.connectors.google_drive import GoogleDriveClient
from app.utils.google_credentials import build_composio_credentials

async def test_index_file():
    """Test indexing a single file."""
    
    # Configuration
    CONNECTOR_ID = 1  # Your connector ID
    CONNECTED_ACCOUNT_ID = "your_connected_account_id"  # From database
    FILE_ID = "your_google_drive_file_id"  # From Google Drive
    
    print("Step 1: Building credentials...")
    credentials = build_composio_credentials(CONNECTED_ACCOUNT_ID)
    print("✅ Credentials built")
    
    print("\nStep 2: Initializing Drive client...")
    async for session in get_async_session():
        drive_client = GoogleDriveClient(session, CONNECTOR_ID, credentials=credentials)
        print("✅ Drive client initialized")
        
        print("\nStep 3: Downloading file...")
        content, error = await drive_client.download_file(FILE_ID)
        if error:
            print(f"❌ Download failed: {error}")
            return
        print(f"✅ Downloaded {len(content)} bytes")
        
        print("\nStep 4: Extracting text...")
        # Save to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            f.write(content)
            temp_path = f.name
        
        from app.etl.docling_etl import extract_text_from_file
        text = extract_text_from_file(temp_path)
        print(f"✅ Extracted {len(text)} characters")
        
        print("\nStep 5: Chunking text...")
        from app.config import config
        chunks = config.chunker_instance.chunk(text)
        print(f"✅ Created {len(chunks)} chunks")
        
        print("\nStep 6: Generating embeddings...")
        chunk_texts = [chunk.text for chunk in chunks]
        embeddings = config.embedding_model_instance.embed(chunk_texts[:5])  # Test first 5
        print(f"✅ Generated {len(embeddings)} embeddings")
        
        print("\n✅ All steps successful!")
        print(f"\nSummary:")
        print(f"  - File size: {len(content)} bytes")
        print(f"  - Text length: {len(text)} characters")
        print(f"  - Chunks: {len(chunks)}")
        print(f"  - Embedding dimensions: {len(embeddings[0])}")

if __name__ == "__main__":
    asyncio.run(test_index_file())
```

Run it:
```bash
cd SurfSense-main/backend
uv run python test_indexing.py
```

This will show you exactly which step is failing.

## Step 6: Check Celery Task Queue

### View Pending Tasks

```bash
cd SurfSense-main/backend

# Check active tasks
uv run celery -A app.celery_app inspect active

# Check scheduled tasks
uv run celery -A app.celery_app inspect scheduled

# Check reserved tasks
uv run celery -A app.celery_app inspect reserved
```

### Clear Failed Tasks

```bash
# Purge all tasks (use with caution!)
uv run celery -A app.celery_app purge

# Or just restart Celery worker
# Ctrl+C to stop, then restart
uv run celery -A app.celery_app worker --loglevel=info
```

## Step 7: Monitor Resource Usage

### Check Disk Space

```bash
df -h
```

**Need:** At least 10GB free for indexing

### Check Memory

```bash
free -h
```

**Need:** At least 2GB free RAM

### Check CPU

```bash
top
# Or
htop
```

**Look for:** High CPU usage by celery or python processes

## Step 8: Verify File Access

Test if you can actually access the file:

```bash
cd SurfSense-main/backend
uv run python -c "
from app.services.composio_service import ComposioService
import asyncio

async def test():
    service = ComposioService()
    connected_account_id = 'your_connected_account_id'
    entity_id = 'surfsense_1'  # Replace with your user ID
    file_id = 'your_file_id'
    
    # Test file metadata
    metadata, error = await service.get_file_metadata(
        connected_account_id, entity_id, file_id
    )
    if error:
        print(f'❌ Error: {error}')
    else:
        print(f'✅ File: {metadata.get(\"name\")}')
        print(f'   Type: {metadata.get(\"mimeType\")}')
        print(f'   Size: {metadata.get(\"size\")} bytes')
    
    # Test file download
    content, error = await service.get_drive_file_content(
        connected_account_id, entity_id, file_id
    )
    if error:
        print(f'❌ Download error: {error}')
    else:
        print(f'✅ Downloaded {len(content)} bytes')

asyncio.run(test())
"
```

## Common Log Messages

### Good Signs

```
✅ "Task started: index_document"
✅ "Downloaded file: filename.pdf"
✅ "Extracted 1234 words"
✅ "Created 15 chunks"
✅ "Generated embeddings"
✅ "Stored in database"
✅ "Task completed successfully"
```

### Warning Signs

```
⚠️  "Retrying task (attempt 2/3)"
⚠️  "Slow embedding generation"
⚠️  "Large file, may take time"
```

### Error Signs

```
❌ "Task failed: [error message]"
❌ "Failed to download file"
❌ "Failed to extract text"
❌ "Database connection lost"
❌ "Out of memory"
```

## Getting Help

### Collect Debug Information

Before asking for help, collect this information:

```bash
# 1. System info
uname -a
python --version

# 2. Service status
ps aux | grep -E "celery|redis|postgres"

# 3. Recent logs
tail -n 100 backend.log > debug_backend.log
tail -n 100 celery.log > debug_celery.log

# 4. Database status
psql -U surfsense -d surfsense -c "
  SELECT 
    COUNT(*) as total_documents,
    COUNT(DISTINCT connector_id) as connectors
  FROM documents;
" > debug_db.txt

# 5. Configuration
grep -v "SECRET\|PASSWORD\|KEY" backend/.env > debug_config.txt
```

### Create Issue

Include:
1. What you're trying to do
2. What's happening (error messages)
3. Debug logs (backend.log, celery.log)
4. System info
5. Steps to reproduce

## Prevention

### Best Practices

1. **Always run Celery worker** when indexing
2. **Monitor logs** during indexing
3. **Start small** (test with 1-2 files first)
4. **Check disk space** before large indexing jobs
5. **Keep services updated**

### Health Checks

Create a health check script:

```bash
#!/bin/bash
# health_check.sh

echo "Checking SurfSense services..."

# Backend
if curl -s http://localhost:8000/api/v1/health > /dev/null; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Not running"
fi

# Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not running"
fi

# PostgreSQL
if psql -U surfsense -d surfsense -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Running"
else
    echo "❌ PostgreSQL: Not running"
fi

# Celery
if ps aux | grep -q "[c]elery.*worker"; then
    echo "✅ Celery: Running"
else
    echo "❌ Celery: Not running"
fi
```

Run before indexing:
```bash
chmod +x health_check.sh
./health_check.sh
```

---

**Last Updated:** 2026-04-09  
**Related Docs:**
- `QUICK_START_GOOGLE_DRIVE.md` - Basic usage
- `HOW_TO_USE_GOOGLE_DRIVE_WITH_LLM.md` - Detailed guide
- `TROUBLESHOOTING_COMPOSIO.md` - Connection issues
