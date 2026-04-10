# Pipecat Migration Plan - Step-by-Step Approach

**Date:** 2026-04-10  
**Goal:** Migrate from Web APIs to Pipecat for better audio quality  
**Approach:** TDD with vertical slicing, following .kiro skills  
**Timeline:** 2-3 weeks

---

## 📋 Prerequisites - Skills Loaded

Following these .kiro skills:
- ✅ **TDD** - Vertical slicing (tracer bullets), one test → one implementation
- ✅ **Python Patterns** - FastAPI async, type hints, project structure
- ✅ **System Architecture** - Well-structured monolith, clear boundaries
- ✅ **React Best Practices** - Bundle optimization, re-render optimization

---

## 🎯 Migration Goals

### What We're Improving

**Current (Web APIs):**
- ❌ Variable audio quality (browser-dependent)
- ❌ Basic VAD (threshold-based)
- ❌ No noise cancellation
- ❌ No echo removal
- ❌ Limited codec options

**Target (Pipecat):**
- ✅ Professional audio quality (Silero VAD)
- ✅ Advanced VAD (ML-based)
- ✅ Noise cancellation
- ✅ Echo removal
- ✅ Multiple codec support (Opus, etc.)
- ✅ Production-grade WebRTC

---

## 🏗️ Architecture Decision (System Architecture Skill)

### Step 1: Clarify Constraints

**Scale:**
- Current: 1-10 concurrent users (development)
- Expected: 100+ concurrent users (production)
- Data: Real-time audio streaming (no storage)

**Team:**
- Size: 1-3 developers
- Structure: Single team
- Expertise: Python, FastAPI, React

**Lifespan:**
- Long-term product (not prototype)
- Production deployment planned
- Accessibility-critical feature

**Change Vectors:**
- Audio quality requirements (high)
- TTS provider (may change)
- STT provider (stable - Faster-Whisper)

### Step 2: Identify Domains

**Domains:**
1. **Voice Service** (NEW) - Pipecat audio streaming
2. **Chat Service** (EXISTING) - Message handling, AI responses
3. **Transcription Service** (EXISTING) - Faster-Whisper STT
4. **TTS Service** (NEW) - High-quality text-to-speech

**Boundaries:**
- Voice Service ↔ Chat Service: Different change rate (voice tech vs chat logic)
- Voice Service ↔ Transcription: Different responsibility (streaming vs processing)

### Step 3: Map Data Flow

```
User Browser (WebRTC)
    ↓
Pipecat Voice Service (NEW)
    ├─ Audio In → VAD → Buffer
    ├─ Send to Transcription Service
    ├─ Receive transcript → Send to Chat
    ├─ Receive response → TTS
    └─ Audio Out → User
```

### Step 4: Draw Boundaries with Rationale

| Boundary | Reason | Change Rate |
|----------|--------|-------------|
| Voice Service ↔ Chat | Different tech (WebRTC vs HTTP) | Voice: high, Chat: stable |
| Voice ↔ Transcription | Separate concern (streaming vs processing) | Both: medium |
| Voice ↔ TTS | May swap TTS provider | Voice: stable, TTS: high |

### Step 5: Complexity Checklist

- [x] **Tried simple solution?** Yes (Web APIs) - quality insufficient
- [x] **Have evidence?** Yes (user feedback: "quality is bad")
- [x] **Can team operate?** Yes (Python/FastAPI expertise)
- [x] **Makes sense in 6 months?** Yes (production requirement)
- [x] **Can explain necessity?** Yes (accessibility requires quality)

**Verdict:** Complexity justified ✅

### Step 6: Architecture

**Chosen: Well-Structured Monolith with Voice Service Layer**

```
┌─────────────────────────────────────────────────────────┐
│              SurfSense Monolith (FastAPI)               │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Voice Service Layer (NEW - Pipecat)           │   │
│  │  - WebRTC transport                            │   │
│  │  - Silero VAD                                  │   │
│  │  - Audio pipeline                              │   │
│  │  - Session management                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Existing Services (REUSE)                     │   │
│  │  - Transcription (Faster-Whisper)              │   │
│  │  - Chat (existing agent)                       │   │
│  │  - TTS (upgrade to Piper)                      │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Trade-offs:**
- Chose monolith over microservices (team size: 1-3)
- Accepted single deployment unit to gain simplicity
- Chose Pipecat over custom WebRTC (proven, maintained)

---

## 📦 Phase 1: Backend - Pipecat Integration (Week 1)

### Planning (TDD Step 1)

**Confirm with user:**
- [ ] Interface: WebRTC endpoint for audio streaming
- [ ] Behaviors to test:
  1. WebRTC connection establishment
  2. Audio streaming (bidirectional)
  3. VAD detection (speech start/stop)
  4. Integration with transcription service
  5. Integration with TTS service

**Priority:** Focus on critical path (connection → audio → transcription)

---

### Day 1-2: Pipecat Setup & Dependencies

**Task 1.1: Add Pipecat to Dependencies**

**Steps:**
1. Research Pipecat version (check PyPI for latest stable)
2. Add to `pyproject.toml` or `requirements.txt`
3. Install dependencies: `uv pip install pipecat-ai`
4. Verify installation: `uv run python -c "import pipecat"`

**Dependencies to add:**
- `pipecat-ai` - Main framework
- `aiortc` - WebRTC implementation (if not included)
- `silero-vad` - Voice Activity Detection
- `piper-tts` - High-quality TTS (upgrade from Web Speech API)

**Python Patterns Decision:**
- Use FastAPI (already in use)
- Use async (I/O-bound: WebRTC streaming)
- Type hints for all public APIs

---

**Task 1.2: Project Structure**

**Create new structure:**
```
backend/app/services/voice/
├── __init__.py
├── transcription.py          # EXISTING (keep)
├── intent.py                 # EXISTING (keep)
├── pipecat_service.py        # NEW - Pipecat integration
├── vad_processor.py          # NEW - VAD logic
├── audio_pipeline.py         # NEW - Audio processing
└── tools/
    └── search.py             # EXISTING (keep)

backend/app/routes/
├── voice_routes.py           # EXISTING (modify)
└── pipecat_routes.py         # NEW - WebRTC endpoints

backend/tests/unit/voice/
├── test_transcription.py     # EXISTING (keep)
├── test_pipecat_service.py   # NEW
├── test_vad_processor.py     # NEW
└── test_audio_pipeline.py    # NEW
```

---

### Day 3-4: Tracer Bullet - WebRTC Connection (TDD Step 2)

**Test 1: WebRTC Connection Establishment**

**RED Phase:**
1. Write test: `test_webrtc_connection_establishes`
2. Test should verify:
   - Pipecat service initializes
   - WebRTC transport created
   - Connection accepts client
3. Run test → FAILS (no implementation)

**GREEN Phase:**
1. Create `PipecatService` class
2. Initialize Pipecat pipeline
3. Create WebRTC transport
4. Implement connection handler
5. Run test → PASSES

**Minimal implementation:**
- Just connection, no audio processing yet
- No VAD yet
- No transcription integration yet

**Refactor:**
- Extract configuration to settings
- Add type hints
- Add docstrings

---

**Test 2: Audio Streaming (Bidirectional)**

**RED Phase:**
1. Write test: `test_audio_streaming_bidirectional`
2. Test should verify:
   - Receive audio from client
   - Send audio to client
   - Audio format correct (16kHz, 16-bit, mono)
3. Run test → FAILS

**GREEN Phase:**
1. Add audio input handler
2. Add audio output handler
3. Implement audio format conversion
4. Run test → PASSES

**Refactor:**
- Extract audio processing to separate module
- Add error handling
- Add logging

---

### Day 5-6: VAD Integration (TDD Step 3)

**Test 3: VAD Detection**

**RED Phase:**
1. Write test: `test_vad_detects_speech_start_stop`
2. Test should verify:
   - Silero VAD initializes
   - Detects speech start
   - Detects speech end
   - Triggers callbacks
3. Run test → FAILS

**GREEN Phase:**
1. Create `VADProcessor` class
2. Initialize Silero VAD
3. Process audio chunks
4. Detect speech start/end
5. Trigger callbacks
6. Run test → PASSES

**Refactor:**
- Extract VAD configuration
- Add sensitivity settings
- Optimize performance

---

### Day 7-8: Transcription Integration (TDD Step 3 continued)

**Test 4: Transcription Integration**

**RED Phase:**
1. Write test: `test_transcription_integration`
2. Test should verify:
   - Audio sent to transcription service
   - Transcript received
   - Transcript sent to chat
3. Run test → FAILS

**GREEN Phase:**
1. Connect VAD to transcription service
2. Buffer audio during speech
3. Send to Faster-Whisper when speech ends
4. Receive transcript
5. Forward to chat service
6. Run test → PASSES

**Refactor:**
- Extract transcription client
- Add retry logic
- Add timeout handling

---

### Day 9-10: TTS Integration (Piper)

**Test 5: TTS Integration**

**RED Phase:**
1. Write test: `test_tts_integration_piper`
2. Test should verify:
   - Piper TTS initializes
   - Text converted to audio
   - Audio streamed to client
3. Run test → FAILS

**GREEN Phase:**
1. Install Piper TTS
2. Create `PiperTTSService` class
3. Initialize Piper with voice model
4. Convert text to audio
5. Stream to WebRTC output
6. Run test → PASSES

**Refactor:**
- Extract TTS configuration
- Add voice selection
- Add streaming optimization

---

## 📦 Phase 2: Frontend - WebRTC Client (Week 2)

### Planning

**Confirm with user:**
- [ ] Interface: WebRTC client component
- [ ] Behaviors to test:
  1. WebRTC connection from browser
  2. Audio capture and streaming
  3. Audio playback from server
  4. Connection state management
  5. Error handling

---

### Day 11-12: WebRTC Client Setup

**Task 2.1: Add WebRTC Dependencies**

**Steps:**
1. Research WebRTC libraries (simple-peer, peerjs, or native)
2. Add to `package.json`
3. Install: `pnpm add simple-peer`
4. Verify: Import in test file

**React Best Practices:**
- Use `bundle-dynamic-imports` - Load WebRTC library dynamically
- Use `bundle-conditional` - Only load when voice enabled

---

**Task 2.2: Create WebRTC Hook**

**Create:**
```
frontend/hooks/
├── use-webrtc-connection.ts   # NEW - WebRTC connection
├── use-pipecat-audio.ts       # NEW - Audio streaming
└── use-voice-session.ts       # NEW - Session management
```

**Following React Best Practices:**
- `rerender-use-ref-transient-values` - Store WebRTC connection in ref
- `rerender-functional-setstate` - Stable callbacks
- `rerender-memo` - Memoize expensive operations

---

### Day 13-14: WebRTC Connection Hook

**Implementation Steps:**

1. **Create `use-webrtc-connection.ts`**
   - Initialize WebRTC peer connection
   - Handle signaling (offer/answer)
   - Manage connection state
   - Handle reconnection

2. **State Management:**
   - Connection status (connecting, connected, disconnected)
   - Error state
   - Reconnection attempts

3. **Error Handling:**
   - Connection failures
   - Network issues
   - Timeout handling

---

### Day 15-16: Audio Streaming Hook

**Implementation Steps:**

1. **Create `use-pipecat-audio.ts`**
   - Capture microphone audio
   - Send to WebRTC connection
   - Receive audio from server
   - Play audio output

2. **Audio Processing:**
   - Get user media (microphone)
   - Create audio tracks
   - Add to WebRTC connection
   - Handle remote audio tracks

3. **Optimization:**
   - Use `rerender-use-ref-transient-values` for audio context
   - Cleanup on unmount
   - Handle permission errors

---

### Day 17-18: UI Integration

**Task 2.3: Update VoiceToggle Component**

**Steps:**
1. Replace Web Audio API with WebRTC
2. Update connection logic
3. Update visual states
4. Add connection status indicator

**Changes:**
- Remove: `use-voice-activity-detection.ts` (VAD now server-side)
- Remove: `use-continuous-recording.ts` (streaming now WebRTC)
- Keep: `use-auto-transcription.ts` (modify for WebRTC)
- Update: `VoiceToggle.tsx` (new connection states)

---

### Day 19-20: Testing & Debugging

**Manual Testing:**
1. Test WebRTC connection
2. Test audio quality
3. Test VAD accuracy
4. Test transcription latency
5. Test TTS quality

**Performance Testing:**
1. Measure end-to-end latency
2. Measure audio quality (MOS score)
3. Measure CPU/memory usage
4. Test with multiple concurrent users

---

## 📦 Phase 3: Migration & Cleanup (Week 3)

### Day 21-22: Gradual Migration

**Task 3.1: Feature Flag**

**Steps:**
1. Add feature flag: `USE_PIPECAT`
2. Environment variable: `VOICE_BACKEND=pipecat|web`
3. Frontend checks flag
4. Backend serves appropriate endpoint

**Benefits:**
- Test Pipecat with subset of users
- Easy rollback if issues
- Compare quality side-by-side

---

**Task 3.2: Parallel Deployment**

**Steps:**
1. Deploy Pipecat service alongside existing
2. Route 10% of traffic to Pipecat
3. Monitor metrics (quality, latency, errors)
4. Gradually increase to 100%

**Monitoring:**
- Audio quality metrics
- Latency metrics
- Error rates
- User feedback

---

### Day 23-24: Cleanup Old Code

**Task 3.3: Remove Web API Code**

**Once Pipecat is stable:**
1. Remove `use-voice-activity-detection.ts`
2. Remove `use-continuous-recording.ts`
3. Remove Web Speech API TTS code
4. Update documentation

**Keep:**
- Tests (update for Pipecat)
- Documentation (update architecture)

---

### Day 25: Documentation Update

**Task 3.4: Update All Documentation**

**Files to update:**
1. `VOICE_ASSISTANT_TECH_STACK.md` - Add Pipecat
2. `VOICE_ASSISTANT_ARCHITECTURE.md` - Update architecture
3. `TTS_INTEGRATION_COMPLETE.md` - Update for Piper
4. `VOICE_ASSISTANT_STATUS_UPDATE.md` - Add migration notes
5. Create: `PIPECAT_MIGRATION_COMPLETE.md`

---

## 🧪 Testing Strategy (TDD Throughout)

### Unit Tests (Backend)

**Test Coverage:**
- [ ] Pipecat service initialization
- [ ] WebRTC connection handling
- [ ] VAD detection accuracy
- [ ] Audio format conversion
- [ ] Transcription integration
- [ ] TTS integration
- [ ] Error handling
- [ ] Reconnection logic

**Target:** >90% coverage

---

### Integration Tests (Backend)

**Test Scenarios:**
- [ ] End-to-end audio pipeline
- [ ] WebRTC → VAD → Transcription → Chat → TTS → WebRTC
- [ ] Multiple concurrent connections
- [ ] Connection failures and recovery
- [ ] Audio quality under load

---

### E2E Tests (Frontend + Backend)

**Test Scenarios:**
- [ ] User speaks → AI responds → User hears
- [ ] Connection establishment
- [ ] Audio quality
- [ ] Latency measurements
- [ ] Error scenarios

---

## 📊 Success Metrics

### Technical Metrics

| Metric | Current (Web APIs) | Target (Pipecat) |
|--------|-------------------|------------------|
| Audio quality (MOS) | 3.0-3.5 | 4.0-4.5 |
| VAD accuracy | ~90% | >95% |
| End-to-end latency | ~2s | <1.5s |
| Noise handling | Poor | Good |
| Echo cancellation | None | Yes |
| Concurrent users | 10 | 100+ |

### User Experience Metrics

| Metric | Target |
|--------|--------|
| User satisfaction | >4.5/5 |
| Audio clarity rating | >4.0/5 |
| Connection reliability | >99% |
| Transcription accuracy | >95% |

---

## 🔧 Configuration Management

### Backend Configuration

**Add to `.env`:**
```bash
# Pipecat Configuration
PIPECAT_ENABLED=true
PIPECAT_WEBRTC_PORT=8001
PIPECAT_VAD_SENSITIVITY=0.5
PIPECAT_AUDIO_SAMPLE_RATE=16000

# Piper TTS Configuration
PIPER_MODEL_PATH=/models/piper/en_US-lessac-medium
PIPER_VOICE=en_US-lessac-medium
PIPER_SAMPLE_RATE=22050

# WebRTC Configuration
WEBRTC_STUN_SERVER=stun:stun.l.google.com:19302
WEBRTC_TURN_SERVER=turn:your-turn-server.com:3478
WEBRTC_TURN_USERNAME=username
WEBRTC_TURN_PASSWORD=password
```

### Frontend Configuration

**Add to environment:**
```typescript
// lib/env-config.ts
export const VOICE_CONFIG = {
  usePipecat: process.env.NEXT_PUBLIC_USE_PIPECAT === 'true',
  pipecatUrl: process.env.NEXT_PUBLIC_PIPECAT_URL || 'ws://localhost:8001',
  stunServer: process.env.NEXT_PUBLIC_STUN_SERVER,
  turnServer: process.env.NEXT_PUBLIC_TURN_SERVER,
};
```

---

## 🚨 Risk Mitigation

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Pipecat learning curve | Medium | Start with simple example, read docs |
| WebRTC complexity | High | Use Pipecat's abstractions, test thoroughly |
| Audio quality issues | High | Test with real users, tune VAD settings |
| Latency increase | Medium | Optimize pipeline, use streaming |
| Deployment complexity | Medium | Use feature flag, gradual rollout |
| Breaking existing features | High | Keep old code until Pipecat stable |

---

## 📝 Checklist - Before Starting

### Prerequisites

- [ ] Read Pipecat documentation
- [ ] Review WebRTC basics
- [ ] Understand current voice implementation
- [ ] Set up test environment
- [ ] Prepare test audio samples
- [ ] Get user approval for migration

### Team Readiness

- [ ] Team understands Pipecat
- [ ] Team understands WebRTC
- [ ] Test environment ready
- [ ] Monitoring tools ready
- [ ] Rollback plan documented

---

## 🎯 Decision Points

### Week 1 Checkpoint

**After Day 5, evaluate:**
- [ ] Pipecat integration working?
- [ ] Audio quality improved?
- [ ] Team comfortable with Pipecat?
- [ ] Continue or pivot?

**Decision:** Continue if 3/4 yes, otherwise reassess

---

### Week 2 Checkpoint

**After Day 15, evaluate:**
- [ ] WebRTC client working?
- [ ] End-to-end flow working?
- [ ] Quality meets expectations?
- [ ] Ready for testing?

**Decision:** Proceed to migration if all yes

---

## 🎉 Success Criteria

### Migration Complete When:

- [x] All tests passing (unit, integration, E2E)
- [x] Audio quality improved (MOS >4.0)
- [x] Latency acceptable (<1.5s)
- [x] User testing positive (>4.5/5)
- [x] No critical bugs
- [x] Documentation updated
- [x] Old code removed
- [x] Team trained on Pipecat

---

## 📚 Resources

### Documentation to Read

1. **Pipecat:**
   - Official docs: https://docs.pipecat.ai
   - GitHub: https://github.com/pipecat-ai/pipecat
   - Examples: https://github.com/pipecat-ai/pipecat/tree/main/examples

2. **WebRTC:**
   - MDN WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
   - WebRTC for the Curious: https://webrtcforthecurious.com

3. **Piper TTS:**
   - GitHub: https://github.com/rhasspy/piper
   - Models: https://huggingface.co/rhasspy/piper-voices

### Tools Needed

- **Testing:** pytest, pytest-asyncio, httpx
- **Audio:** ffmpeg, sox (for audio processing)
- **Monitoring:** Prometheus, Grafana (optional)
- **Debugging:** Wireshark (for WebRTC debugging)

---

## 🤔 Questions to Answer During Migration

### Technical Questions

1. **Which Pipecat transport?** WebRTC (browser) or WebSocket (simpler)?
2. **Which VAD model?** Silero (recommended) or WebRTC VAD?
3. **Which TTS?** Piper (local) or ElevenLabs (cloud)?
4. **Streaming or buffered?** Streaming (better UX) or buffered (simpler)?
5. **STUN/TURN servers?** Public (free) or private (reliable)?

### Architecture Questions

1. **Separate service or integrated?** Integrated (monolith) recommended
2. **Async or sync?** Async (I/O-bound)
3. **Session management?** Redis (scalable) or in-memory (simple)?
4. **Load balancing?** Sticky sessions (WebRTC) or round-robin?

---

## 🎯 Summary

### What We're Doing

1. **Week 1:** Backend Pipecat integration (TDD, vertical slicing)
2. **Week 2:** Frontend WebRTC client (React best practices)
3. **Week 3:** Migration, testing, cleanup

### Why We're Doing It

- Improve audio quality (3.0 → 4.5 MOS)
- Better VAD (90% → 95% accuracy)
- Professional WebRTC (production-ready)
- Better accessibility (clearer audio for visually impaired)

### How We're Doing It

- **TDD:** One test → one implementation (vertical slicing)
- **Python Patterns:** FastAPI async, type hints, clean structure
- **System Architecture:** Well-structured monolith, clear boundaries
- **React Best Practices:** Bundle optimization, re-render optimization

### Success Looks Like

- ✅ Audio quality significantly improved
- ✅ All tests passing
- ✅ Users happy (>4.5/5 satisfaction)
- ✅ Production-ready
- ✅ Team confident with Pipecat

---

**Ready to start? Let's build better voice quality for accessibility!** 🎤✨

