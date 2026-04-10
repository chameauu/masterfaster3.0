# Pipecat Migration - Ready for Day 3 🚀

**Date:** 2026-04-10  
**Status:** Day 1-2 Complete, Ready for Day 3-4 (Tracer Bullet)

---

## ✅ What's Complete

### 1. Installation & Setup ✅

- [x] Pipecat 0.0.108 installed with all extras
- [x] 17 packages installed (WebRTC, Silero VAD, Piper TTS)
- [x] Installation verified and working
- [x] Python 3.12 confirmed

### 2. Documentation Retrieved ✅

- [x] Context7 MCP queries completed (3 queries)
- [x] Correct import paths documented
- [x] Pipeline architecture understood
- [x] VAD integration pattern clear
- [x] TTS integration pattern clear
- [x] FastAPI WebSocket transport understood

### 3. Project Structure Created ✅

**7 New Files:**
- `backend/app/services/voice/pipecat_service.py` ✅
- `backend/app/services/voice/vad_processor.py` ✅
- `backend/app/services/voice/audio_pipeline.py` ✅
- `backend/app/routes/pipecat_routes.py` ✅
- `backend/tests/unit/voice/test_pipecat_service.py` ✅
- `backend/tests/unit/voice/test_vad_processor.py` ✅
- `backend/tests/unit/voice/test_audio_pipeline.py` ✅

### 4. Tests Created ✅

**8 Tests Passing:**
- `test_service_initializes` ✅
- `test_service_starts` ✅
- `test_service_stops` ✅
- `test_vad_initializes_with_defaults` ✅
- `test_vad_initializes_with_custom_params` ✅
- `test_pipeline_initializes` ✅
- `test_pipeline_starts` ✅
- `test_pipeline_stops` ✅

**Test Results:**
```
8 passed in 0.13s
```

### 5. Documentation Created ✅

**4 Documentation Files:**
- `PIPECAT_MIGRATION_PLAN.md` ✅ (Comprehensive 3-week plan)
- `PIPECAT_MIGRATION_STATUS.md` ✅ (Status tracking)
- `PIPECAT_DAY1_COMPLETE.md` ✅ (Day 1 summary)
- `PIPECAT_DAY2_COMPLETE.md` ✅ (Day 2 summary)
- `PIPECAT_CONTEXT7_FINDINGS.md` ✅ (Context7 documentation findings)
- `PIPECAT_READY_FOR_DAY3.md` ✅ (This file)

---

## 🎯 Day 3-4 Plan: Tracer Bullet

### Goal

**Minimal WebRTC connection working with bidirectional audio streaming**

**What "Tracer Bullet" Means:**
- Vertical slice through entire system
- End-to-end functionality (minimal)
- No VAD, STT, LLM, or TTS yet
- Just: WebSocket → Audio In → Audio Out → WebSocket

### TDD Approach

**RED Phase (Day 3 Morning):**
1. Write test: `test_webrtc_connection_establishes`
2. Test verifies:
   - WebSocket connection accepted
   - Pipecat pipeline initializes
   - Audio frames can be sent
   - Audio frames can be received
3. Run test → FAILS (expected)

**GREEN Phase (Day 3 Afternoon):**
1. Implement `PipecatService.__init__()`
2. Initialize `FastAPIWebsocketTransport`
3. Create minimal `Pipeline`
4. Handle WebSocket connection
5. Echo audio back (simplest test)
6. Run test → PASSES

**REFACTOR Phase (Day 4):**
1. Extract configuration to settings
2. Add proper error handling
3. Add comprehensive logging
4. Add type hints everywhere
5. Add docstrings
6. Clean up code
7. Run test → STILL PASSES

---

## 📋 Day 3 Implementation Checklist

### Morning: RED Phase

- [ ] Write `test_webrtc_connection_establishes` in `test_pipecat_service.py`
- [ ] Test should:
  - [ ] Create WebSocket connection
  - [ ] Initialize PipecatService
  - [ ] Send audio frame
  - [ ] Receive audio frame back
  - [ ] Assert connection successful
- [ ] Run test → Verify it FAILS
- [ ] Commit: "RED: Add WebRTC connection test"

### Afternoon: GREEN Phase

- [ ] Implement `PipecatService.__init__()`
  - [ ] Import FastAPIWebsocketTransport
  - [ ] Import Pipeline, PipelineTask, PipelineRunner
  - [ ] Store transport reference
- [ ] Implement `PipecatService.start()`
  - [ ] Create FastAPIWebsocketTransport
  - [ ] Create minimal Pipeline (input → output)
  - [ ] Create PipelineTask
  - [ ] Start PipelineRunner
- [ ] Update `pipecat_routes.py`
  - [ ] Accept WebSocket connection
  - [ ] Create PipecatService instance
  - [ ] Start service
  - [ ] Handle disconnection
- [ ] Run test → Verify it PASSES
- [ ] Commit: "GREEN: Implement minimal WebRTC connection"

---

## 🔧 Code Templates for Day 3

### Test Template (RED Phase)

```python
# backend/tests/unit/voice/test_pipecat_service.py

@pytest.mark.asyncio
async def test_webrtc_connection_establishes(self):
    """Test that WebRTC connection can be established."""
    # Arrange
    service = PipecatService()
    
    # Mock WebSocket
    mock_websocket = AsyncMock()
    
    # Act
    await service.start(mock_websocket)
    
    # Assert
    assert service.is_running
    assert service.transport is not None
    
    # Cleanup
    await service.stop()
```

### Implementation Template (GREEN Phase)

```python
# backend/app/services/voice/pipecat_service.py

from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketTransport,
    FastAPIWebsocketParams,
)
from pipecat.serializers.protobuf import ProtobufFrameSerializer
from pipecat.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.pipeline.runner import PipelineRunner

class PipecatService:
    def __init__(self):
        self.transport = None
        self.pipeline = None
        self.task = None
        self.runner = None
        self.is_running = False
    
    async def start(self, websocket):
        """Start Pipecat service with WebSocket."""
        # Create transport
        self.transport = FastAPIWebsocketTransport(
            websocket=websocket,
            params=FastAPIWebsocketParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
                add_wav_header=False,
                serializer=ProtobufFrameSerializer(),
            ),
        )
        
        # Create minimal pipeline (echo)
        self.pipeline = Pipeline([
            self.transport.input(),
            self.transport.output(),
        ])
        
        # Create task
        self.task = PipelineTask(
            self.pipeline,
            params=PipelineParams(
                enable_metrics=True,
            ),
        )
        
        # Start runner
        self.runner = PipelineRunner()
        self.is_running = True
        await self.runner.run(self.task)
```

### Route Template (GREEN Phase)

```python
# backend/app/routes/pipecat_routes.py

@router.websocket("/ws")
async def pipecat_websocket(websocket: WebSocket):
    """WebSocket endpoint for Pipecat voice streaming."""
    await websocket.accept()
    logger.info("Pipecat WebSocket connection established")
    
    service = PipecatService()
    
    try:
        await service.start(websocket)
    except WebSocketDisconnect:
        logger.info("Pipecat WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in Pipecat WebSocket: {e}", exc_info=True)
    finally:
        await service.stop()
```

---

## 📚 Key Documentation References

### Import Paths (From Context7)

```python
# Transport
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketTransport,
    FastAPIWebsocketParams,
)

# Serializer
from pipecat.serializers.protobuf import ProtobufFrameSerializer

# Pipeline
from pipecat.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.pipeline.runner import PipelineRunner
```

### Minimal Pipeline Structure

```python
pipeline = Pipeline([
    transport.input(),   # Receive audio from WebSocket
    transport.output(),  # Send audio to WebSocket
])
```

**This is the simplest possible pipeline - it just echoes audio back.**

---

## 🎯 Success Criteria for Day 3-4

### Day 3 End

- [ ] Test written and initially failing (RED)
- [ ] Test passing with minimal implementation (GREEN)
- [ ] WebSocket connection working
- [ ] Audio frames flowing through pipeline
- [ ] Basic logging in place

### Day 4 End

- [ ] Code refactored and clean
- [ ] Configuration extracted to settings
- [ ] Error handling comprehensive
- [ ] Type hints everywhere
- [ ] Docstrings complete
- [ ] Test still passing
- [ ] Ready for Day 5-6 (VAD integration)

---

## 🚀 What Happens After Day 3-4

### Day 5-6: VAD Integration

**Goal:** Add Silero VAD to detect speech

**Changes:**
```python
# Add VAD to pipeline
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)

user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
    context,
    user_params=LLMUserAggregatorParams(
        vad_analyzer=SileroVADAnalyzer(),
    ),
)

pipeline = Pipeline([
    transport.input(),
    user_aggregator,      # ← NEW: Includes VAD
    transport.output(),
    assistant_aggregator, # ← NEW: For context
])
```

### Day 7-8: Transcription Integration

**Goal:** Audio → Transcript

**Changes:**
```python
# Add custom STT processor
pipeline = Pipeline([
    transport.input(),
    user_aggregator,
    faster_whisper_processor,  # ← NEW: Our TranscriptionService
    transport.output(),
    assistant_aggregator,
])
```

### Day 9-10: TTS Integration

**Goal:** Text → Audio

**Changes:**
```python
# Add Piper TTS
from pipecat.services.piper import PiperTTSService

tts = PiperTTSService(
    settings=PiperTTSService.Settings(
        voice="en_US-ryan-high",
    ),
)

pipeline = Pipeline([
    transport.input(),
    user_aggregator,
    faster_whisper_processor,
    chat_agent_processor,  # ← NEW: Our chat agent
    tts,                   # ← NEW: Piper TTS
    transport.output(),
    assistant_aggregator,
])
```

---

## 📊 Progress Tracking

### Week 1: Backend Pipecat Integration

- [x] **Day 1-2**: Setup & Dependencies ✅
- [ ] **Day 3-4**: Tracer Bullet (WebRTC Connection) ← NEXT
- [ ] **Day 5-6**: VAD Integration
- [ ] **Day 7-8**: Transcription Integration
- [ ] **Day 9-10**: TTS Integration

### Week 2: Frontend WebRTC Client

- [ ] **Day 11-12**: WebRTC Client Setup
- [ ] **Day 13-14**: WebRTC Connection Hook
- [ ] **Day 15-16**: Audio Streaming Hook
- [ ] **Day 17-18**: UI Integration
- [ ] **Day 19-20**: Testing & Debugging

### Week 3: Migration & Cleanup

- [ ] **Day 21-22**: Gradual Migration
- [ ] **Day 23-24**: Cleanup Old Code
- [ ] **Day 25**: Documentation Update

---

## ✅ Pre-Day 3 Checklist

- [x] Pipecat installed and verified
- [x] Documentation retrieved and understood
- [x] Project structure created
- [x] Skeleton implementations created
- [x] Initial tests passing
- [x] Import paths documented
- [x] Pipeline architecture understood
- [x] TDD approach planned
- [x] Code templates prepared
- [x] Success criteria defined

**Status:** READY FOR DAY 3 🚀

---

## 🎉 Summary

We've completed Day 1-2 successfully:

1. ✅ Installed Pipecat 0.0.108 with all extras
2. ✅ Retrieved comprehensive documentation via Context7 MCP
3. ✅ Created complete project structure (7 files)
4. ✅ Created skeleton implementations
5. ✅ Created 8 passing tests
6. ✅ Documented everything thoroughly

**Next:** Day 3-4 - Tracer Bullet (WebRTC Connection)

**Approach:** TDD with vertical slicing
- RED: Write failing test
- GREEN: Minimal implementation
- REFACTOR: Clean up code

**Goal:** Minimal WebRTC connection with bidirectional audio streaming

---

**Last Updated:** 2026-04-10  
**Ready for:** Day 3-4 (Tracer Bullet)

