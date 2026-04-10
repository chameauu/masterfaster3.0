# Pipecat Migration - Day 2 Complete ✅

**Date:** 2026-04-10  
**Phase:** Week 1, Day 1-2 (Dependencies & Setup)  
**Status:** Day 1-2 Complete

---

## 🎯 What We Accomplished Today

### 1. Installation Complete ✅

**Installed Pipecat with Extras:**
```bash
uv add "pipecat-ai[webrtc,silero,piper]"
```

**Installation Results:**
- Pipecat version: `0.0.108` ✅
- Total packages installed: 17
- Installation time: ~1 minute

**Packages Installed:**
- Core: `pipecat-ai==0.0.108`
- WebRTC: `aioice`, `aiortc`, `av`, `pylibsrtp`, `pyopenssl`
- VAD: `onnxruntime`, `coloredlogs`, `humanfriendly`
- TTS: `piper-tts`, `pathvalidate`, `resampy`, `soxr`
- Utilities: `google-crc32c`, `ifaddr`, `pyloudnorm`

---

### 2. Documentation Retrieved via Context7 MCP ✅

**Key Findings from Pipecat Docs:**

**Correct Import Paths:**
```python
# Piper TTS (NOT pipecat.services.piper.tts)
from pipecat.services.piper import PiperTTSService

# Silero VAD (NOT pipecat.vad.silero)
from pipecat.audio.vad.silero import SileroVADAnalyzer

# FastAPI WebSocket Transport
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketTransport,
    FastAPIWebsocketParams,
)

# Pipeline components
from pipecat.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
```

**Pipeline Architecture:**
```python
# Basic pipeline structure from Context7 docs
pipeline = Pipeline([
    transport.input(),           # WebSocket/WebRTC input
    user_aggregator,             # Aggregates user speech with VAD
    llm,                         # LLM processing (our chat agent)
    tts,                         # Text-to-speech (Piper)
    transport.output(),          # WebSocket/WebRTC output
    assistant_aggregator,        # Aggregates assistant responses
])
```

**VAD Integration:**
```python
# VAD is integrated via user aggregator
from pipecat.audio.vad.vad_analyzer import VADParams

vad_analyzer = SileroVADAnalyzer(
    params=VADParams(
        confidence=0.7,      # Minimum confidence for voice detection
        start_secs=0.2,      # Time to wait before confirming speech start
        stop_secs=0.2,       # Time to wait before confirming speech stop
        min_volume=0.6,      # Minimum volume threshold
    )
)

user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
    context,
    user_params=LLMUserAggregatorParams(
        vad_analyzer=vad_analyzer
    ),
)
```

**Piper TTS Configuration:**
```python
from pipecat.services.piper import PiperTTSService

tts = PiperTTSService(
    settings=PiperTTSService.Settings(
        voice="en_US-ryan-high",  # High-quality English voice
    ),
)
```

---

### 3. Project Structure Created ✅

**New Files Created:**

**Services:**
```
backend/app/services/voice/
├── pipecat_service.py          ✅ Main Pipecat integration
├── vad_processor.py            ✅ Silero VAD wrapper
├── audio_pipeline.py           ✅ Audio processing pipeline
```

**Routes:**
```
backend/app/routes/
├── pipecat_routes.py           ✅ WebRTC endpoints
```

**Tests:**
```
backend/tests/unit/voice/
├── test_pipecat_service.py     ✅ 3 tests (skeleton)
├── test_vad_processor.py       ✅ 2 tests (skeleton)
├── test_audio_pipeline.py      ✅ 3 tests (skeleton)
```

**Total:** 7 new files created

---

### 4. Skeleton Implementations ✅

**PipecatService (`pipecat_service.py`):**
- Class structure defined
- Lifecycle methods (start, stop)
- Logging configured
- Ready for WebRTC implementation

**VADProcessor (`vad_processor.py`):**
- Configurable VAD parameters
- Speech detection interface
- Ready for Silero integration

**AudioPipeline (`audio_pipeline.py`):**
- Pipeline coordination structure
- Audio input/output handlers
- Ready for pipeline implementation

**PipecatRoutes (`pipecat_routes.py`):**
- WebSocket endpoint for voice streaming
- Health check endpoint
- Ready for WebRTC signaling

---

### 5. Test Files Created (TDD Ready) ✅

**Following TDD Principles:**
- RED: Tests written first (will fail)
- GREEN: Implement minimal code to pass
- REFACTOR: Improve code quality

**Test Coverage Planned:**
- `test_pipecat_service.py`: 3 initial tests
  * Service initialization
  * Service start
  * Service stop
- `test_vad_processor.py`: 2 initial tests
  * VAD initialization with defaults
  * VAD initialization with custom params
- `test_audio_pipeline.py`: 3 initial tests
  * Pipeline initialization
  * Pipeline start
  * Pipeline stop

**Total:** 8 tests ready for TDD implementation

---

## 📊 Progress Summary

### Day 1-2 Checklist

- [x] Research Pipecat version
- [x] Add dependencies to pyproject.toml
- [x] Install Pipecat with extras
- [x] Verify installation
- [x] Retrieve documentation via Context7 MCP
- [x] Create project structure
- [x] Create skeleton implementations
- [x] Create test files
- [x] Document findings

**Status:** Day 1-2 COMPLETE ✅

---

## 🔍 Technical Insights

### Pipecat Architecture Understanding

**Frame-Based Processing:**
- Pipecat uses a frame-based architecture
- Audio flows through processors as frames
- Each processor transforms frames and passes to next

**Aggregators:**
- `LLMContextAggregatorPair` manages conversation context
- User aggregator: Collects user speech, integrates VAD
- Assistant aggregator: Collects assistant responses

**Transport Options:**
- Daily (WebRTC service)
- SmallWebRTC (self-hosted WebRTC)
- FastAPI WebSocket (simpler, what we'll use)

**Decision:** Use FastAPI WebSocket transport for simpler integration with existing FastAPI backend.

---

### VAD Integration Pattern

**From Context7 Documentation:**
```python
# VAD is NOT a separate processor in the pipeline
# It's integrated into the user aggregator

user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
    context,
    user_params=LLMUserAggregatorParams(
        vad_analyzer=SileroVADAnalyzer(
            params=VADParams(
                confidence=0.7,
                start_secs=0.2,
                stop_secs=0.2,
                min_volume=0.6,
            )
        ),
    ),
)
```

**Key Insight:** VAD is a parameter of the user aggregator, not a separate pipeline stage.

---

### TTS Integration Pattern

**From Context7 Documentation:**
```python
# Piper TTS is a pipeline processor
tts = PiperTTSService(
    settings=PiperTTSService.Settings(
        voice="en_US-ryan-high",
    ),
)

# Placed in pipeline after LLM, before output
pipeline = Pipeline([
    transport.input(),
    user_aggregator,
    llm,
    tts,                    # ← Converts text to audio
    transport.output(),
    assistant_aggregator,
])
```

**Key Insight:** TTS is a processor that converts LLMTextFrames to TTSAudioRawFrames.

---

## 🎯 Next Steps (Day 3-4)

### Tracer Bullet: WebRTC Connection (TDD)

**Following TDD Vertical Slicing:**

**Day 3 Morning: RED Phase**
1. Write test: `test_webrtc_connection_establishes`
2. Test should verify:
   - FastAPI WebSocket accepts connection
   - Pipecat pipeline initializes
   - Audio frames can be sent/received
3. Run test → FAILS (expected)

**Day 3 Afternoon: GREEN Phase**
1. Implement minimal PipecatService
2. Initialize FastAPIWebsocketTransport
3. Create basic pipeline
4. Handle WebSocket connection
5. Run test → PASSES

**Day 4: REFACTOR Phase**
1. Extract configuration to settings
2. Add proper error handling
3. Add logging
4. Add type hints
5. Add docstrings
6. Run test → STILL PASSES

**Goal:** End-to-end WebRTC connection working (minimal, no VAD/STT/TTS yet)

---

## 📚 Resources Used

### Context7 MCP Queries

**Query 1:** "How to build a voice AI pipeline with WebRTC transport, Silero VAD, Faster-Whisper STT, and Piper TTS?"
- Retrieved: Pipeline architecture, VAD integration, transport setup

**Query 2:** "How to use Faster-Whisper STT service and Piper TTS service in Pipecat?"
- Retrieved: Import paths, configuration examples

**Query 3:** "Piper TTS service configuration and usage in Pipecat pipeline"
- Retrieved: PiperTTSService initialization, voice models

**Key Findings:**
- Correct import paths (different from deprecated paths)
- VAD integration pattern (via aggregator, not separate processor)
- Pipeline structure (frame-based processing)
- FastAPI WebSocket transport available

---

## 🤔 Decisions Made

### Decision 1: Use FastAPI WebSocket Transport

**Context:** Pipecat offers multiple transport options

**Options:**
1. Daily (WebRTC service, requires account)
2. SmallWebRTC (self-hosted WebRTC, complex)
3. FastAPI WebSocket (simpler, integrates with existing backend)

**Decision:** FastAPI WebSocket transport

**Rationale:**
- Already using FastAPI
- Simpler integration
- No external service dependency
- Can upgrade to WebRTC later if needed

**Trade-offs:**
- WebSocket vs WebRTC (accepted for simplicity)
- May need to upgrade later (acceptable)

---

### Decision 2: Integrate VAD via Aggregator

**Context:** VAD can be separate processor or integrated into aggregator

**Decision:** Integrate via LLMUserAggregatorParams (as per Pipecat docs)

**Rationale:**
- Recommended pattern in Pipecat docs
- Simpler pipeline structure
- VAD tightly coupled with user speech aggregation

**Trade-offs:**
- Less flexible (accepted for simplicity)
- Follows Pipecat best practices

---

### Decision 3: Use Existing Faster-Whisper

**Context:** Pipecat has built-in Whisper support

**Decision:** Keep existing TranscriptionService, integrate with Pipecat

**Rationale:**
- Already tested and working
- Good performance
- Pipecat supports custom STT

**Trade-offs:**
- Manual integration needed (acceptable)
- Not using Pipecat's built-in Whisper (fine)

---

## ✅ Day 1-2 Complete Checklist

- [x] Install Pipecat with extras
- [x] Verify installation (0.0.108)
- [x] Retrieve documentation via Context7
- [x] Understand pipeline architecture
- [x] Understand VAD integration pattern
- [x] Understand TTS integration pattern
- [x] Create project structure
- [x] Create skeleton implementations
- [x] Create test files
- [x] Document findings and decisions
- [x] Plan Day 3-4 (Tracer Bullet)

---

## 🎉 Summary

Day 1-2 is complete! We've successfully:

1. ✅ Installed Pipecat 0.0.108 with all extras
2. ✅ Retrieved comprehensive documentation via Context7 MCP
3. ✅ Created complete project structure (7 new files)
4. ✅ Created skeleton implementations (services, routes)
5. ✅ Created test files (8 tests ready for TDD)
6. ✅ Documented architecture patterns and decisions

**Key Achievements:**
- Correct import paths documented
- Pipeline architecture understood
- VAD integration pattern clear
- TTS integration pattern clear
- FastAPI WebSocket transport chosen
- Ready for Day 3-4 Tracer Bullet

**Ready for Day 3-4:** Tracer Bullet - WebRTC Connection (TDD)

---

**Last Updated:** 2026-04-10  
**Next Update:** After Day 3-4 complete (Tracer Bullet)

