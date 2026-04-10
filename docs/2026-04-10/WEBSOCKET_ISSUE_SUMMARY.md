# WebSocket Connection Issue - Summary

**Date:** 2026-04-10  
**Status:** ⚠️ Known Issue  
**Impact:** Pipecat voice button cannot connect in Next.js

---

## 🐛 Problem

WebSocket connection from Next.js frontend to Pipecat backend fails with:
```
[WebRTC] WebSocket error: {}
```

**Endpoint:** `ws://localhost:8000/api/v1/pipecat/ws`

---

## ✅ What Works

1. **Backend is running** - Health endpoint responds correctly
   ```bash
   curl http://localhost:8000/api/v1/pipecat/health
   # {"status":"ok","service":"pipecat",...}
   ```

2. **WebSocket endpoint exists** - Route is registered correctly

3. **Command-line tools work** - wscat can connect successfully
   ```bash
   wscat -c ws://localhost:8000/api/v1/pipecat/ws
   # Connected successfully
   ```

4. **Plain HTML works** - Simple HTML test file connects fine

---

## ❌ What Doesn't Work

**Next.js frontend** - Cannot establish WebSocket connection
- Error occurs immediately on connection attempt
- No specific error details in the event object
- Browser shows: "interrupted while the page was loading"

---

## 🔍 Investigation Results

### Tests Performed

1. ✅ Backend health check - Working
2. ✅ Route prefix fix - Applied (`/pipecat` instead of `/api/v1/pipecat`)
3. ✅ Command-line WebSocket test - Working
4. ✅ Plain HTML WebSocket test - Working
5. ❌ Next.js WebSocket connection - Failing

### Possible Causes

1. **Next.js/Turbopack Issue**
   - Hot Module Replacement (HMR) interference
   - Page hydration timing
   - Development server proxy issues

2. **Browser Security**
   - Mixed content (HTTP/WS)
   - CORS-related WebSocket restrictions
   - Firefox-specific WebSocket policies

3. **Timing Issue**
   - WebSocket created before page fully loaded
   - Component mounting/unmounting rapidly
   - React Strict Mode (disabled, so not this)

---

## 🎯 Recommended Solution

**Use the existing Web Speech API voice system** that's already working in the dashboard.

### Why?

1. **Already integrated** - Working in dashboard composer
2. **No infrastructure needed** - Browser-based
3. **Proven stable** - No connection issues
4. **Accessible** - Supports always-listening mode
5. **Has TTS** - Text-to-speech for responses

### Location

The working voice system is in:
- `frontend/components/voice/VoiceToggle.tsx`
- `frontend/components/voice/TTSToggle.tsx`
- Already integrated in `/dashboard/.../new-chat`

---

## 🔄 Alternative Approaches

### Option 1: Use Web Speech API (Recommended)
**Status:** ✅ Working now  
**Effort:** None (already done)  
**Quality:** Good (browser-dependent)

### Option 2: Debug Next.js WebSocket Issue
**Status:** ⏳ In progress  
**Effort:** High (unknown root cause)  
**Quality:** Excellent (when working)

**Debugging steps to try:**
1. Test with webpack instead of Turbopack
   ```bash
   cd frontend && pnpm dev --webpack
   ```

2. Increase file watch limit (Linux)
   ```bash
   sudo sysctl fs.inotify.max_user_watches=524288
   ```

3. Test in production build
   ```bash
   cd frontend && pnpm build && pnpm start
   ```

4. Test in different browser (Chrome instead of Firefox)

5. Add WebSocket proxy in next.config.ts
   ```typescript
   async rewrites() {
     return [
       {
         source: '/api/v1/pipecat/:path*',
         destination: 'http://localhost:8000/api/v1/pipecat/:path*',
       },
     ];
   }
   ```

### Option 3: Hybrid Approach
**Status:** ⏳ Possible  
**Effort:** Medium  
**Quality:** Best of both

Use Web Speech API for now, migrate to Pipecat later when issue is resolved.

---

## 📊 Comparison

| Feature | Web Speech API | Pipecat |
|---------|---------------|---------|
| **Status** | ✅ Working | ❌ Connection issue |
| **STT Quality** | Good | Excellent |
| **TTS Quality** | Good | Excellent |
| **Latency** | Low | Very low |
| **Setup** | None | Backend required |
| **Reliability** | High | Unknown (can't test) |

---

## 🎯 Decision

**Recommendation:** Continue using Web Speech API voice system for now.

**Reasons:**
1. It works reliably
2. Already integrated in dashboard
3. Provides good user experience
4. No infrastructure complexity
5. Can migrate to Pipecat later

**When to revisit Pipecat:**
1. WebSocket issue is resolved
2. Need better audio quality
3. Need more control over voice pipeline
4. Have time for thorough debugging

---

## 📝 Next Steps

### Immediate (Use What Works)

1. **Document Web Speech API system**
   - Already done in `VOICE_SYSTEMS_COMPARISON.md`

2. **Remove Pipecat button from header** (optional)
   - Or keep it disabled with tooltip explaining the issue

3. **Focus on other features**
   - Context integration
   - Conversation history
   - User preferences

### Future (When Ready to Debug)

1. **Test with webpack** instead of Turbopack
2. **Test in production build**
3. **Test in different browsers**
4. **Add WebSocket proxy** in Next.js config
5. **Consult Next.js/Turbopack community**

---

## 🔗 Related Issues

- Similar issue reported in earlier session (git reset removed those changes)
- Plain HTML test works, Next.js doesn't
- Error message provides no details
- Browser shows "interrupted while page loading"

---

## 📚 References

- `docs/VOICE_SYSTEMS_COMPARISON.md` - All voice systems
- `docs/2026-04-10/PIPECAT_DASHBOARD_INTEGRATION.md` - Integration attempt
- `docs/2026-04-10/PIPECAT_ROUTE_FIX.md` - Route prefix fix
- `test_websocket.html` - Working plain HTML test (if it still exists)

---

**Status:** ⚠️ Known issue, workaround available  
**Impact:** Medium (alternative solution exists)  
**Priority:** Low (Web Speech API works well)  
**Last Updated:** 2026-04-10
