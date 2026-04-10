# PostCSS Test Configuration Fix

**Date:** 2026-04-10  
**Issue:** PostCSS config causing test failures  
**Status:** RESOLVED ✅

---

## Problem

Tests were failing with PostCSS configuration error:

```
Failed to load PostCSS config: Failed to load PostCSS config
TypeError: Invalid PostCSS Plugin found at: plugins[0]
```

**Root Cause:**
- Vitest has `css: false` in config to skip CSS processing
- However, Vite still tries to load `postcss.config.mjs`
- PostCSS plugin specified as string `"@tailwindcss/postcss"` works for Next.js but not for Vite/Vitest

---

## Solution

### 1. Updated `vitest.config.ts`

Added environment variable to detect test environment:

```typescript
export default defineConfig({
  test: {
    // ... other config
    env: {
      VITEST: "true",
    },
  },
});
```

### 2. Updated `postcss.config.mjs`

Conditionally load plugins based on environment:

```javascript
// Skip PostCSS plugins during Vitest tests
// Vitest has css: false but still tries to load this config
const config = {
  plugins: process.env.VITEST ? [] : ["@tailwindcss/postcss"],
};

export default config;
```

---

## Results

All 12 tests now passing:

```
✓ hooks/__tests__/use-audio-capture.test.ts (6)
✓ hooks/__tests__/use-webrtc-client.test.ts (6)

Test Files  2 passed (2)
     Tests  12 passed (12)
  Duration  2.94s
```

---

## Why This Works

1. **Environment Detection:** `process.env.VITEST` is set during test runs
2. **Conditional Loading:** PostCSS plugins only load in non-test environments
3. **No Breaking Changes:** Next.js dev/build still works normally
4. **Clean Solution:** No need to rename files or use workarounds

---

## Alternative Solutions Considered

1. **Rename PostCSS config during tests** ❌
   - Requires manual file operations
   - Error-prone
   - Not automated

2. **Use different PostCSS config file** ❌
   - Duplication
   - Maintenance burden

3. **Downgrade vitest** ❌
   - Already on compatible version (2.1.9)
   - Not the root cause

4. **Conditional loading (chosen)** ✅
   - Clean
   - Automated
   - No side effects

---

## Files Modified

1. `frontend/vitest.config.ts` - Added VITEST env variable
2. `frontend/postcss.config.mjs` - Conditional plugin loading

---

**Status:** RESOLVED ✅  
**Tests:** 12/12 passing  
**Ready for:** Day 15-16 Audio Playback
