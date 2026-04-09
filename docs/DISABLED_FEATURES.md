# Disabled Features & Unnecessary Components

**Project:** Voice-First Research Assistant for Visually Impaired Users  
**Date:** 2026-04-09  
**Purpose:** Document all features/components disabled to focus on voice assistant development

---

## 🎯 Overview

This document tracks all SurfSense features that have been disabled or identified as unnecessary for the voice assistant project. All files are preserved (not deleted) for potential future use.

---

## ✅ Disabled Features

### 1. Authentication System

**Status:** ✅ DISABLED (TEMPORARY)  
**Date:** 2026-04-09  
**Method:** Modified auth utilities and dependencies to bypass checks  
**Purpose:** Enable direct access to dashboard for development

**What Was Changed:**

**Frontend:**
- `lib/auth-utils.ts`:
  - `getBearerToken()` - Returns dummy token "dev-bypass-token"
  - `isAuthenticated()` - Always returns true
- `app/dashboard/layout.tsx` - Removed auth check logic
- `app/(home)/page.tsx` - Always redirects to dashboard (no login check)

**Backend:**
- `app/users.py`:
  - `current_active_user` - Returns mock user (creates dev@localhost if no users exist)
  - `current_optional_user` - Returns mock user
  - Creates dev user with ID `00000000-0000-0000-0000-000000000001` if database is empty

**Security Warning:** ⚠️ This is for DEVELOPMENT ONLY. Re-enable auth before production!

**How to Re-enable:**
1. Restore frontend files:
   ```bash
   git checkout lib/auth-utils.ts
   git checkout app/dashboard/layout.tsx
   git checkout app/(home)/page.tsx
   ```
2. Restore backend file:
   ```bash
   git checkout app/users.py
   ```

**Current Flow:**
```
Frontend: / → /dashboard (no auth check)
Backend: All endpoints → Mock user (dev@localhost)
```

---

### 2. Marketing Homepage

**Status:** ✅ DISABLED  
**Date:** 2026-04-09  
**Method:** Modified redirect logic

**What Was Changed:**
- `app/(home)/page.tsx` - Now redirects to `/dashboard` (authenticated) or `/login` (unauthenticated)
- Homepage components preserved but not rendered

**Preserved Components:**
```
components/homepage/
├── cta.tsx                      # Call to action section
├── features-bento-grid.tsx      # Features grid layout
├── features-card.tsx            # Individual feature cards
├── footer-new.tsx               # Marketing footer
├── github-stars-badge.tsx       # GitHub stars display
├── hero-section.tsx             # Hero/landing section
├── integrations.tsx             # Integration showcase
├── navbar.tsx                   # Marketing navbar
├── use-cases-grid.tsx           # Use cases display
└── why-surfsense.tsx            # Value proposition section
```

**How to Re-enable:**
```bash
git checkout app/(home)/page.tsx
```

**Reason:** Voice assistant users don't need marketing content; they need direct access to functionality.

---

### 2. Pricing Pages

**Status:** ⚠️ ACTIVE (Should be disabled)  
**Location:** `app/(home)/pricing/`  
**Components:** `components/pricing/`

**Files:**
```
app/(home)/pricing/page.tsx
components/pricing/pricing-section.tsx
components/pricing/pricing.tsx
components/pricing.tsx (root level)
```

**Recommendation:** Disable by redirecting to dashboard (same as homepage)

**Reason:** Voice assistant is a feature, not a separate paid product.

---

### 3. Contact Page

**Status:** ⚠️ ACTIVE (Should be disabled)  
**Location:** `app/(home)/contact/`  
**Components:** `components/contact/`

**Recommendation:** Disable or replace with simple support email

**Reason:** Visually impaired users need accessible support channels, not web forms.

---

## 🚫 Unnecessary Components (Not Used by Voice Assistant)

### 1. Rich Text Editor (Plate.js)

**Status:** ❌ NOT NEEDED  
**Location:** `components/editor/`, `components/editor-panel/`  
**Dependencies:** `@platejs/*`, `@udecode/*`

**Why Unnecessary:**
- Voice assistant is 100% voice-based
- No text editing interface needed
- Users interact via speech only

**Impact:** Large bundle size (~500KB+)

**Action:** Keep installed (used by main SurfSense), but don't import in voice components

---

### 2. Video Presentation Generation

**Status:** ❌ NOT NEEDED  
**Location:** `components/tool-ui/video-presentation/`  
**Dependencies:** `@remotion/*`, `remotion`

**Why Unnecessary:**
- Voice assistant focuses on audio interaction
- Video generation not accessible for visually impaired users
- Not part of voice assistant scope

**Action:** Don't import in voice components

---

### 3. Podcast Generation UI

**Status:** ⚠️ PARTIALLY NEEDED  
**Location:** `components/tool-ui/generate-podcast.tsx`

**Why Partially Needed:**
- Audio playback component can be reused
- Generation UI not needed (voice-triggered instead)

**Action:** Adapt audio playback, skip generation UI

---

### 4. Image Generation

**Status:** ❌ NOT NEEDED  
**Location:** `components/tool-ui/image/`, `components/tool-ui/generate-image.tsx`  
**Atoms:** `atoms/image-gen-config/`

**Why Unnecessary:**
- Not accessible for visually impaired users
- Not part of voice assistant scope

**Action:** Don't import in voice components

---

### 5. Notion Integration UI

**Status:** ❌ NOT NEEDED  
**Location:** `components/tool-ui/notion/`

**Why Unnecessary:**
- Voice assistant searches existing documents
- No need for Notion-specific UI
- Backend integration sufficient

**Action:** Don't import in voice components

---

### 6. Confluence Integration UI

**Status:** ❌ NOT NEEDED  
**Location:** `components/tool-ui/confluence/`

**Why Unnecessary:**
- Same as Notion - backend only

**Action:** Don't import in voice components

---

### 7. Linear/Jira Integration UI

**Status:** ❌ NOT NEEDED  
**Location:** `components/tool-ui/linear/`, `components/tool-ui/jira/`

**Why Unnecessary:**
- Voice assistant is for research, not project management
- Not in scope

**Action:** Don't import in voice components

---

### 8. Gmail/Calendar Integration UI

**Status:** ❌ NOT NEEDED  
**Location:** `components/tool-ui/gmail/`, `components/tool-ui/google-calendar/`

**Why Unnecessary:**
- Voice assistant is for document research
- Email/calendar not in scope

**Action:** Don't import in voice components

---

### 9. Public Chat Sharing

**Status:** ❌ NOT NEEDED  
**Location:** `components/public-chat/`, `components/public-chat-snapshots/`  
**Routes:** `app/public/`

**Why Unnecessary:**
- Voice assistant is personal/private
- No sharing functionality needed

**Action:** Don't import in voice components

---

### 10. Desktop App Components

**Status:** ⚠️ MAYBE NEEDED LATER  
**Location:** `components/desktop/`, `app/desktop/`

**Why Maybe Needed:**
- Desktop app could be useful for accessibility
- Not priority for MVP

**Action:** Skip for now, revisit in Phase 4

---

### 11. HITL (Human-in-the-Loop) Edit Panel

**Status:** ❌ NOT NEEDED  
**Location:** `components/hitl-edit-panel/`  
**Atoms:** `atoms/chat/hitl-edit-panel.atom.ts`

**Why Unnecessary:**
- Voice assistant provides direct answers
- No editing workflow needed

**Action:** Don't import in voice components

---

### 12. Report Panel

**Status:** ❌ NOT NEEDED  
**Location:** `components/report-panel/`  
**Atoms:** `atoms/chat/report-panel.atom.ts`

**Why Unnecessary:**
- Voice assistant provides spoken responses
- No report generation needed

**Action:** Don't import in voice components

---

### 13. Prompt Library UI

**Status:** ❌ NOT NEEDED  
**Location:** `components/prompt-kit/`  
**Atoms:** `atoms/prompts/`

**Why Unnecessary:**
- Voice assistant uses predefined prompts
- No user-facing prompt management

**Action:** Don't import in voice components

---

### 14. Chat Comments

**Status:** ❌ NOT NEEDED  
**Location:** `components/chat-comments/`  
**Atoms:** `atoms/chat-comments/`

**Why Unnecessary:**
- Voice assistant is single-user
- No collaboration features

**Action:** Don't import in voice components

---

### 15. Connector Management UI

**Status:** ⚠️ PARTIALLY NEEDED  
**Location:** `components/connectors/`, `components/assistant-ui/connector-popup/`

**Why Partially Needed:**
- Backend connectors needed for document access
- UI not needed (admin configures, not end user)

**Action:** Skip UI, use backend connectors

---

## 📦 Unnecessary Backend Dependencies

### 1. PyTorch & CUDA Packages

**Status:** ❌ NOT NEEDED  
**Size:** ~2.5GB  
**Packages:**
- `torch`
- `nvidia-cuda-*`
- `nvidia-cublas`
- `nvidia-cudnn-cu13`
- `triton`

**Why Unnecessary:**
- Voice assistant uses API-based embeddings (OpenAI, Cohere)
- No local ML model inference needed
- Faster-Whisper uses CPU/ONNX (no PyTorch)

**Action:** Remove from `pyproject.toml` or use separate environment

---

### 2. Web Scraping Tools

**Status:** ❌ NOT NEEDED  
**Packages:**
- `playwright`
- `fake-useragent`
- `trafilatura`

**Why Unnecessary:**
- Voice assistant searches existing documents
- No web scraping needed

**Action:** Remove from voice assistant dependencies

---

### 3. Payment Processing

**Status:** ❌ NOT NEEDED  
**Packages:**
- `stripe`

**Why Unnecessary:**
- Voice assistant is a feature, not a paid product
- No payment processing needed

**Action:** Keep for main SurfSense, don't import in voice code

---

### 4. Data Processing Libraries

**Status:** ❌ NOT NEEDED  
**Packages:**
- `datasets`
- `pyarrow`

**Why Unnecessary:**
- Voice assistant processes audio/text in real-time
- No batch data processing

**Action:** Remove from voice assistant dependencies

---

## 🎯 What We're Keeping & Using

### Essential Components (100% Reusable)

✅ **UI Components** (`components/ui/`)
- Button, Dialog, Slider, Toggle, Input, Select
- All Radix UI + shadcn/ui components

✅ **Layout** (`components/layout/`)
- Sidebar, Header, Navigation

✅ **Providers** (`components/providers/`)
- PostHogProvider (analytics)
- GlobalLoadingProvider (loading states)
- I18nProvider (internationalization)
- ZeroProvider (real-time sync)

✅ **Auth** (`components/auth/`, `lib/auth-utils.ts`)
- Authentication flow
- Token management

✅ **API Patterns** (`lib/apis/base-api.service.ts`)
- BaseApiService class
- Error handling
- Retry logic

✅ **Hooks** (`hooks/`)
- use-debounce
- use-media-query
- use-mobile
- use-mounted
- use-platform

### Adaptable Components

🔄 **Audio Playback** (`components/tool-ui/audio.tsx`)
- Adapt for voice response playback

🔄 **Citations** (`components/tool-ui/citation/`)
- Adapt for voice-friendly citations

🔄 **Settings** (`components/settings/`)
- Add voice-specific settings

🔄 **Onboarding** (`components/onboarding-tour.tsx`)
- Create voice-specific tutorial

---

## 📊 Bundle Size Impact

### Before Optimization
- Initial JS: ~800KB
- Total (gzipped): ~1.2MB

### After Removing Unnecessary Imports
- Initial JS: <200KB (target)
- Voice route JS: <300KB (target)
- Total (gzipped): <500KB (target)

### Savings
- ~700KB reduction by not importing:
  - Plate.js editor
  - Remotion video
  - Tool-specific UIs
  - Public chat components

---

## 🔄 How to Disable More Features

### Template for Disabling a Route

1. **Modify the page.tsx:**
   ```typescript
   "use client";
   
   import { useRouter } from "next/navigation";
   import { useEffect } from "react";
   
   export default function DisabledPage() {
     const router = useRouter();
     
     useEffect(() => {
       router.replace("/dashboard");
     }, [router]);
     
     return <div>Redirecting...</div>;
   }
   ```

2. **Document in this file:**
   - Add to "Disabled Features" section
   - Note date and reason
   - List preserved files
   - Provide re-enable instructions

3. **Update related docs:**
   - Update README if needed
   - Update navigation if needed

---

## 📝 Maintenance Notes

### When Adding New Features

Before adding a new feature, check:
1. Is it needed for voice assistant? (100% voice-based, accessibility-first)
2. Does it increase bundle size significantly?
3. Is there an existing component that can be adapted?
4. Does it work without visual interface?

### When Re-enabling Features

1. Check git history for original implementation
2. Test thoroughly (may have dependencies that changed)
3. Update this document
4. Update bundle size targets

---

## 🎯 Focus Areas for Voice Assistant

### What We're Building (Not Disabling)

✅ **Voice Interface** (`components/voice/`)
- VoiceRecorder
- VoiceAudioPlayer (adapted from audio.tsx)
- ConversationHistory
- VoiceSettings
- QuizInterface

✅ **Voice Hooks** (`hooks/voice/`)
- use-voice-recording
- use-audio-playback
- use-voice-conversation
- use-webrtc

✅ **Voice State** (`atoms/voice/`)
- voiceSessionAtom
- voiceConversationAtom
- voiceSettingsAtom
- voiceUIAtom
- voiceQuizAtom

✅ **Voice API** (`lib/apis/voice/`)
- VoiceAPI client
- WebRTC manager
- Audio utilities

---

## 📚 Related Documentation

- [Voice Assistant Implementation Roadmap](./VOICE_ASSISTANT_IMPLEMENTATION_ROADMAP.md)
- [Frontend Components Spec](./frontend/FRONTEND_COMPONENTS_SPEC.md)
- [Existing Frontend Components](./EXISTING_FRONTEND_COMPONENTS.md)
- [TDD Implementation Guide](./tdd/TDD_IMPLEMENTATION_GUIDE.md)
- [Dependencies and Packages](./DEPENDENCIES_AND_PACKAGES.md)

---

## 🔍 Quick Reference

### Disabled Routes
- ✅ `/` (homepage) → redirects to `/dashboard` or `/login`
- ⚠️ `/pricing` → should be disabled
- ⚠️ `/contact` → should be disabled

### Unnecessary Components (Don't Import)
- ❌ Editor (Plate.js)
- ❌ Video generation (Remotion)
- ❌ Image generation
- ❌ Tool-specific UIs (Notion, Jira, etc.)
- ❌ Public chat
- ❌ HITL panel
- ❌ Report panel
- ❌ Prompt library UI
- ❌ Chat comments

### Reusable Components (Import Freely)
- ✅ All `components/ui/*`
- ✅ All `components/layout/*`
- ✅ All `components/providers/*`
- ✅ All `hooks/*` (except tool-specific)
- ✅ `lib/apis/base-api.service.ts`
- ✅ `lib/auth-utils.ts`
- ✅ `lib/error.ts`
- ✅ `lib/utils.ts`

---

**Last Updated:** 2026-04-09  
**Maintained By:** Voice Assistant Development Team  
**Review Frequency:** Weekly during development, monthly after launch
