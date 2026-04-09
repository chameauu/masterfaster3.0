# Zero Cache Setup & Troubleshooting

**Last Updated:** 2026-04-09  
**Issue Resolved:** Documents not appearing in frontend after upload

---

## 🎯 What is Zero Cache?

**Zero Cache** (@rocicorp/zero) is a real-time synchronization system that keeps your frontend in sync with the backend database.

Think of it like this:
- **Backend** writes to PostgreSQL database
- **Zero Cache** watches for changes in real-time
- **Frontend** subscribes to Zero Cache for updates
- **Result:** Instant UI updates without page refresh

---

## 🔍 The Problem

**Symptoms:**
- Documents upload successfully (Celery processes them)
- Documents are in the database
- Documents DON'T appear in the frontend
- No errors in backend logs

**Root Cause:**
Zero Cache requires PostgreSQL to have `wal_level = logical` for real-time replication, but the default is `wal_level = replica`.

---

## ✅ The Solution

### 1. Configure PostgreSQL for Logical Replication

PostgreSQL needs these settings in `postgresql.conf`:

```conf
# Enable logical replication (required for Zero-cache)
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

### 2. Mount Configuration in Docker

Update `docker-compose.dev.yml`:

```yaml
postgres:
  image: pgvector/pgvector:pg17
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./postgresql.conf:/etc/postgresql/postgresql.conf:ro
  command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

### 3. Add Zero Cache Service

```yaml
zero-cache:
  image: rocicorp/zero:0.26.2
  ports:
    - "4848:4848"
  environment:
    ZERO_UPSTREAM_DB: postgresql://surfsense:surfsense@postgres:5432/surfsense?sslmode=disable
    ZERO_CVR_DB: postgresql://surfsense:surfsense@postgres:5432/surfsense?sslmode=disable
    ZERO_CHANGE_DB: postgresql://surfsense:surfsense@postgres:5432/surfsense?sslmode=disable
    ZERO_REPLICA_FILE: /data/zero.db
    ZERO_APP_PUBLICATIONS: zero_publication
    ZERO_QUERY_URL: http://host.docker.internal:3000/api/zero/query
    ZERO_MUTATE_URL: http://host.docker.internal:3000/api/zero/mutate
  volumes:
    - zero_cache_data:/data
  depends_on:
    postgres:
      condition: service_healthy
```

### 4. Start Services

```bash
# Restart PostgreSQL with new config
docker compose -f docker-compose.dev.yml up -d postgres --force-recreate

# Start Zero Cache
docker compose -f docker-compose.dev.yml up -d zero-cache

# Verify Zero Cache is running
curl http://localhost:4848/keepalive
# Should return: OK
```

---

## 🔧 How It Works

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│         Real-Time Document Sync Flow                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User uploads document                              │
│     ↓                                                   │
│  2. Backend saves to PostgreSQL                        │
│     ↓                                                   │
│  3. PostgreSQL WAL (Write-Ahead Log) records change    │
│     ↓                                                   │
│  4. Zero Cache detects change via logical replication  │
│     ↓                                                   │
│  5. Zero Cache updates its local replica               │
│     ↓                                                   │
│  6. Frontend queries Zero Cache                        │
│     ↓                                                   │
│  7. Document appears in UI instantly! ✅               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Without Zero Cache

```
1. User uploads document
2. Backend saves to PostgreSQL
3. Frontend polls backend every X seconds
4. Document appears after delay ❌
```

### With Zero Cache

```
1. User uploads document
2. Backend saves to PostgreSQL
3. Zero Cache pushes update to frontend
4. Document appears instantly ✅
```

---

## 🚀 Verification

### Check All Services Are Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

You should see:
- ✅ surfsense-postgres (healthy)
- ✅ surfsense-redis (healthy)
- ✅ surfsense-zero-cache (healthy)
- ✅ surfsense-searxng (healthy)

### Check Zero Cache Health

```bash
curl http://localhost:4848/keepalive
# Should return: OK
```

### Check Zero Cache Logs

```bash
docker logs surfsense-zero-cache --tail 50
```

Look for:
- ✅ "zero-cache ready"
- ✅ "zero-dispatcher listening at http://[::]:4848"
- ✅ "all workers ready"
- ❌ NO errors about "wal_level"

### Check PostgreSQL WAL Level

```bash
psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "SHOW wal_level;"
```

Should return:
```
 wal_level 
-----------
 logical
```

---

## 🐛 Troubleshooting

### Issue 1: Zero Cache Won't Start

**Error:**
```
Postgres must be configured with "wal_level = logical" (currently: "replica")
```

**Solution:**
1. Ensure `postgresql.conf` exists in project root
2. Check docker-compose mounts it correctly
3. Restart PostgreSQL:
   ```bash
   docker compose -f docker-compose.dev.yml up -d postgres --force-recreate
   ```
4. Verify WAL level:
   ```bash
   psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "SHOW wal_level;"
   ```

---

### Issue 2: Frontend Can't Connect to Zero Cache

**Error in browser console:**
```
Failed to connect to Zero Cache at http://localhost:4848
```

**Solution:**
1. Check Zero Cache is running:
   ```bash
   curl http://localhost:4848/keepalive
   ```
2. Check frontend `.env`:
   ```env
   NEXT_PUBLIC_ZERO_CACHE_URL=http://localhost:4848
   ```
3. Restart frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

### Issue 3: Documents Still Not Appearing

**Possible Causes:**

#### A. Celery Worker Not Running
```bash
# Check if Celery is running
ps aux | grep celery

# If not, start it
cd backend
uv run celery -A app.celery_app worker --loglevel=info --pool=solo
```

#### B. Document Processing Failed
Check Celery logs for errors:
```bash
# In Celery terminal, look for:
[ERROR] Task process_file_upload failed
```

#### C. Zero Cache Not Syncing
Check Zero Cache logs:
```bash
docker logs surfsense-zero-cache --tail 100 | grep ERROR
```

#### D. Frontend Not Subscribed
Check browser console for Zero errors:
```
F12 → Console → Look for Zero-related errors
```

---

### Issue 4: Slow Real-Time Updates

**Symptoms:**
- Documents appear but with 5-10 second delay

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Network latency | Normal for local dev |
| Zero Cache overloaded | Restart Zero Cache |
| PostgreSQL slow | Check disk I/O |
| Frontend polling interval | Check Zero config |

---

## 📊 Monitoring Zero Cache

### View Real-Time Logs

```bash
docker logs -f surfsense-zero-cache
```

You'll see:
- Connection events
- Replication stream updates
- Client subscriptions
- Query/mutate operations

### Check Replication Lag

```bash
psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "
SELECT slot_name, active, restart_lsn, confirmed_flush_lsn 
FROM pg_replication_slots;
"
```

### Check Active Connections

```bash
psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "
SELECT count(*) FROM pg_stat_activity 
WHERE application_name LIKE 'zero%';
"
```

---

## 🔧 Advanced Configuration

### Increase Replication Slots

If you have multiple Zero Cache instances:

```conf
# postgresql.conf
max_replication_slots = 20
max_wal_senders = 20
```

### Adjust WAL Settings for Performance

```conf
# postgresql.conf
wal_keep_size = 1GB
max_wal_size = 2GB
checkpoint_timeout = 15min
```

### Configure Zero Cache Workers

```yaml
# docker-compose.dev.yml
zero-cache:
  environment:
    ZERO_NUM_SYNC_WORKERS: 8  # More workers = more concurrent clients
```

---

## 📝 Quick Reference

### Start Everything

```bash
# Terminal 1: Docker services
docker compose -f docker-compose.dev.yml up -d

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

### Check Status

```bash
# All Docker services
docker ps

# Zero Cache health
curl http://localhost:4848/keepalive

# PostgreSQL WAL level
psql postgresql://surfsense:surfsense@localhost:5432/surfsense -c "SHOW wal_level;"

# Zero Cache logs
docker logs surfsense-zero-cache --tail 50
```

### Stop Everything

```bash
# Stop Docker services
docker compose -f docker-compose.dev.yml down

# Stop backend (Ctrl+C in terminal)
# Stop Celery (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)
```

---

## 🎯 Summary

**The Fix:**
1. ✅ Configure PostgreSQL with `wal_level = logical`
2. ✅ Start Zero Cache container
3. ✅ Documents now appear instantly in frontend

**Why It Works:**
- PostgreSQL logical replication streams changes to Zero Cache
- Zero Cache maintains a real-time replica
- Frontend subscribes to Zero Cache for instant updates
- No polling, no delays, just real-time sync!

---

## 📚 Related Documentation

- [Celery & Document Processing](./CELERY_AND_DOCUMENT_PROCESSING.md) - Background task processing
- [Current Status](./CURRENT_STATUS.md) - Overall project status
- [Database Setup](./DATABASE_SETUP_NOTES.md) - Database configuration

---

## 🔗 External Resources

- [Zero Cache Documentation](https://zerosync.dev/)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [PostgreSQL WAL Configuration](https://www.postgresql.org/docs/current/wal-configuration.html)

---

**Last Updated:** 2026-04-09  
**Status:** ✅ Working  
**Maintained By:** Voice Assistant Development Team
