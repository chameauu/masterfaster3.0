# Pipecat Context7 Documentation Findings

**Date:** 2026-04-10  
**Source:** Context7 MCP Server  
**Library:** `/pipecat-ai/docs` (version 0.0.108)

---

## 🎯 Key Findings Summary

### Critical Import Paths (CORRECT)

**These are the CORRECT import paths from Context7 documentation:**

```python
# Piper TTS Service
from pipecat.services.piper import PiperTTSService

# Silero VAD Analyzer
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams

# FastAPI WebSocket Transport
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketTransport,
    FastAPIWebsocketParams,
)

# Protobuf Frame Serializer
from pipecat.serializers.protobuf import ProtobufFrameSerializer

# Pipeline Components
from pipecat.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.pipeline.runner import PipelineRunner

# LLM Context and Aggregators
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
```

**DEPRECATED Paths (DO NOT USE):**
- ❌ `from pipecat.services.piper.tts import PiperTTSService`
- ❌ `from pipecat.vad.silero import SileroVADAnalyzer`

---

## 📐 Pipeline Architecture

### Basic Pipeline Structure

```python
from pipecat.pipeline import Pipeline

pipeline = Pipeline([
    transport.input(),           # Receive audio from user
    user_aggregator,             # Aggregate user speech (includes VAD)
    llm,                         # Process with LLM (our chat agent)
    tts,                         # Convert response to speech
    transport.output(),          # Send audio to user
    assistant_aggregator,        # Aggregate assistant responses
])
```

### Frame-Based Processing

**Key Concept:** Pipecat uses frames for all data flow

**Frame Types:**
- `AudioRawFrame` - Raw audio data
- `TranscriptionFrame` - Transcribed text from STT
- `LLMTextFrame` - Text from LLM
- `TTSAudioRawFrame` - Audio from TTS
- `TTSTextFrame` - Text sent to TTS

**Flow:**
```
AudioRawFrame → STT → TranscriptionFrame → LLM → LLMTextFrame → TTS → TTSAudioRawFrame
```

---

## 🎤 VAD Integration Pattern

### Correct Pattern: Via User Aggregator

**From Context7 Documentation:**

```python
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)

# Configure VAD
vad_analyzer = SileroVADAnalyzer(
    params=VADParams(
        confidence=0.7,      # Minimum confidence for voice detection (0.0-1.0)
        start_secs=0.2,      # Time to wait before confirming speech start
        stop_secs=0.2,       # Time to wait before confirming speech stop
        min_volume=0.6,      # Minimum volume threshold (0.0-1.0)
    )
)

# Create aggregators with VAD
user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
    context,
    user_params=LLMUserAggregatorParams(
        vad_analyzer=vad_analyzer
    ),
)
```

**Key Insights:**
1. VAD is NOT a separate processor in the pipeline
2. VAD is integrated into the user aggregator via `user_params`
3. VAD automatically triggers speech start/stop events
4. User aggregator buffers audio during speech

---

## 🔊 Piper TTS Integration

### Configuration

```python
from pipecat.services.piper import PiperTTSService

tts = PiperTTSService(
    settings=PiperTTSService.Settings(
        voice="en_US-ryan-high",  # High-quality English voice
    ),
)
```

### Available Voices

**From Pipecat Documentation:**
- `en_US-ryan-high` - High-quality male voice
- `en_US-lessac-medium` - Medium-quality male voice
- `en_GB-*` - British English voices
- Many more available at: https://huggingface.co/rhasspy/piper-voices

### Pipeline Placement

```python
pipeline = Pipeline([
    transport.input(),
    user_aggregator,
    llm,                    # Generates LLMTextFrames
    tts,                    # Processes text → creates TTSAudioRawFrames
    transport.output(),     # Sends audio to user
    assistant_aggregator,   # Processes TTSTextFrames for context
])
```

**Key Insight:** TTS must be placed:
- AFTER LLM (to receive text)
- BEFORE transport.output() (to send audio)
- BEFORE assistant_aggregator (for context updates)

---

## 🌐 FastAPI WebSocket Transport

### Initialization

```python
from pipecat.serializers.protobuf import ProtobufFrameSerializer
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

async def run_bot(websocket_client):
    ws_transport = FastAPIWebsocketTransport(
        websocket=websocket_client,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            serializer=ProtobufFrameSerializer(),
        ),
    )
    
    # Use in pipeline
    pipeline = Pipeline([
        ws_transport.input(),
        # ... other processors ...
        ws_transport.output(),
    ])
```

### FastAPI Route Integration

```python
from fastapi import WebSocket

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await run_bot(websocket)
```

**Key Insights:**
1. FastAPI WebSocket is passed directly to transport
2. Protobuf serializer recommended for efficiency
3. Audio in/out can be enabled independently
4. WAV header optional (we'll use False for streaming)

---

## 🧠 LLM Context Management

### Context Initialization

```python
from pipecat.processors.aggregators.llm_context import LLMContext

context = LLMContext(
    messages=[
        {"role": "system", "content": "You are a helpful voice assistant."}
    ]
)
```

### Aggregator Pair

```python
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)

user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
    context,
    user_params=LLMUserAggregatorParams(
        vad_analyzer=vad_analyzer,
    ),
)
```

**Key Insights:**
1. Context is shared between user and assistant aggregators
2. User aggregator collects user speech (with VAD)
3. Assistant aggregator collects assistant responses
4. Both update the shared context automatically

---

## 🚀 Complete Example from Context7

### Full Pipeline Setup

```python
import os
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline import Pipeline
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.daily.transport import DailyParams, DailyTransport

# Transport
transport = DailyTransport(
    room_url="https://your-domain.daily.co/room-name",
    token="your-token",
    bot_name="Voice Bot",
    params=DailyParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
    ),
)

# STT
stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

# LLM
llm = OpenAILLMService(
    api_key=os.getenv("OPENAI_API_KEY"),
    settings=OpenAILLMService.Settings(
        model="gpt-4o",
        temperature=0.7,
    ),
)

# TTS
tts = CartesiaTTSService(
    api_key=os.getenv("CARTESIA_API_KEY"),
    settings=CartesiaTTSService.Settings(
        voice="71a7ad14-091c-4e8e-a314-022ece01c121",
    ),
)

# Context and Aggregators
context = LLMContext(
    messages=[{"role": "system", "content": "You are a helpful voice assistant."}]
)
user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
    context,
    user_params=LLMUserAggregatorParams(
        vad_analyzer=SileroVADAnalyzer(),
    ),
)

# Pipeline
pipeline = Pipeline([
    transport.input(),
    stt,
    user_aggregator,
    llm,
    tts,
    transport.output(),
    assistant_aggregator,
])

# Task
task = PipelineTask(
    pipeline,
    params=PipelineParams(
        enable_metrics=True,
        enable_usage_metrics=True,
    ),
)

# Run
runner = PipelineRunner()
await runner.run(task)
```

---

## 🔧 SurfSense Adaptation Plan

### Our Modified Pipeline

```python
# We'll adapt the above example to use:
# - FastAPI WebSocket (instead of Daily)
# - Existing Faster-Whisper (instead of Deepgram)
# - Piper TTS (instead of Cartesia)
# - Existing Chat Agent (instead of OpenAI)

pipeline = Pipeline([
    ws_transport.input(),           # FastAPI WebSocket
    # STT: Use existing TranscriptionService
    user_aggregator,                # With Silero VAD
    # LLM: Use existing chat agent
    tts,                            # Piper TTS
    ws_transport.output(),          # FastAPI WebSocket
    assistant_aggregator,
])
```

### Integration Points

**1. Transcription Service Integration:**
```python
# Create custom processor that wraps our TranscriptionService
class FasterWhisperProcessor:
    async def process_frame(self, frame: AudioRawFrame):
        # Buffer audio
        # When VAD detects end of speech:
        audio_data = self.buffer.get_audio()
        transcript = await transcription_service.transcribe(audio_data)
        return TranscriptionFrame(text=transcript)
```

**2. Chat Agent Integration:**
```python
# Create custom processor that wraps our chat agent
class ChatAgentProcessor:
    async def process_frame(self, frame: TranscriptionFrame):
        # Send to chat agent
        response = await chat_agent.process(frame.text)
        return LLMTextFrame(text=response)
```

**3. Piper TTS Integration:**
```python
# Use Pipecat's built-in Piper service
from pipecat.services.piper import PiperTTSService

tts = PiperTTSService(
    settings=PiperTTSService.Settings(
        voice="en_US-ryan-high",
    ),
)
```

---

## 📊 Performance Considerations

### From Context7 Documentation

**Metrics:**
```python
task = PipelineTask(
    pipeline,
    params=PipelineParams(
        enable_metrics=True,        # Enable performance metrics
        enable_usage_metrics=True,  # Enable usage tracking
    ),
)
```

**What's Tracked:**
- Frame processing time
- Pipeline latency
- Audio buffer size
- VAD detection accuracy
- STT/TTS latency

---

## 🎯 Next Steps for Implementation

### Day 3-4: Tracer Bullet

**Goal:** Minimal WebRTC connection working

**Steps:**
1. Create FastAPI WebSocket endpoint
2. Initialize FastAPIWebsocketTransport
3. Create minimal pipeline (no STT/LLM/TTS yet)
4. Test bidirectional audio streaming
5. Verify frames flow through pipeline

**Test:**
```python
async def test_webrtc_connection_establishes():
    # Connect WebSocket
    # Send audio frame
    # Receive audio frame
    # Assert connection works
```

### Day 5-6: VAD Integration

**Goal:** Silero VAD detects speech

**Steps:**
1. Initialize SileroVADAnalyzer with params
2. Integrate into user aggregator
3. Test speech detection
4. Verify callbacks trigger

### Day 7-8: Transcription Integration

**Goal:** Audio → Transcript

**Steps:**
1. Create FasterWhisperProcessor
2. Buffer audio during speech
3. Send to TranscriptionService
4. Return TranscriptionFrame

### Day 9-10: TTS Integration

**Goal:** Text → Audio

**Steps:**
1. Initialize PiperTTSService
2. Add to pipeline
3. Test text-to-speech conversion
4. Verify audio output

---

## 📚 Additional Resources

### Context7 Queries Used

1. **Query:** "How to build a voice AI pipeline with WebRTC transport, Silero VAD, Faster-Whisper STT, and Piper TTS?"
   - **Result:** Pipeline architecture, VAD integration, transport setup

2. **Query:** "How to use Faster-Whisper STT service and Piper TTS service in Pipecat?"
   - **Result:** Import paths, configuration examples

3. **Query:** "Piper TTS service configuration and usage in Pipecat pipeline"
   - **Result:** PiperTTSService initialization, voice models

### External Documentation

- Pipecat Docs: https://docs.pipecat.ai
- Pipecat GitHub: https://github.com/pipecat-ai/pipecat
- Piper Voices: https://huggingface.co/rhasspy/piper-voices
- Silero VAD: https://github.com/snakers4/silero-vad

---

## ✅ Validation Checklist

- [x] Correct import paths documented
- [x] Pipeline architecture understood
- [x] VAD integration pattern clear
- [x] TTS integration pattern clear
- [x] FastAPI WebSocket transport understood
- [x] LLM context management understood
- [x] Frame-based processing understood
- [x] Integration points identified
- [x] Performance considerations noted
- [x] Next steps planned

---

**Last Updated:** 2026-04-10  
**Source:** Context7 MCP Server (`/pipecat-ai/docs`)

