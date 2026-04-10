# Pipecat Migration Status

**Date Started:** 2026-04-10  
**Current Phase:** Week 1 - Backend Pipecat Integration  
**Status:** Starting Day 1-2 (Dependencies & Setup)

---

## 📋 Migration Overview

**Goal:** Migrate from Web APIs to Pipecat for professional audio quality

**Reason:** User feedback - "Web native quality is bad"

**Timeline:** 3 weeks (21 days)

**Approach:** TDD with vertical slicing, following .kiro skills

---

## ✅ Prerequisites Complete

- [x] Skills loaded (TDD, Python Patterns, System Architecture, React Best Practices)
- [x] Migration plan created (`PIPECAT_MIGRATION_PLAN.md`)
- [x] Current implementation documented
- [x] Architecture decisions made (well-structured monolith)
- [x] User approval obtained

---

## 📅 Week 1: Backend Pipecat Integration

### Day 1-2: Pipecat Setup & Dependencies ✅ COMPLETE

**Tasks:**
- [x] Research Pipecat version (check PyPI)
- [x] Add Pipecat dependencies to pyproject.toml
- [x] Install dependencies: `uv add "pipecat-ai[webrtc,silero,piper]"`
- [x] Verify installation (Pipecat 0.0.108 working)
- [x] Create project structure
- [x] Document dependencies
- [x] Retrieve Pipecat documentation via Context7 MCP

**Dependencies Installed:**
- `pipecat-ai==0.0.108` - Main framework (latest version)
- WebRTC extras: `aioice`, `aiortc`, `av`, `pylibsrtp`, `pyopenssl`
- Silero VAD extras: `onnxruntime`, `coloredlogs`, `humanfriendly`
- Piper TTS extras: `piper-tts`, `pathvalidate`, `resampy`, `soxr`
- Additional: `google-crc32c`, `ifaddr`, `pyloudnorm`

**Findings:**
- Latest Pipecat version: `0.0.108` (released March 28, 2026)
- Installation successful with all extras
- Correct import paths from Context7 docs:
  * `from pipecat.services.piper import PiperTTSService` (not pipecat.services.piper.tts)
  * `from pipecat.audio.vad.silero import SileroVADAnalyzer` (not pipecat.vad.silero)
- FastAPI WebSocket transport available: `FastAPIWebsocketTransport`
- Pipeline architecture: Frame-based processing with aggregators

**Project Structure Created:**
```
backend/app/services/voice/
├── pipecat_service.py          ✅ Created (skeleton)
├── vad_processor.py            ✅ Created (skeleton)
├── audio_pipeline.py           ✅ Created (skeleton)

backend/app/routes/
├── pipecat_routes.py           ✅ Created (skeleton)

backend/tests/unit/voice/
├── test_pipecat_service.py     ✅ Created (3 tests)
├── test_vad_processor.py       ✅ Created (2 tests)
├── test_audio_pipeline.py      ✅ Created (3 tests)
```

**Status:** Day 1-2 COMPLETE ✅

**Next Steps:**
1. Day 3-4: Tracer Bullet - WebRTC Connection (TDD)
2. Implement minimal WebRTC connection test
3. Make test pass with minimal implementation

---

### Day 3-4: Tracer Bullet - WebRTC Connection ✅ COMPLETE

**Day 3 Tasks (RED & GREEN):**
- [x] Write test: `test_webrtc_connection_establishes` (RED)
- [x] Verify test fails
- [x] Implement `PipecatService.start(websocket)` (GREEN)
- [x] Initialize FastAPIWebsocketTransport
- [x] Create minimal Pipeline (input → output echo)
- [x] Verify test passes
- [x] Update old tests
- [x] Register route in app
- [x] All 4 tests passing

**Day 4 Tasks (REFACTOR):**
- [x] Extract configuration to `pipecat_config.py`
- [x] Add custom exception hierarchy
- [x] Improve logging (debug, info, error levels)
- [x] Add type hints everywhere
- [x] Enhance docstrings with examples
- [x] Extract private helper methods
- [x] Add configuration validation
- [x] Create 11 new tests for configuration
- [x] All 29 tests passing

**Implementation:**
- Minimal WebRTC connection working
- Pipeline echoes audio back (tracer bullet)
- Service lifecycle management (start/stop)
- Route available at `/api/v1/pipecat/ws`
- Production-ready code quality

**Test Results:**
```
29 passed, 2 warnings in 1.80s
✅ 11 configuration tests (NEW)
✅ 4 PipecatService tests
✅ 14 existing voice tests
```

**Status:** Day 3-4 COMPLETE ✅

**Next:** Day 5-6 - VAD Integration

---

### Day 5-6: VAD Integration ✅ DAY 5 COMPLETE

**Day 5 Tasks (RED & GREEN):**
- [x] Write test: `test_vad_integration` (RED)
- [x] Verify test fails
- [x] Add VAD and aggregator imports (GREEN)
- [x] Create `_create_vad_analyzer()` method
- [x] Create `_create_context()` method
- [x] Create `_create_aggregators()` method
- [x] Update pipeline to include aggregators
- [x] Update cleanup method
- [x] Verify test passes
- [x] All 30 tests passing

**Implementation:**
- Silero VAD integrated via user aggregator
- LLM context created for conversation management
- User and assistant aggregators added
- Pipeline now includes VAD for speech detection

**Pipeline Evolution:**
```python
# Day 5: VAD Integration
pipeline = Pipeline([
    transport.input(),
    user_aggregator,         # ← NEW: Includes Silero VAD
    transport.output(),
    assistant_aggregator,    # ← NEW: Manages responses
])
```

**Test Results:**
```
30 passed, 2 warnings in 2.24s
✅ test_vad_integration (NEW)
✅ All existing tests still passing
```

**Status:** Day 5 COMPLETE ✅

**Day 6 Tasks (REFACTOR):**
- [ ] Extract system prompt to configuration
- [ ] Add error handling for VAD initialization
- [ ] Improve logging for VAD events
- [ ] Add docstring examples
- [ ] All tests must still pass

**Next:** Day 6 - REFACTOR phase

---

### Day 7-8: Transcription Integration

**Tasks:**
- [ ] Write test: `test_transcription_integration`
- [ ] Connect VAD to transcription service
- [ ] Buffer audio during speech
- [ ] Send to Faster-Whisper
- [ ] Forward transcript to chat
- [ ] Test passes

**Status:** Not started

---

### Day 9-10: TTS Integration (Piper)

**Tasks:**
- [ ] Write test: `test_tts_integration_piper`
- [ ] Install Piper TTS
- [ ] Create `PiperTTSService` class
- [ ] Initialize Piper with voice model
- [ ] Convert text to audio
- [ ] Stream to WebRTC output
- [ ] Test passes

**Status:** Not started

---

## 📅 Week 2: Frontend WebRTC Client

### Day 11-12: WebRTC Client Setup

**Status:** Not started

### Day 13-14: WebRTC Connection Hook

**Status:** Not started

### Day 15-16: Audio Streaming Hook

**Status:** Not started

### Day 17-18: UI Integration

**Status:** Not started

### Day 19-20: Testing & Debugging

**Status:** Not started

---

## 📅 Week 3: Migration & Cleanup

### Day 21-22: Gradual Migration

**Status:** Not started

### Day 23-24: Cleanup Old Code

**Status:** Not started

### Day 25: Documentation Update

**Status:** Not started

---

## 🎯 Success Metrics

### Target Improvements

| Metric | Current (Web APIs) | Target (Pipecat) | Actual |
|--------|-------------------|------------------|--------|
| Audio quality (MOS) | 3.0-3.5 | 4.0-4.5 | TBD |
| VAD accuracy | ~90% | >95% | TBD |
| End-to-end latency | ~2s | <1.5s | TBD |
| Noise handling | Poor | Good | TBD |
| Echo cancellation | None | Yes | TBD |
| Concurrent users | 10 | 100+ | TBD |

---

## 📝 Daily Log

### 2026-04-10 (Day 4)

**Tasks Completed:**
- [x] REFACTOR Phase: Extract configuration to `pipecat_config.py`
- [x] Create PipecatWebSocketConfig dataclass
- [x] Create PipecatPipelineConfig dataclass
- [x] Create PipecatServiceConfig dataclass
- [x] Add configuration validation
- [x] Add custom exception hierarchy (PipecatServiceError, PipecatConnectionError, PipecatPipelineError)
- [x] Extract private helper methods (_create_transport, _create_pipeline, _create_task, _cleanup)
- [x] Improve logging (debug, info, error with context)
- [x] Add type hints everywhere
- [x] Enhance docstrings with examples and exception docs
- [x] Create 11 new tests for configuration
- [x] All 29 tests passing
- [x] Document Day 4 completion

**Findings:**
- Configuration extraction biggest impact on code quality
- Dataclasses perfect for config with validation
- Private helper methods improve Single Responsibility
- Custom exceptions enable better error handling
- All tests still passing after refactoring (TDD success)

**Test Results:**
- 29 tests passing (was 18, added 11 config tests)
- test_pipecat_config.py: 11 tests ✅ (NEW)
- All existing tests still passing ✅

**Blockers:** None

**Next:** Day 5-6 - VAD Integration (Silero VAD for speech detection)

---

## 🚨 Risks & Mitigation

| Risk | Status | Mitigation |
|------|--------|------------|
| Pipecat learning curve | Active | Read docs, start simple |
| WebRTC complexity | Monitoring | Use Pipecat abstractions |
| Audio quality issues | Monitoring | Test with real users |
| Latency increase | Monitoring | Optimize pipeline |
| Breaking existing features | Mitigated | Feature flag, keep old code |

---

## 📞 Decision Log

### Decision 1: Use Pipecat (2026-04-10)

**Context:** User reports Web Speech API quality is bad

**Options:**
1. Improve Web Speech API settings
2. Use Piper TTS backend only
3. Full Pipecat migration

**Decision:** Full Pipecat migration

**Rationale:**
- Professional audio quality needed
- Better VAD (Silero vs threshold-based)
- Production-grade WebRTC
- Noise cancellation + echo removal
- Future-proof for scaling

**Trade-offs:**
- More complexity (accepted for quality)
- 3-week timeline (acceptable)
- New dependencies (manageable)

---

### Decision 2: Well-Structured Monolith (2026-04-10)

**Context:** Architecture for Pipecat integration

**Options:**
1. Microservices (separate voice service)
2. Well-structured monolith (voice layer)

**Decision:** Well-structured monolith

**Rationale:**
- Team size: 1-3 developers
- Simpler deployment
- Easier debugging
- Clear boundaries within monolith
- Can extract later if needed

**Trade-offs:**
- Single deployment unit (accepted)
- Shared resources (manageable)

---

## 📚 Resources

### Documentation Read

- [x] `PIPECAT_MIGRATION_PLAN.md`
- [x] `VOICE_ASSISTANT_TECH_STACK.md`
- [x] `VOICE_ASSISTANT_STATUS_UPDATE.md`
- [x] `.kiro/skills/tdd/SKILL.md`
- [x] `.kiro/skills/python-patterns/SKILL.md`
- [x] `.kiro/skills/system-architecture/SKILL.md`

### External Resources

- [ ] Pipecat docs: https://docs.pipecat.ai
- [ ] Pipecat GitHub: https://github.com/pipecat-ai/pipecat
- [ ] Pipecat examples: https://github.com/pipecat-ai/pipecat/tree/main/examples
- [ ] Piper TTS: https://github.com/rhasspy/piper
- [ ] Silero VAD: https://github.com/snakers4/silero-vad

---

## 🎯 Current Focus

**Week 1, Day 3-4: Tracer Bullet - WebRTC Connection**

**Status:** Ready to start Day 3

**Goal:** Minimal WebRTC connection with bidirectional audio streaming

**Approach:** TDD with vertical slicing
- RED: Write failing test (Day 3 morning)
- GREEN: Minimal implementation (Day 3 afternoon)
- REFACTOR: Clean up code (Day 4)

**Next Steps:**
1. Write `test_webrtc_connection_establishes`
2. Verify test fails (RED)
3. Implement minimal PipecatService
4. Make test pass (GREEN)
5. Refactor and clean up (REFACTOR)

**Reference Documents:**
- `PIPECAT_READY_FOR_DAY3.md` - Complete Day 3 plan
- `PIPECAT_CONTEXT7_FINDINGS.md` - Import paths and patterns
- `PIPECAT_DAY2_COMPLETE.md` - What we accomplished

---

**Last Updated:** 2026-04-10  
**Next Update:** After Day 3-4 complete (Tracer Bullet)
