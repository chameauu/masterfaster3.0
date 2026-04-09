# Voice Assistant Implementation Roadmap

> **Complete implementation guide synthesizing TDD, architecture, and existing patterns**  
> **Project:** Voice-First Research Assistant for Visually Impaired Users  
> **Timeline:** 8 weeks  
> **Last Updated:** 2026-04-09

---


## 📋 Executive Summary

This roadmap provides a step-by-step implementation plan for building the voice assistant feature into SurfSense. It synthesizes:

- **TDD Implementation Guide** - Test-driven development approach
- **Existing Frontend Components** - Reusable SurfSense components
- **Frontend Components Spec** - New components to build
- **System Architecture** - Well-structured monolith design
- **Vercel React Best Practices** - Performance optimization

### Key Insights

**Reusability:** 60-70% of existing SurfSense components can be reused or adapted
**Architecture:** Well-structured monolith (not microservices) for 1-3 person team
**Approach:** Vertical slicing with TDD (one test → one implementation → repeat)
**Target:** <2.5s end-to-end latency, 100% screen-free operation

---

## 🎯 Project Goals

### Primary Goal
Enable visually impaired users to interact with their research documents using only voice, achieving complete independence from visual interfaces.

### Success Metrics
- End-to-end latency: <2.5 seconds
- STT accuracy: >95%
- Intent recognition: >90%
- User satisfaction: >4.5/5
- Accessibility audit: 100% pass

---

## 🏗️ Architecture Overview

### System Design

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 16)           │
│  ┌────────────────────────────────────┐ │
│  │  Voice Interface Layer (NEW)       │ │
│  │  - VoiceInterface                  │ │
│  │  - VoiceRecorder                   │ │
│  │  - AudioPlayer (adapt existing)    │ │
│  │  - ConversationHistory             │ │
│  │  - QuizInterface                   │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Existing SurfSense Components     │ │
│  │  - UI components (reuse 100%)      │ │
│  │  - Layout (reuse 100%)             │ │
│  │  - Providers (reuse 100%)          │ │
│  │  - Auth (reuse 100%)               │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  │
                  │ HTTP/WebRTC
                  ▼
┌─────────────────────────────────────────┐
│         Backend (FastAPI)               │
│  ┌────────────────────────────────────┐ │
│  │  Voice Service Layer (NEW)         │ │
│  │  - Audio transcription (Whisper)   │ │
│  │  - Intent understanding (Gemma)    │ │
│  │  - Voice tools (search, quiz)      │ │
│  │  - TTS (Piper/Kokoro)              │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Existing SurfSense Core           │ │
│  │  - Search API (reuse)              │ │
│  │  - RAG pipeline (reuse)            │ │
│  │  - Auth (reuse)                    │ │
│  │  - Database (reuse)                │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Monolith over microservices | Team size (1-3), shared infrastructure, easier debugging |
| WebRTC for Phase 3 | Lower latency, better UX (start with simple HTTP) |
| Adapt existing audio.tsx | Already has playback logic, save development time |
| Reuse all UI components | Consistent UX, faster development |
| No PyTorch for voice | Use API-based embeddings to avoid 2.5GB dependencies |

---

## 📦 What We Can Reuse

### 100% Reusable (No Changes)

**UI Components** (`components/ui/`)
- Button, Dialog, Slider, Toggle, Input, Select
- All Radix UI + shadcn/ui components
- **Action:** Import directly into voice components

**Layout** (`components/layout/`)
- Sidebar, Header, Navigation
- **Action:** Add voice route link to sidebar

**Providers** (`components/providers/`)
- PostHogProvider (analytics)
- GlobalLoadingProvider (loading states)
- I18nProvider (internationalization)
- ZeroProvider (real-time sync)
- **Action:** Voice components automatically inherit

**Auth** (`lib/auth-utils.ts`, `atoms/auth/`)
- Authentication flow
- Token management
- **Action:** Use existing auth in voice API client

**API Patterns** (`lib/apis/base-api.service.ts`)
- BaseApiService class
- Error handling
- Retry logic
- **Action:** Extend for VoiceAPI class

**Hooks** (`hooks/`)
- use-debounce
- use-media-query
- use-mobile
- use-mounted
- use-platform
- **Action:** Import and use in voice hooks

### Adaptable (Minor Changes)

**Audio Playback** (`components/tool-ui/audio.tsx`)
- Existing: Plays podcast audio with controls
- Adapt: Remove download button, add queue management
- **Action:** Create VoiceAudioPlayer extending Audio component

**Citations** (`components/tool-ui/citation/`)
- Existing: Display document citations
- Adapt: Add voice-friendly formatting
- **Action:** Use CitationDisplay in ConversationHistory

**Settings** (`components/settings/`)
- Existing: Settings page structure
- Adapt: Add voice-specific settings section
- **Action:** Create VoiceSettings following existing patterns

**Onboarding** (`components/onboarding-tour.tsx`)
- Existing: User onboarding flow
- Adapt: Create voice-specific tutorial
- **Action:** Create VoiceOnboarding following existing patterns

---

## 🚀 Implementation Phases

### Phase 1: Backend Voice Service (Week 1-2)

**Goal:** Build core voice processing pipeline

#### Week 1: Audio Processing

**Day 1-2: Audio Transcription Service**
- [ ] Write test: Transcribe clear audio
- [ ] Implement: Faster-Whisper integration
- [ ] Write test: Handle empty/corrupted audio
- [ ] Implement: Validation and error handling
- [ ] Write test: Performance <500ms
- [ ] Optimize: Model selection, GPU usage
- [ ] Refactor: Extract model loading, add logging
- **Deliverable:** `app/services/audio_transcription_service.py`

**Day 3-5: Intent Understanding Service**
- [ ] Write test: Recognize search intent
- [ ] Implement: Gemma 4 E2B integration via Ollama
- [ ] Write test: Recognize summarize/quiz/follow-up intents
- [ ] Implement: Enhanced prompt engineering
- [ ] Write test: Extract parameters correctly
- [ ] Implement: Parameter extraction logic
- [ ] Write test: Handle ambiguous input with confidence
- [ ] Implement: Confidence scoring
- [ ] Write test: Use conversation context
- [ ] Implement: Context-aware prompting
- [ ] Refactor: Extract Ollama client, prompt templates
- **Deliverable:** `app/services/intent_understanding_service.py`

#### Week 2: Tool Integration

**Day 6-8: Search Tool Handler**
- [ ] Write test: Call SurfSense search API
- [ ] Implement: Search API integration
- [ ] Write test: Format results for voice
- [ ] Implement: Natural language formatting with Gemma
- [ ] Write test: Include citations
- [ ] Implement: Citation extraction
- [ ] Write test: Handle no results
- [ ] Implement: Helpful no-results message
- [ ] Write test: Handle API errors
- [ ] Implement: Error handling with context
- [ ] Refactor: Extract API client, formatting logic
- **Deliverable:** `app/services/voice_tools/search_tool.py`

**Day 9-10: Voice Route (Simple HTTP)**
- [ ] Write test: End-to-end voice search
- [ ] Implement: FastAPI route with full pipeline
- [ ] Write test: Authentication required
- [ ] Implement: Auth dependency
- [ ] Write test: Rate limiting
- [ ] Implement: Rate limiter (slowapi)
- [ ] Refactor: Extract pipeline logic to service
- **Deliverable:** `app/routes/voice_routes.py`

**Phase 1 Checkpoint:**
- [ ] All backend tests pass
- [ ] Can transcribe audio via API
- [ ] Can search via voice
- [ ] End-to-end latency measured
- [ ] Documentation updated

---

### Phase 2: Frontend Voice Interface (Week 3-4)

**Goal:** Build user-facing voice interface

#### Week 3: Core Components

**Day 11-12: State Management**
- [ ] Create voiceSessionAtom.ts
- [ ] Create voiceConversationAtom.ts
- [ ] Create voiceSettingsAtom.ts
- [ ] Create voiceUIAtom.ts
- [ ] Create voiceQuizAtom.ts
- [ ] Write tests for each atom
- **Deliverable:** `atoms/voice/*.ts`

**Day 13-14: VoiceRecorder Component**
- [ ] Write test: Records and returns audio
- [ ] Implement: MediaRecorder integration
- [ ] Write test: Permission handling
- [ ] Implement: getUserMedia with error handling
- [ ] Write test: Visual feedback
- [ ] Implement: Recording indicator
- [ ] Refactor: Apply Vercel best practices (memo, refs)
- **Deliverable:** `components/voice/VoiceRecorder.tsx`

**Day 15-16: use-voice-recording Hook**
- [ ] Write test: Start and stop recording
- [ ] Implement: Recording state management
- [ ] Write test: Error handling
- [ ] Implement: Try-catch with error state
- [ ] Write test: Cleanup on unmount
- [ ] Implement: useEffect cleanup
- [ ] Refactor: Functional setState, stable callbacks
- **Deliverable:** `hooks/voice/use-voice-recording.ts`

**Day 17: VoiceAudioPlayer Component**
- [ ] Adapt existing audio.tsx
- [ ] Remove download button
- [ ] Add queue management
- [ ] Add auto-play support
- [ ] Write tests for new features
- **Deliverable:** `components/voice/VoiceAudioPlayer.tsx`

#### Week 4: Integration

**Day 18-19: Voice API Client**
- [ ] Write test: Send audio and return response
- [ ] Implement: Extend BaseApiService
- [ ] Write test: Authentication
- [ ] Implement: Auth header from storage
- [ ] Write test: Error handling
- [ ] Implement: APIError with details
- [ ] Write test: Retry logic
- [ ] Implement: Exponential backoff
- [ ] Refactor: Cache responses, parallel operations
- **Deliverable:** `lib/apis/voice/voice-api.ts`

**Day 20-22: VoiceInterface Component**
- [ ] Write test: End-to-end voice interaction
- [ ] Implement: Orchestrate recorder + API + player
- [ ] Write test: Loading states
- [ ] Implement: Loading spinner during processing
- [ ] Write test: Error handling
- [ ] Implement: Error display with retry
- [ ] Write test: Conversation history
- [ ] Implement: ConversationHistory component
- [ ] Refactor: Dynamic imports, memo, transitions
- **Deliverable:** `components/voice/VoiceInterface.tsx`

**Day 23-24: Supporting Components**
- [ ] ConversationHistory.tsx
- [ ] VoiceStatus.tsx
- [ ] VoiceControls.tsx
- [ ] VoiceError.tsx
- [ ] ConversationTurn.tsx
- [ ] CitationDisplay.tsx (adapt existing)
- **Deliverable:** All supporting components

**Day 25: Voice Page Route**
- [ ] Create app/dashboard/voice/page.tsx
- [ ] Create app/dashboard/voice/layout.tsx
- [ ] Add route to sidebar navigation
- [ ] Write integration tests
- **Deliverable:** `/dashboard/voice` route

**Phase 2 Checkpoint:**
- [ ] All frontend tests pass
- [ ] Can record and send audio
- [ ] Can see conversation history
- [ ] Can play responses
- [ ] UI is accessible (keyboard, screen reader)
- [ ] Performance audit passes

---

### Phase 3: WebRTC Integration (Week 5-6)

**Goal:** Reduce latency with real-time streaming

#### Week 5: WebRTC Foundation

**Day 26-28: WebRTC Manager**
- [ ] Write test: Establish peer connection
- [ ] Implement: RTCPeerConnection setup
- [ ] Write test: Exchange SDP offer/answer
- [ ] Implement: Signaling logic
- [ ] Write test: Handle ICE candidates
- [ ] Implement: ICE candidate exchange
- [ ] Write test: Send audio stream
- [ ] Implement: Audio track sending
- [ ] Write test: Receive audio stream
- [ ] Implement: Audio track receiving
- [ ] Refactor: Extract signaling, add monitoring
- **Deliverable:** `lib/voice/webrtc-manager.ts`

**Day 29-30: use-webrtc Hook**
- [ ] Write test: Connect and disconnect
- [ ] Implement: WebRTC lifecycle management
- [ ] Write test: Handle connection failures
- [ ] Implement: Error handling and reconnection
- [ ] Write test: Audio streaming
- [ ] Implement: Stream management
- **Deliverable:** `hooks/voice/use-webrtc.ts`

#### Week 6: Backend WebRTC Support

**Day 31-33: WebRTC Signaling Server**
- [ ] Implement WebSocket endpoint for signaling
- [ ] Handle SDP offer/answer exchange
- [ ] Handle ICE candidate exchange
- [ ] Add connection state management
- [ ] Write integration tests
- **Deliverable:** `app/routes/voice_webrtc_routes.py`

**Day 34-36: WebRTC Audio Processing**
- [ ] Implement real-time audio streaming
- [ ] Add voice activity detection (VAD)
- [ ] Optimize for low latency
- [ ] Write performance tests
- **Deliverable:** `app/services/webrtc_audio_service.py`

**Phase 3 Checkpoint:**
- [ ] WebRTC connection established
- [ ] Real-time audio streaming works
- [ ] Latency <1.5s (improved from 2.5s)
- [ ] Connection recovery works
- [ ] All tests pass

---

### Phase 4: Advanced Features (Week 7-8)

**Goal:** Add quiz mode and polish UX

#### Week 7: Quiz Mode

**Day 37-39: Backend Quiz Service**
- [ ] Write test: Generate quiz from content
- [ ] Implement: Question generation with Gemma
- [ ] Write test: Evaluate answers
- [ ] Implement: Answer evaluation logic
- [ ] Write test: Track quiz state
- [ ] Implement: Quiz state management
- **Deliverable:** `app/services/voice_tools/quiz_tool.py`

**Day 40-42: Frontend Quiz Interface**
- [ ] QuizInterface.tsx
- [ ] QuizQuestion.tsx
- [ ] QuizScore.tsx
- [ ] use-quiz-state.ts
- [ ] Write tests for all components
- **Deliverable:** Complete quiz feature

#### Week 8: Polish & Optimization

**Day 43-44: Settings & Onboarding**
- [ ] VoiceSettings.tsx (voice selection, speech rate, etc.)
- [ ] VoiceOnboarding.tsx (first-time tutorial)
- [ ] VoiceHelp.tsx (help overlay)
- **Deliverable:** Settings and onboarding

**Day 45-46: Accessibility & Performance**
- [ ] Run accessibility audit (WCAG 2.1 AA)
- [ ] Fix accessibility issues
- [ ] Run performance audit (Lighthouse)
- [ ] Optimize bundle size
- [ ] Add keyboard shortcuts
- [ ] Add screen reader announcements
- **Deliverable:** Accessibility report

**Day 47-48: Testing & Documentation**
- [ ] Write end-to-end tests
- [ ] Test with screen readers (NVDA, JAWS)
- [ ] Test on mobile devices
- [ ] Update user documentation
- [ ] Create video tutorial
- **Deliverable:** Complete test suite and docs

**Phase 4 Checkpoint:**
- [ ] Quiz mode works end-to-end
- [ ] Settings persist correctly
- [ ] Onboarding guides new users
- [ ] Accessibility audit passes
- [ ] Performance targets met
- [ ] All tests pass

---

## 🧪 Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │   E2E (5%)  │  Full user flows
        ├─────────────┤
        │ Integration │  Component + API
        │    (25%)    │  interactions
        ├─────────────┤
        │    Unit     │  Individual functions
        │    (70%)    │  and components
        └─────────────┘
```

### Backend Testing

**Unit Tests** (70%)
- Audio transcription service
- Intent understanding service
- Tool handlers
- Utility functions

**Integration Tests** (25%)
- Voice routes (HTTP)
- WebRTC routes
- Database interactions
- External API calls

**E2E Tests** (5%)
- Complete voice search flow
- Complete quiz flow
- Error recovery flows

### Frontend Testing

**Unit Tests** (70%)
- Hooks (use-voice-recording, use-audio-playback, etc.)
- Utility functions
- State atoms

**Integration Tests** (25%)
- VoiceRecorder + use-voice-recording
- VoiceInterface + VoiceAPI
- QuizInterface + use-quiz-state

**E2E Tests** (5%)
- Complete voice interaction
- Settings persistence
- Onboarding flow

### Testing Tools

- **Backend:** pytest, pytest-asyncio, httpx (for API testing)
- **Frontend:** Vitest, React Testing Library, MSW (for API mocking)
- **E2E:** Playwright
- **Accessibility:** axe-core, NVDA, JAWS

---

## 📊 Performance Targets

### Latency Breakdown

| Phase | Target | Measurement |
|-------|--------|-------------|
| Audio capture | <100ms | MediaRecorder start to stop |
| Upload | <200ms | Network transfer |
| Transcription | <500ms | Whisper processing |
| Intent understanding | <300ms | Gemma inference |
| Search | <500ms | SurfSense API |
| Response generation | <400ms | Gemma formatting |
| TTS | <300ms | Piper/Kokoro |
| Download | <200ms | Network transfer |
| **Total (HTTP)** | **<2.5s** | End-to-end |
| **Total (WebRTC)** | **<1.5s** | End-to-end |

### Bundle Size Targets

| Asset | Target | Strategy |
|-------|--------|----------|
| Initial JS | <200KB | Code splitting, tree shaking |
| Voice route JS | <300KB | Dynamic imports |
| Total (gzipped) | <500KB | Lazy loading |

### Optimization Strategies

**Backend:**
- Cache Whisper model in memory
- Cache Gemma model in memory
- Use connection pooling for database
- Enable HTTP/2 for faster transfers

**Frontend:**
- Use next/dynamic for heavy components
- Memo expensive renders
- Use refs for transient values
- Defer third-party scripts
- Optimize images with next/image

---

## 🔒 Security Considerations

### Authentication
- [ ] All voice endpoints require authentication
- [ ] JWT tokens validated on every request
- [ ] Tokens refreshed automatically

### Rate Limiting
- [ ] 5 requests/minute per user (voice search)
- [ ] 10 requests/minute per user (quiz)
- [ ] 429 Too Many Requests on limit exceeded

### Data Privacy
- [ ] Audio files not stored permanently
- [ ] Transcripts stored with user consent
- [ ] PII redacted from logs
- [ ] GDPR compliance for EU users

### Input Validation
- [ ] Audio file size limit: 10MB
- [ ] Audio duration limit: 30 seconds
- [ ] Text input sanitization
- [ ] SQL injection prevention

---

## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance

**Perceivable:**
- [ ] All audio has text alternatives
- [ ] Visual indicators have audio equivalents
- [ ] Color not sole means of conveying information
- [ ] Text contrast ratio ≥4.5:1

**Operable:**
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Touch targets ≥44x44px
- [ ] Timing adjustable (recording duration)

**Understandable:**
- [ ] Clear error messages
- [ ] Consistent navigation
- [ ] Help available at all times
- [ ] Predictable behavior

**Robust:**
- [ ] Valid HTML
- [ ] ARIA labels on all interactive elements
- [ ] Screen reader tested (NVDA, JAWS)
- [ ] Works with browser zoom up to 200%

### Voice-Specific Accessibility

- [ ] Audio feedback for all actions
- [ ] Confirmation sounds (optional)
- [ ] Voice-guided onboarding
- [ ] Adjustable speech rate
- [ ] Adjustable volume
- [ ] Pause/resume at any time

---

## 📚 Documentation Deliverables

### User Documentation
- [ ] Getting started guide
- [ ] Voice commands reference
- [ ] Troubleshooting guide
- [ ] FAQ
- [ ] Video tutorial

### Developer Documentation
- [ ] Architecture overview
- [ ] API reference
- [ ] Component documentation
- [ ] Testing guide
- [ ] Deployment guide

### Accessibility Documentation
- [ ] Accessibility features
- [ ] Screen reader guide
- [ ] Keyboard shortcuts
- [ ] Assistive technology compatibility

---

## 🚦 Quality Gates

### Before Moving to Next Phase

**Phase 1 → Phase 2:**
- [ ] All backend tests pass (>80% coverage)
- [ ] Can transcribe audio via API
- [ ] Can search via voice
- [ ] Latency measured and documented
- [ ] Code reviewed

**Phase 2 → Phase 3:**
- [ ] All frontend tests pass (>70% coverage)
- [ ] Can record and send audio
- [ ] Can see conversation history
- [ ] Can play responses
- [ ] Accessibility audit passes
- [ ] Code reviewed

**Phase 3 → Phase 4:**
- [ ] WebRTC connection works
- [ ] Real-time streaming works
- [ ] Latency improved
- [ ] Connection recovery works
- [ ] All tests pass
- [ ] Code reviewed

**Phase 4 → Production:**
- [ ] Quiz mode works
- [ ] Settings persist
- [ ] Onboarding complete
- [ ] All tests pass (>80% backend, >70% frontend)
- [ ] Accessibility audit passes
- [ ] Performance audit passes
- [ ] Security audit passes
- [ ] Documentation complete
- [ ] User testing complete

---

## 🛠️ Development Environment Setup

### Prerequisites

**Backend:**
```bash
cd backend
uv sync  # Install all dependencies
uv run pytest  # Run tests
uv run uvicorn app.main:app --reload  # Start server
```

**Frontend:**
```bash
cd frontend
npm install  # Install dependencies
npm run test  # Run tests
npm run dev  # Start dev server
```

### Environment Variables

**Backend (.env):**
```
OLLAMA_BASE_URL=http://localhost:11434
WHISPER_MODEL=base
TTS_ENGINE=piper
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_FASTAPI_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_ENABLE_VOICE=true
```

---

## 📈 Success Metrics

### Technical Metrics
- [ ] End-to-end latency <2.5s (HTTP) or <1.5s (WebRTC)
- [ ] STT accuracy >95%
- [ ] Intent recognition >90%
- [ ] Test coverage >80% (backend), >70% (frontend)
- [ ] Bundle size <500KB
- [ ] Accessibility audit 100% pass

### User Metrics
- [ ] User satisfaction >4.5/5
- [ ] Task completion rate >90%
- [ ] Error rate <5%
- [ ] Daily active users (target: 50 in first month)
- [ ] Average session duration >5 minutes

### Business Metrics
- [ ] Feature adoption rate >30% of active users
- [ ] User retention >80% (week 1 to week 4)
- [ ] Support tickets <10/week
- [ ] Positive feedback >80%

---

## 🎯 Next Steps

1. **Review this roadmap** with team
2. **Set up development environment** (see above)
3. **Start Phase 1, Day 1** (Audio Transcription Service)
4. **Follow TDD workflow** for each feature
5. **Review progress** at end of each week
6. **Adjust timeline** as needed

---

## 📞 Support & Resources

### Documentation
- [TDD Implementation Guide](./tdd/TDD_IMPLEMENTATION_GUIDE.md)
- [Frontend Components Spec](./frontend/FRONTEND_COMPONENTS_SPEC.md)
- [Existing Frontend Components](./EXISTING_FRONTEND_COMPONENTS.md)
- [Voice Assistant Architecture](./how%20it%20works/VOICE_ASSISTANT_ARCHITECTURE.md)

### Skills
- [TDD Skill](./.kiro/skills/tdd/SKILL.md)
- [System Architecture Skill](./.kiro/skills/system-architecture/SKILL.md)
- [Vercel React Best Practices](./.kiro/skills/vercel-react-best-practices/SKILL.md)

### External Resources
- [Faster-Whisper Docs](https://github.com/guillaumekln/faster-whisper)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Piper TTS Docs](https://github.com/rhasspy/piper)
- [WebRTC API Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

**Remember:** We're building independence for visually impaired users. Every detail matters. Build it right. 🚀

