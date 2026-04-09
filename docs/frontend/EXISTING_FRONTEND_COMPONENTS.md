# Existing SurfSense Frontend Components

> **Complete inventory of components already implemented in SurfSense**  
> **Total Components:** 381 files  
> **Framework:** Next.js 16 + React 19 + TypeScript  
> **Last Updated:** 2026-04-09

---

## 📊 Overview

SurfSense has a comprehensive frontend with **381 component files** organized into **29 major categories**. These components provide a solid foundation for building the voice assistant feature.

---

## 🗂️ Component Categories

### 1. **assistant-ui/** (AI Chat Interface)
**Purpose:** Core AI chat interface components using @assistant-ui/react

**Key Components:**
- `edit-composer.tsx` - Message editing interface
- `thinking-steps.tsx` - Display AI reasoning steps
- `image.tsx` - Image handling in chat
- **connector-popup/** - Connector management UI
  - `connector-accounts-list-view.tsx`
  - `youtube-crawler-view.tsx`
  - `active-connectors-tab.tsx`
  - `all-connectors-tab.tsx`
  - Connector configs for: Teams, GitHub, Gmail, Drive, Obsidian, MCP, etc.

**Reusable for Voice:**
- ✅ Connector management UI
- ✅ Thinking steps display (can adapt for voice processing states)
- ✅ Message editing patterns

---

### 2. **new-chat/** (Chat Features)
**Purpose:** Chat-specific features and controls

**Components:**
- `chat-share-button.tsx` - Share conversations
- `prompt-picker.tsx` - Select prompts
- `chat-header.tsx` - Chat header UI
- `document-mention-picker.tsx` - Mention documents in chat
- `source-detail-panel.tsx` - Show source details
- `model-selector.tsx` - Select LLM model

**Reusable for Voice:**
- ✅ Model selector (can use for voice model selection)
- ✅ Source detail panel (for voice citations)
- ✅ Share functionality

---

### 3. **tool-ui/** (Tool Integration Components)
**Purpose:** UI for various tool integrations and actions

**Subcategories:**
- **notion/** - Notion integration (create, update, delete pages)
- **confluence/** - Confluence integration
- **linear/** - Linear issue management
- **jira/** - Jira issue management
- **gmail/** - Gmail operations (send, draft, trash)
- **google-drive/** - Drive file operations
- **google-calendar/** - Calendar event management
- **onedrive/** - OneDrive operations
- **dropbox/** - Dropbox operations
- **plan/** - Planning tool UI
- **citation/** - Citation display and management
- **image/** - Image generation UI
- **video-presentation/** - Video presentation generation
- **audio.tsx** - Audio playback component ✅ **IMPORTANT**

**Key Components:**
- `generate-report.tsx` - Report generation
- `generate-podcast.tsx` - Podcast generation
- `generate-image.tsx` - Image generation
- `sandbox-execute.tsx` - Code execution
- `user-memory.tsx` - User memory management
- `write-todos.tsx` - Todo generation

**Reusable for Voice:**
- ✅ **audio.tsx** - Can be adapted for voice playback
- ✅ Citation components - For voice citations
- ✅ Tool UI patterns - For voice tool displays

---

### 4. **ui/** (Base UI Components)
**Purpose:** Reusable UI primitives (likely shadcn/ui components)

**Expected Components:**
- Button, Input, Select, Dialog, Dropdown, etc.
- Form components
- Layout components
- Typography components

**Reusable for Voice:**
- ✅ All base UI components
- ✅ Form controls for settings
- ✅ Dialog/modal patterns

---

### 5. **layout/** (Layout Components)
**Purpose:** Application layout and navigation

**Subcategories:**
- Sidebar
- Header
- Navigation
- Footer
- Mobile menu

**Reusable for Voice:**
- ✅ Sidebar (can add voice assistant link)
- ✅ Header (can add voice button)
- ✅ Navigation patterns

---

### 6. **documents/** (Document Management)
**Purpose:** Document viewing and management

**Components:**
- Document list
- Document viewer
- Document upload
- Document search

**Reusable for Voice:**
- ✅ Document viewer (for voice citations)
- ✅ Document search patterns

---

### 7. **connectors/** (Connector Management)
**Purpose:** Data source connector configuration

**Components:**
- Connector cards
- Connector dialogs
- OAuth flows
- Sync status

**Reusable for Voice:**
- ✅ Connector status patterns
- ✅ OAuth flow patterns

---

### 8. **settings/** (Settings Pages)
**Purpose:** User settings and preferences

**Components:**
- Profile settings
- LLM configuration
- API keys
- Permissions
- Preferences

**Reusable for Voice:**
- ✅ Settings page structure
- ✅ Form patterns
- ✅ Preference management

---

### 9. **auth/** (Authentication)
**Purpose:** Authentication UI

**Components:**
- Login form
- Register form
- Password reset
- OAuth buttons

**Reusable for Voice:**
- ✅ Auth patterns (voice needs authentication)

---

### 10. **editor/** (Rich Text Editor)
**Purpose:** Plate.js rich text editor

**Components:**
- Editor component
- Toolbar
- Plugins
- Formatting controls

**Reusable for Voice:**
- ❌ Not directly applicable (voice doesn't need rich text)

---

### 11. **editor-panel/** (Editor Side Panel)
**Purpose:** Side panel for editor

**Reusable for Voice:**
- ✅ Side panel patterns

---

### 12. **hitl-edit-panel/** (Human-in-the-Loop Edit Panel)
**Purpose:** HITL editing interface

**Reusable for Voice:**
- ✅ Edit panel patterns

---

### 13. **report-panel/** (Report Panel)
**Purpose:** Report generation and display

**Reusable for Voice:**
- ✅ Panel patterns

---

### 14. **chat-comments/** (Chat Comments)
**Purpose:** Commenting on chat messages

**Components:**
- Comment thread
- Comment form
- Comment list
- Comment reactions

**Reusable for Voice:**
- ✅ Comment patterns (for voice conversation annotations)

---

### 15. **sources/** (Source Display)
**Purpose:** Display document sources

**Reusable for Voice:**
- ✅ Source display patterns (for voice citations)

---

### 16. **public-chat/** (Public Chat)
**Purpose:** Public chat sharing

**Reusable for Voice:**
- ✅ Sharing patterns

---

### 17. **public-chat-snapshots/** (Chat Snapshots)
**Purpose:** Chat snapshot viewing

**Reusable for Voice:**
- ✅ Snapshot patterns

---

### 18. **prompt-kit/** (Prompt Library)
**Purpose:** Prompt management

**Reusable for Voice:**
- ✅ Prompt patterns (for voice prompts)

---

### 19. **providers/** (Context Providers)
**Purpose:** React context providers

**Components:**
- `PostHogProvider.tsx` - Analytics
- `PostHogIdentify.tsx` - User identification
- `PostHogReferral.tsx` - Referral tracking
- `GlobalLoadingProvider.tsx` - Global loading state
- `I18nProvider.tsx` - Internationalization
- `ZeroProvider.tsx` - Real-time sync (@rocicorp/zero)

**Reusable for Voice:**
- ✅ All providers (voice will use same infrastructure)
- ✅ Analytics tracking
- ✅ Loading states
- ✅ i18n support

---

### 20. **shared/** (Shared Components)
**Purpose:** Shared utility components

**Reusable for Voice:**
- ✅ Utility components

---

### 21. **theme/** (Theme Components)
**Purpose:** Theme switching and management

**Reusable for Voice:**
- ✅ Theme support (voice UI should respect theme)

---

### 22. **icons/** (Icon Components)
**Purpose:** Custom icon components

**Reusable for Voice:**
- ✅ Icons (microphone, speaker, etc.)

---

### 23. **homepage/** (Homepage Components)
**Purpose:** Landing page components

**Reusable for Voice:**
- ❌ Not applicable to voice assistant

---

### 24. **pricing/** (Pricing Components)
**Purpose:** Pricing page components

**Components:**
- `pricing-section.tsx`
- `pricing.tsx`

**Reusable for Voice:**
- ❌ Not applicable to voice assistant

---

### 25. **announcements/** (Announcements)
**Purpose:** Announcement banners

**Reusable for Voice:**
- ✅ Announcement patterns (for voice feature announcements)

---

### 26. **contact/** (Contact Components)
**Purpose:** Contact forms

**Reusable for Voice:**
- ❌ Not applicable to voice assistant

---

### 27. **desktop/** (Desktop App Components)
**Purpose:** Electron desktop app specific components

**Reusable for Voice:**
- ✅ Desktop integration patterns

---

## 📄 Standalone Components

### Root-level Components

**1. document-viewer.tsx**
- View document content
- **Reusable:** ✅ For voice citations

**2. json-metadata-viewer.tsx**
- View JSON metadata
- **Reusable:** ✅ For debugging voice data

**3. markdown-viewer.tsx**
- Render markdown content
- **Reusable:** ✅ For voice response formatting

**4. inference-params-editor.tsx**
- Edit LLM inference parameters
- **Reusable:** ✅ For voice model configuration

**5. search-space-form.tsx**
- Create/edit search spaces
- **Reusable:** ✅ For voice search configuration

**6. onboarding-tour.tsx**
- User onboarding tour
- **Reusable:** ✅ Can adapt for voice onboarding

**7. pricing.tsx**
- Pricing display
- **Reusable:** ❌ Not applicable

**8. platform-gate.tsx**
- Platform-specific gating
- **Reusable:** ✅ For voice feature gating

**9. Logo.tsx**
- Application logo
- **Reusable:** ✅ For branding

**10. LanguageSwitcher.tsx**
- Language selection
- **Reusable:** ✅ For voice language selection

**11. UserDropdown.tsx**
- User menu dropdown
- **Reusable:** ✅ For navigation

**12. TokenHandler.tsx**
- JWT token management
- **Reusable:** ✅ For voice authentication

---

## 🎨 UI Component Library

SurfSense uses **Radix UI** + **shadcn/ui** patterns. Expected components in `components/ui/`:

- Accordion
- Alert
- Alert Dialog
- Avatar
- Badge
- Button
- Calendar
- Card
- Checkbox
- Collapsible
- Command
- Context Menu
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Popover
- Progress
- Radio Group
- Scroll Area
- Select
- Separator
- Skeleton
- Slider
- Switch
- Table
- Tabs
- Textarea
- Toast
- Toggle
- Tooltip

**All reusable for voice assistant UI** ✅

---

## 🔧 Hooks (Expected in `hooks/`)

Based on the file tree, SurfSense has custom hooks:

- `use-announcements.ts`
- `use-api-key.ts`
- `use-chat-session-state.ts`
- `use-comments-sync.ts`
- `use-comments.ts`
- `use-connectors-sync.ts`
- `use-debounce.ts`
- `use-debounced-value.ts`
- `use-document-search.ts`
- `use-documents-processing.ts`
- `use-documents.ts`
- `use-folder-sync.ts`
- `use-global-loading.ts`
- `use-google-drive-folders.ts`
- `use-google-picker.ts`
- `use-hitl-phase.ts`
- `use-inbox.ts`
- `use-logs.ts`
- `use-long-press.ts`
- `use-media-query.ts`
- `use-messages-sync.ts`
- `use-mobile.ts`
- `use-mounted.ts`
- `use-platform-shortcut.ts`
- `use-platform.ts`
- `use-public-chat-runtime.ts`
- `use-public-chat.ts`
- `use-search-source-connectors.ts`
- `use-typewriter.ts`
- `use-zero-document-type-counts.ts`

**Reusable for Voice:**
- ✅ `use-debounce` - For voice input debouncing
- ✅ `use-media-query` - For responsive voice UI
- ✅ `use-mobile` - For mobile voice interface
- ✅ `use-mounted` - For component lifecycle
- ✅ `use-platform` - For platform-specific features
- ✅ `use-global-loading` - For voice loading states

---

## 🎭 State Management (Atoms)

SurfSense uses **Jotai** for state management. Expected atoms in `atoms/`:

**Categories:**
- `agent-tools/` - Agent tool state
- `auth/` - Authentication state
- `chat/` - Chat state
- `chat-comments/` - Comment state
- `connector-dialog/` - Connector dialog state
- `connectors/` - Connector state
- `documents/` - Document state
- `editor/` - Editor state
- `image-gen-config/` - Image generation config
- `inbox/` - Inbox state
- `invites/` - Invite state
- `layout/` - Layout state
- `logs/` - Log state
- `members/` - Member state
- `new-llm-config/` - LLM configuration
- `permissions/` - Permission state
- `prompts/` - Prompt state
- `public-chat-snapshots/` - Snapshot state
- `roles/` - Role state
- `search-spaces/` - Search space state
- `settings/` - Settings state
- `tabs/` - Tab state
- `ui/` - UI state
- `user/` - User state
- `vision-llm-config/` - Vision LLM config

**Reusable for Voice:**
- ✅ `auth/` - Voice needs authentication
- ✅ `user/` - User information
- ✅ `settings/` - Voice settings
- ✅ `ui/` - UI state patterns
- ✅ `layout/` - Layout state

---

## 📚 Libraries & Utilities

### lib/ Directory

**Expected modules:**
- `apis/` - API clients
- `chat/` - Chat utilities
- `connectors/` - Connector utilities
- `posthog/` - Analytics
- `query-client/` - TanStack Query setup
- `remotion/` - Video generation
- `auth-errors.ts` - Auth error handling
- `auth-utils.ts` - Auth utilities
- `env-config.ts` - Environment configuration
- `error.ts` - Error handling
- `format-date.ts` - Date formatting
- `provider-icons.tsx` - Provider icons
- `source.ts` - Source utilities
- `supported-extensions.ts` - File extensions
- `utils.ts` - General utilities

**Reusable for Voice:**
- ✅ All API clients
- ✅ Auth utilities
- ✅ Error handling
- ✅ Date formatting
- ✅ General utilities

---

## 🎯 Key Components for Voice Assistant

### Highly Reusable Components

**1. Audio Playback:**
- ✅ `components/tool-ui/audio.tsx` - **CRITICAL** - Already has audio playback

**2. Citations:**
- ✅ `components/tool-ui/citation/` - Citation display components

**3. Settings:**
- ✅ `components/settings/` - Settings page structure
- ✅ `atoms/settings/` - Settings state management

**4. UI Components:**
- ✅ All `components/ui/` - Button, Dialog, Slider, Toggle, etc.

**5. Providers:**
- ✅ `components/providers/` - Analytics, i18n, loading, real-time sync

**6. Hooks:**
- ✅ `use-debounce` - Input debouncing
- ✅ `use-media-query` - Responsive design
- ✅ `use-mobile` - Mobile detection
- ✅ `use-global-loading` - Loading states

**7. State Atoms:**
- ✅ `atoms/auth/` - Authentication
- ✅ `atoms/user/` - User data
- ✅ `atoms/settings/` - Settings
- ✅ `atoms/ui/` - UI state

**8. Utilities:**
- ✅ `lib/apis/` - API clients
- ✅ `lib/auth-utils.ts` - Authentication
- ✅ `lib/error.ts` - Error handling
- ✅ `lib/utils.ts` - General utilities

---

## 📊 Summary

### Component Reusability for Voice Assistant

| Category | Total | Reusable | Percentage |
|----------|-------|----------|------------|
| UI Components | ~50 | ~50 | 100% |
| Layout Components | ~10 | ~10 | 100% |
| Tool UI | ~100 | ~20 | 20% |
| Chat Components | ~20 | ~15 | 75% |
| Settings | ~10 | ~10 | 100% |
| Providers | 6 | 6 | 100% |
| Hooks | ~30 | ~10 | 33% |
| Atoms | ~20 | ~8 | 40% |
| Utilities | ~20 | ~20 | 100% |

**Overall Reusability: ~60-70%**

### What We Can Reuse

✅ **Directly Reusable (No Changes):**
- All UI components (Button, Dialog, etc.)
- Layout components (Sidebar, Header)
- Providers (Analytics, i18n, loading)
- Auth components and utilities
- Settings page structure
- Error handling
- API client patterns

✅ **Adaptable (Minor Changes):**
- Audio playback component
- Citation display
- Onboarding tour
- Document viewer (for citations)
- Model selector (for voice models)

❌ **Not Applicable:**
- Rich text editor
- Homepage components
- Pricing components
- Most tool-specific UIs

---

## 🚀 Implementation Strategy

### Phase 1: Leverage Existing
1. Use existing UI components
2. Use existing providers
3. Use existing auth
4. Use existing settings structure
5. Use existing API client patterns

### Phase 2: Adapt Existing
1. Adapt audio.tsx for voice playback
2. Adapt citation components for voice
3. Adapt onboarding for voice tutorial
4. Adapt model selector for voice models

### Phase 3: Build New
1. Voice-specific components (VoiceRecorder, VoiceInterface, etc.)
2. Voice-specific hooks (use-voice-recording, use-webrtc, etc.)
3. Voice-specific atoms (voiceSessionAtom, etc.)
4. Voice-specific utilities (webrtc-manager, audio-utils, etc.)

---

**This inventory shows that SurfSense has a mature, well-structured frontend that provides excellent foundation for the voice assistant feature.** 🎯
