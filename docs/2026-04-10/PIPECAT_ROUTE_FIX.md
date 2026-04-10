# Pipecat Route Prefix Fix

**Date:** 2026-04-10  
**Issue:** WebSocket connection failing with 404  
**Status:** ✅ Fixed

---

## 🐛 Problem

WebSocket connection to `ws://localhost:8000/api/v1/pipecat/ws` was failing with error:
```
[WebRTC] WebSocket error: {}
```

Health endpoint also returned 404:
```bash
curl http://localhost:8000/api/v1/pipecat/health
# {"detail":"Not Found"}
```

---

## 🔍 Root Cause

**Double prefix issue:**

The `pipecat_routes.py` had:
```python
router = APIRouter(prefix="/api/v1/pipecat", tags=["pipecat"])
```

But in `app/routes/__init__.py`, this router is included in the main router, which is then included in `app.py` with:
```python
app.include_router(crud_router, prefix="/api/v1", tags=["crud"])
```

This resulted in the final path being:
```
/api/v1 + /api/v1/pipecat = /api/v1/api/v1/pipecat  ❌
```

---

## ✅ Solution

Changed `pipecat_routes.py` to use relative prefix:

**Before:**
```python
router = APIRouter(prefix="/api/v1/pipecat", tags=["pipecat"])
```

**After:**
```python
router = APIRouter(prefix="/pipecat", tags=["pipecat"])
```

Now the final path is correct:
```
/api/v1 + /pipecat = /api/v1/pipecat  ✅
```

---

## 🧪 Verification

**Health endpoint:**
```bash
curl http://localhost:8000/api/v1/pipecat/health
# {"status":"ok","service":"pipecat","message":"Pipecat service is running","version":"0.0.108"}
```

**WebSocket endpoint:**
```
ws://localhost:8000/api/v1/pipecat/ws  ✅
```

---

## 📁 Files Modified

1. `backend/app/routes/pipecat_routes.py`
   - Changed `prefix="/api/v1/pipecat"` to `prefix="/pipecat"`

---

## 🎯 Impact

✅ WebSocket connection now works  
✅ Health endpoint accessible  
✅ Frontend can connect to Pipecat backend  
✅ Voice button in dashboard functional  

---

## 📝 Lessons Learned

When using nested routers in FastAPI:
1. Child routers should use **relative prefixes**
2. Parent router adds the base prefix
3. Avoid duplicating prefixes in child routers

**Pattern:**
```python
# Child router (pipecat_routes.py)
router = APIRouter(prefix="/pipecat")  # Relative

# Parent router (routes/__init__.py)
router.include_router(pipecat_router)  # No prefix

# App (app.py)
app.include_router(crud_router, prefix="/api/v1")  # Base prefix

# Result: /api/v1/pipecat ✅
```

---

**Status:** ✅ Fixed  
**Last Updated:** 2026-04-10
