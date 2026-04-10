# Voice Assistant Frontend Integration Guide

## Overview

This document describes the existing VocalAIze web frontend and what needs to be added to integrate the voice assistant feature.

---

## Existing Frontend Architecture

### Tech Stack

**Framework & Core:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Server-side rendering + Client components

**Styling:**
- Tailwind CSS 4
- Radix UI primitives
- shadcn/ui components
- Custom design system

**State Management:**
- Jotai (atomic state)
- Zustand (global stores)
- TanStack Query (server state)
- @rocicorp/zero (real-time sync)

**UI Libraries:**
- @assistant-ui/react (AI chat interface)
- Plate.js (rich text editor)
- Radix UI (accessible components)
- Lucide React (icons)
- Motion (animations)

**Data & APIs:**
- Drizzle ORM (database)
- TanStack Query (data fetching)
- Real-time sync with backend
- WebSocket support (via zero)

**Internationalization:**
- next-intl
- Supported languages: English, Spanish, Hindi, Portuguese, Chinese

**Analytics & Monitoring:**
- PostHog (analytics)
- Error tracking
- User behavior tracking

---

## Current Application Structure

### App Routes

```
app/
├── (home)/              # Landing page
│   ├── page.tsx         # Homepage
│   └── layout.tsx       # Home layout
│
├── auth/                # Authentication
│   ├── login/           # Login page
│   ├── register/        # Registration
│   └── reset-password/  # Password reset
│
├── dashboard/           # Main application
│   ├── page.tsx         # Dashboard home
│   ├── chat/            # Chat interface
│   ├── documents/       # Document management
│   ├── connectors/      # Data source connectors
│   ├── settings/        # User settings
│   └── layout.tsx       # Dashboard layout
│
├── docs/                # Documentation (Fumadocs)
│   └── [[...slug]]/     # Dynamic docs pages
│
├── public/              # Public chat snapshots
│   └── [id]/            # Shared chat view
│
└── api/                 # API routes
    └── auth/            # Auth endpoints
```

---

### Component Organization

```
components/
├── auth/                # Authentication components
│   ├── LoginForm
│   ├── RegisterForm
│   └── OAuthButtons
│
├── new-chat/            # Chat interface
│   ├── ChatInterface
│   ├── MessageList
│   ├── MessageInput
│   ├── StreamingMessage
│   └── ToolCallDisplay
│
├── documents/           # Document management
│   ├── DocumentList
│   ├── DocumentViewer
│   ├── DocumentUpload
│   └── DocumentSearch
│
├── connectors/          # Data source connectors
│   ├── ConnectorCard
│   ├── ConnectorDialog
│   ├── OAuthFlow
│   └── SyncStatus
│
├── editor/              # Rich text editor
│   ├── PlateEditor
│   ├── Toolbar
│   └── Plugins
│
├── settings/            # Settings pages
│   ├── ProfileSettings
│   ├── LLMConfig
│   ├── APIKeys
│   └── Permissions
│
├── layout/              # Layout components
│   ├── Sidebar
│   ├── Header
│   ├── Navigation
│   └── MobileMenu
│
└── ui/                  # Reusable UI components
    ├── Button
    ├── Dialog
    ├── Input
    ├── Select
    └── ... (50+ components)
```

---

### State Management Structure

**Jotai Atoms** (`atoms/`)
- `auth/` - Authentication state
- `chat/` - Chat session state
- `documents/` - Document state
- `connectors/` - Connector state
- `settings/` - User preferences
- `layout/` - UI layout state

**Key Features:**
- Atomic state updates
- Derived atoms for computed values
- Persistence to localStorage
- Real-time sync with backend

---

### API Integration

**API Client** (`lib/apis/`)
- Centralized API client
- Automatic token refresh
- Error handling
- Request/response interceptors
- Type-safe endpoints

**Existing API Endpoints Used:**
- `/api/auth/*` - Authentication
- `/api/chat/*` - Chat operations
- `/api/documents/*` - Document management
- `/api/search/*` - Search functionality
- `/api/connectors/*` - Data source management
- `/api/users/*` - User management

---

### Real-time Features

**Current Real-time Capabilities:**
- Chat message streaming (Server-Sent Events)
- Document sync (@rocicorp/zero)
- Connector status updates
- Notification system
- Collaborative editing (ready)

**Technologies:**
- Server-Sent Events (SSE) for streaming
- @rocicorp/zero for real-time sync
- WebSocket support available
- Optimistic updates

---

## What We Need to Add for Voice Assistant

### 1. New App Route

**Location:** `app/dashboard/voice/`

**Purpose:** Dedicated page for voice assistant interface

**Structure:**
```
app/dashboard/voice/
├── page.tsx             # Main voice interface page
├── layout.tsx           # Voice-specific layout (optional)
└── loading.tsx          # Loading state
```

**Features:**
- Full-screen voice interface
- Minimal UI (accessibility-first)
- Large, clear controls
- High contrast mode
- Screen reader optimized

---

### 2. New Components

#### Voice Interface Components (`components/voice/`)

**VoiceInterface**
- Main container for voice assistant
- Manages WebRTC connection
- Handles audio streaming
- Displays conversation state

**VoiceRecorder**
- Microphone access
- Audio capture
- Voice activity detection visualization
- Recording state indicator
- Permission handling

**AudioPlayer**
- Plays assistant responses
- Progress indicator
- Volume control
- Playback speed control
- Pause/resume functionality

**ConversationHistory**
- Display past turns
- User input + assistant response
- Timestamps
- Citations/sources
- Scrollable list

**VoiceSettings**
- Voice selection (TTS voice)
- Speech speed
- Volume
- Language preference
- Microphone selection
- Audio output selection

**VoiceVisualizer**
- Audio waveform visualization
- Speaking indicator
- Listening indicator
- Processing indicator

**QuizInterface**
- Quiz mode UI
- Question display
- Score tracking
- Progress indicator
- Answer feedback

---

### 3. New Hooks

#### Custom Hooks (`hooks/`)

**useVoiceRecording**
- Manage microphone access
- Start/stop recording
- Audio chunk handling
- Error handling

**useWebRTC**
- Establish WebRTC connection
- Handle signaling
- Manage connection state
- Reconnection logic

**useVoiceConversation**
- Manage conversation state
- Add turns to history
- Track context
- Handle follow-ups

**useAudioPlayback**
- Play audio responses
- Queue management
- Interruption handling
- Playback controls

**useVoiceActivityDetection**
- Detect speech start/end
- Silence detection
- Noise filtering
- Sensitivity adjustment

**useQuizState**
- Manage quiz session
- Track questions
- Calculate score
- Handle answers

---

### 4. New State Atoms

#### Jotai Atoms (`atoms/voice/`)

**voiceSessionAtom**
- Session ID
- Connection status
- User ID
- Start time

**voiceConversationAtom**
- Conversation history
- Current turn
- Context data
- Active document

**voiceSettingsAtom**
- Selected voice
- Speech speed
- Volume level
- Language
- Microphone device
- Speaker device

**voiceQuizAtom**
- Quiz questions
- Current question index
- User answers
- Score
- Quiz state (active/completed)

**voiceUIAtom**
- Recording state
- Playing state
- Processing state
- Error messages
- UI mode (search/quiz/summarize)

---

### 5. New API Client

#### Voice API Client (`lib/apis/voice-api.ts`)

**Purpose:** Interface with voice assistant backend

**Functions:**

**Connection Management:**
- `initializeVoiceSession()` - Start voice session
- `closeVoiceSession()` - End voice session
- `getSessionStatus()` - Check session health

**Audio Streaming:**
- `streamAudio()` - Send audio to backend
- `receiveAudio()` - Receive audio from backend
- `handleWebRTCSignaling()` - WebRTC setup

**Conversation:**
- `sendTranscript()` - Send text (fallback)
- `getConversationHistory()` - Fetch history
- `clearConversation()` - Reset session

**Quiz:**
- `startQuiz()` - Initialize quiz
- `submitAnswer()` - Send answer
- `getQuizResults()` - Fetch results

---

### 6. WebRTC Integration

#### WebRTC Manager (`lib/voice/webrtc-manager.ts`)

**Purpose:** Handle WebRTC connections

**Responsibilities:**
- Peer connection setup
- ICE candidate handling
- Media stream management
- Connection state monitoring
- Error recovery

**Features:**
- Automatic reconnection
- Network quality detection
- Bandwidth adaptation
- Echo cancellation
- Noise suppression

---

### 7. Audio Utilities

#### Audio Utilities (`lib/voice/audio-utils.ts`)

**Purpose:** Audio processing helpers

**Functions:**

**Recording:**
- `requestMicrophoneAccess()` - Get permissions
- `startRecording()` - Begin capture
- `stopRecording()` - End capture
- `getAudioDevices()` - List devices

**Playback:**
- `playAudio()` - Play audio buffer
- `pauseAudio()` - Pause playback
- `resumeAudio()` - Resume playback
- `stopAudio()` - Stop playback

**Processing:**
- `convertAudioFormat()` - Format conversion
- `normalizeVolume()` - Volume adjustment
- `detectSilence()` - Silence detection
- `calculateWaveform()` - Visualization data

---

### 8. UI Enhancements

#### Accessibility Features

**Screen Reader Support:**
- ARIA labels for all controls
- Live regions for status updates
- Keyboard navigation
- Focus management

**Visual Accessibility:**
- High contrast mode
- Large touch targets (min 44x44px)
- Clear visual feedback
- Status indicators

**Audio Accessibility:**
- Visual indicators for audio state
- Captions/transcripts (optional)
- Volume controls
- Playback speed control

---

### 9. Settings Integration

#### Voice Settings Page (`app/dashboard/settings/voice/`)

**Purpose:** Configure voice assistant preferences

**Settings:**

**Voice Output:**
- TTS voice selection
- Speech speed (0.5x - 2x)
- Volume level
- Pitch adjustment

**Voice Input:**
- Microphone selection
- Input sensitivity
- Noise cancellation
- Echo cancellation

**Behavior:**
- Auto-start listening
- Confirmation sounds
- Response length preference
- Citation verbosity

**Privacy:**
- Audio storage preference
- Conversation history retention
- Data sharing settings

---

### 10. Navigation Updates

#### Sidebar Navigation

**Add Voice Assistant Link:**
- Icon: Microphone
- Label: "Voice Assistant"
- Route: `/dashboard/voice`
- Keyboard shortcut: `Ctrl/Cmd + Shift + V`

**Mobile Navigation:**
- Bottom tab bar item
- Quick access button
- Floating action button (optional)

---

### 11. Onboarding Flow

#### First-time Voice Setup

**Steps:**

1. **Welcome Screen**
   - Explain voice assistant features
   - Benefits for accessibility
   - Privacy information

2. **Permissions**
   - Request microphone access
   - Explain why it's needed
   - Fallback if denied

3. **Voice Selection**
   - Preview available voices
   - Choose preferred voice
   - Test with sample phrase

4. **Quick Tutorial**
   - Show how to start conversation
   - Example commands
   - How to interrupt
   - How to end session

5. **First Interaction**
   - Guided first query
   - Positive feedback
   - Encourage exploration

---

### 12. Integration with Existing Features

#### Document Viewer Integration

**When voice assistant cites a source:**
- Show document preview
- Highlight relevant section
- Click to open full document
- Navigate to specific page

#### Search Integration

**Voice search results:**
- Display in existing search UI
- Show relevance scores
- Enable refinement
- Save search history

#### Chat Integration

**Convert voice to text chat:**
- Option to switch to text
- Save voice conversation as chat
- Share voice conversation
- Export transcript

---

## Implementation Phases

### Phase 1: Basic Voice Interface (Week 1-2)

**Add:**
- Voice route (`app/dashboard/voice/`)
- Basic VoiceInterface component
- VoiceRecorder component
- AudioPlayer component
- Simple conversation display

**Integrate:**
- Authentication (reuse existing)
- Layout (reuse sidebar/header)
- API client (extend existing)

**Test:**
- Microphone access
- Audio recording
- Audio playback
- Basic conversation flow

---

### Phase 2: WebRTC & Real-time (Week 3-4)

**Add:**
- WebRTC integration
- Real-time audio streaming
- Voice activity detection
- Connection management

**Integrate:**
- Real-time sync (extend @rocicorp/zero)
- Error handling (reuse existing patterns)
- Loading states (reuse existing components)

**Test:**
- WebRTC connection
- Audio streaming quality
- Latency measurements
- Reconnection handling

---

### Phase 3: Advanced Features (Week 5-6)

**Add:**
- Quiz interface
- Conversation history
- Voice settings page
- Audio visualization

**Integrate:**
- Settings system (extend existing)
- Document viewer (for citations)
- Search UI (for results)

**Test:**
- Quiz flow
- Settings persistence
- Document integration
- Search integration

---

### Phase 4: Polish & Accessibility (Week 7-8)

**Add:**
- Onboarding flow
- Keyboard shortcuts
- Screen reader support
- High contrast mode

**Integrate:**
- Navigation (add to sidebar)
- Mobile responsive design
- Theme system (dark/light mode)
- Internationalization

**Test:**
- Accessibility audit
- Screen reader testing
- Keyboard navigation
- Mobile testing

---

## Design Considerations

### Visual Design

**Voice Interface Layout:**
```
┌─────────────────────────────────────────┐
│  Header (minimal)                       │
├─────────────────────────────────────────┤
│                                         │
│         [Large Microphone Icon]         │
│                                         │
│         "Listening..." / "Ready"        │
│                                         │
│         [Audio Waveform]                │
│                                         │
├─────────────────────────────────────────┤
│  Conversation History (scrollable)      │
│  ┌───────────────────────────────────┐ │
│  │ You: "Search my notes..."         │ │
│  │ Assistant: "I found 3 notes..."   │ │
│  └───────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  Controls (bottom)                      │
│  [Settings] [Stop] [Help]               │
└─────────────────────────────────────────┘
```

**Color Scheme:**
- Use existing VocalAIze theme
- High contrast for accessibility
- Clear state indicators (green=listening, blue=processing, red=error)
- Smooth animations for state transitions

**Typography:**
- Large, readable fonts
- Clear hierarchy
- Sufficient line spacing
- Support for dyslexia-friendly fonts

---

### Responsive Design

**Desktop (>1024px):**
- Full-screen voice interface
- Sidebar visible
- Conversation history on side
- Large controls

**Tablet (768px - 1024px):**
- Collapsible sidebar
- Centered voice interface
- Conversation history below
- Medium controls

**Mobile (<768px):**
- Full-screen voice interface
- Hidden sidebar (hamburger menu)
- Conversation history as drawer
- Large touch targets

---

### Performance Considerations

**Optimization Strategies:**

**Audio Processing:**
- Use Web Audio API efficiently
- Minimize audio buffer size
- Optimize format conversions
- Cache audio chunks

**WebRTC:**
- Adaptive bitrate
- Connection pooling
- Efficient signaling
- Bandwidth monitoring

**UI Rendering:**
- Virtualized conversation list
- Lazy load components
- Debounce audio visualization
- Optimize re-renders

**State Management:**
- Minimize atom updates
- Use derived atoms
- Batch state changes
- Memoize selectors

---

## Testing Strategy

### Unit Tests

**Components:**
- VoiceRecorder
- AudioPlayer
- ConversationHistory
- VoiceSettings

**Hooks:**
- useVoiceRecording
- useWebRTC
- useVoiceConversation
- useAudioPlayback

**Utilities:**
- Audio processing functions
- WebRTC helpers
- API client methods

---

### Integration Tests

**Flows:**
- Complete voice search
- Multi-turn conversation
- Quiz session
- Settings changes

**Integrations:**
- Backend API
- WebRTC connection
- Document viewer
- Search results

---

### E2E Tests

**User Journeys:**
- First-time user onboarding
- Voice search workflow
- Quiz completion
- Settings configuration

**Accessibility:**
- Screen reader navigation
- Keyboard-only usage
- High contrast mode
- Mobile touch interactions

---

## Security Considerations

### Audio Data

**Privacy:**
- Audio never stored permanently
- Processed in memory only
- Encrypted in transit (TLS/DTLS)
- User consent required

**Permissions:**
- Request microphone access
- Explain data usage
- Allow revocation
- Respect browser permissions

### WebRTC Security

**Connection:**
- Secure signaling (WSS)
- DTLS encryption
- SRTP for media
- Certificate validation

**Authentication:**
- Reuse existing JWT tokens
- Session validation
- Rate limiting
- CORS configuration

---

## Monitoring & Analytics

### Metrics to Track

**Usage:**
- Voice sessions started
- Average session duration
- Commands per session
- Feature usage (search/quiz/summarize)

**Performance:**
- Audio latency
- WebRTC connection quality
- Error rates
- User satisfaction

**Accessibility:**
- Screen reader usage
- Keyboard navigation usage
- High contrast mode usage
- Mobile vs desktop usage

---

## Documentation Needs

### User Documentation

**Getting Started:**
- How to access voice assistant
- First-time setup
- Basic commands
- Troubleshooting

**Features:**
- Voice search
- Document summarization
- Quiz mode
- Settings

**Accessibility:**
- Screen reader guide
- Keyboard shortcuts
- Mobile usage
- Privacy settings

### Developer Documentation

**Architecture:**
- Component structure
- State management
- API integration
- WebRTC setup

**Contributing:**
- Code style guide
- Testing requirements
- PR process
- Accessibility guidelines

---

## Summary

### What Exists (Can Reuse)

✅ **Infrastructure:**
- Next.js app structure
- Authentication system
- API client
- State management
- UI component library
- Real-time sync
- Internationalization

✅ **Components:**
- Layout (sidebar, header)
- Auth forms
- Document viewer
- Settings pages
- Chat interface (can adapt)

✅ **Utilities:**
- API helpers
- Error handling
- Loading states
- Theme system

---

### What We Need to Add

🆕 **New Route:**
- `/dashboard/voice` page

🆕 **New Components:**
- VoiceInterface
- VoiceRecorder
- AudioPlayer
- ConversationHistory
- VoiceSettings
- VoiceVisualizer
- QuizInterface

🆕 **New Hooks:**
- useVoiceRecording
- useWebRTC
- useVoiceConversation
- useAudioPlayback
- useVoiceActivityDetection
- useQuizState

🆕 **New State:**
- Voice session atoms
- Conversation atoms
- Voice settings atoms
- Quiz state atoms

🆕 **New Integrations:**
- WebRTC connection
- Audio streaming
- Voice API client
- Audio utilities

🆕 **New Features:**
- Onboarding flow
- Voice settings page
- Navigation updates
- Accessibility enhancements

---

## Next Steps

1. **Set up voice route** - Create basic page structure
2. **Add voice components** - Build core UI components
3. **Integrate WebRTC** - Establish audio streaming
4. **Connect to backend** - Wire up voice API
5. **Add quiz mode** - Implement interactive features
6. **Polish UI** - Accessibility and responsive design
7. **Test thoroughly** - Unit, integration, E2E tests
8. **Document** - User and developer guides

The existing VocalAIze frontend provides a solid foundation. We're adding a new feature (voice assistant) that integrates cleanly with the existing architecture while maintaining consistency in design, state management, and user experience.
