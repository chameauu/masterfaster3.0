# Voice Assistant Implementation Plan

> **Always-Listening Voice Interface for Visually Impaired Users**  
> **Following .kiro skills: TDD, Python Patterns, System Architecture, React Best Practices**  
> **Date:** 2026-04-09  
> **Updated:** 2026-04-09 (Phase 2 Revision)

---

## 🎯 Project Vision (UPDATED)

Build an always-listening voice interface integrated into the main dashboard where visually impaired users can:
- **Speak naturally** - System detects voice automatically (no button press needed)
- **Instant transcription** - Audio converted to text in real-time
- **Seamless chat integration** - Transcribed text sent directly to existing chat as a prompt
- **Hands-free operation** - Complete interaction without touching keyboard or mouse
- **Accessible by default** - Voice is the primary interface, not an add-on

### Key Changes from Original Plan
- ❌ **No separate `/voice` page** - Voice integrated into dashboard
- ✅ **Always-listening mode** - Continuous voice activity detection
- ✅ **Direct chat integration** - Transcription → Chat prompt (not separate search)
- ✅ **Simpler UX** - One interface for everything (chat handles all intents)

---

## 🏗️ Architecture Decision (System Architecture Skill)

### Chosen Architecture: Well-Structured Monolith

**Why NOT microservices:**
- Team size: 1-3 developers
- Shared infrastructure (database, auth, search)
- Easier debugging at 3am
- Voice layer is a feature, not a separate service

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│              SurfSense Monolith (FastAPI)               │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Voice Feature Layer (NEW)                     │   │
│  │  - Audio transcription (Faster-Whisper)        │   │
│  │  - Intent understanding (existing LLM router)  │   │
│  │  - Voice tools (search, summarize, quiz)       │   │
│  │  - TTS (Piper)                                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Existing SurfSense Core (REUSE 100%)          │   │
│  │  - Search API + RAG pipeline                   │   │
│  │  - Document processing                         │   │
│  │  - Auth & user management                      │   │
│  │  - Database (PostgreSQL + pgvector)            │   │
│  │  - Connectors (Gmail, Drive, Slack, etc.)     │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Key Boundaries:**
| Boundary | Reason | Change Rate |
|----------|--------|-------------|
| Voice layer ↔ Core | Different interface (audio vs HTTP) | Voice: high, Core: stable |
| Frontend ↔ Backend | Network boundary | Independent deployment |

**Complexity Justification:**
- ✅ Tried simple solution: Reusing existing SurfSense APIs
- ✅ Have evidence: Voice needs audio processing (STT/TTS)
- ✅ Team can operate: Standard FastAPI patterns
- ✅ Makes sense in 6 months: Clear feature boundary

---

## 🐍 Backend Implementation (Python Patterns Skill)

### Framework Selection

**Chosen: FastAPI (already in SurfSense)**

**Why FastAPI:**
- ✅ API-first (voice is an API consumer)
- ✅ Native async support (I/O-bound: audio, database, LLM)
- ✅ Already in use (consistency)
- ✅ Pydantic validation (audio file validation)

### Async Strategy

**Use async for:**
- Audio transcription (I/O-bound: waiting for Whisper)
- LLM calls (I/O-bound: waiting for inference)
- Database queries (I/O-bound: waiting for PostgreSQL)
- Search API calls (I/O-bound: waiting for SurfSense)

**Use sync for:**
- Audio format conversion (CPU-bound)
- Audio validation (CPU-bound)

### Type Hints Strategy

```python
# Always type public APIs
async def transcribe_audio(
    audio_data: bytes,
    language: str = "en"
) -> TranscriptionResult:
    """Transcribe audio to text using Faster-Whisper."""
    ...

# Pydantic for validation
class VoiceSearchRequest(BaseModel):
    audio: bytes
    user_id: UUID
    session_id: Optional[UUID] = None

class VoiceSearchResponse(BaseModel):
    transcript: str
    results: list[SearchResult]
    audio_response: bytes
```

### Project Structure

```
backend/
├── app/
│   ├── services/
│   │   ├── voice/                    # NEW: Voice services
│   │   │   ├── __init__.py
│   │   │   ├── transcription.py     # Faster-Whisper
│   │   │   ├── intent.py            # Intent understanding
│   │   │   ├── tts.py               # Piper TTS
│   │   │   └── tools/               # Voice tools
│   │   │       ├── search.py
│   │   │       ├── summarize.py
│   │   │       └── quiz.py
│   │   └── (existing services)      # REUSE
│   │
│   ├── routes/
│   │   ├── voice_routes.py          # NEW: Voice endpoints
│   │   └── (existing routes)        # REUSE
│   │
│   ├── schemas/
│   │   ├── voice.py                 # NEW: Voice Pydantic models
│   │   └── (existing schemas)       # REUSE
│   │
│   └── (existing structure)         # REUSE
│
└── tests/
    ├── unit/
    │   └── voice/                   # NEW: Voice unit tests
    └── integration/
        └── voice/                   # NEW: Voice integration tests
```

---

## ⚛️ Frontend Implementation (React Best Practices Skill)

### Performance Optimization Strategy

**Critical Optimizations (from Vercel best practices):**

1. **Bundle Size** (`bundle-*` rules)
   - Use `next/dynamic` for VoiceInterface (heavy component)
   - Defer audio processing libraries until needed
   - Import directly, avoid barrel files

2. **Re-render Optimization** (`rerender-*` rules)
   - Memo VoiceRecorder (expensive audio processing)
   - Use refs for transient audio state
   - Functional setState for stable callbacks

3. **Rendering Performance** (`rendering-*` rules)
   - Hoist static JSX (icons, labels)
   - Use Activity component for show/hide
   - Suppress hydration warnings for client-only audio

### Component Structure

```tsx
// Use next/dynamic for heavy components (bundle-dynamic-imports)
const VoiceInterface = dynamic(
  () => import('@/components/voice/VoiceInterface'),
  { ssr: false, loading: () => <VoiceLoading /> }
);

// Memo expensive components (rerender-memo)
const VoiceRecorder = memo(function VoiceRecorder({ onRecordingComplete }) {
  // Use refs for transient values (rerender-use-ref-transient-values)
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Functional setState for stable callbacks (rerender-functional-setstate)
  const [isRecording, setIsRecording] = useState(false);
  const startRecording = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);
  
  // ... implementation
});

// Hoist static JSX (rendering-hoist-jsx)
const MICROPHONE_ICON = <Mic className="size-6" />;

function VoiceControls() {
  return (
    <Button>
      {MICROPHONE_ICON}
      Start Recording
    </Button>
  );
}
```

### State Management

```typescript
// atoms/voice/voice-session.atom.ts
export const voiceSessionAtom = atom<VoiceSession | null>(null);

// Derived state during render (rerender-derived-state-no-effect)
export const isRecordingAtom = atom(
  (get) => get(voiceSessionAtom)?.status === 'recording'
);

// Don't subscribe to state only used in callbacks (rerender-defer-reads)
function VoiceInterface() {
  const session = useAtomValue(voiceSessionAtom);
  
  // BAD: Subscribes to entire session
  // const handleStop = () => stopRecording(session.id);
  
  // GOOD: Read session only when needed
  const handleStop = useCallback(() => {
    const currentSession = voiceSessionAtom.read();
    stopRecording(currentSession.id);
  }, []);
}
```

---

## 🧪 TDD Implementation (TDD Skill)

### Workflow: Red-Green-Refactor

**CRITICAL: Vertical slicing, NOT horizontal**

```
❌ WRONG (horizontal):
  Write all tests → Write all implementation

✅ RIGHT (vertical - tracer bullets):
  Test 1 → Impl 1 → Test 2 → Impl 2 → Test 3 → Impl 3
```

### Phase 1: Backend Voice Service (Week 1-2)

#### Day 1-2: Audio Transcription Service

**Planning:**
- [ ] Confirm interface: `transcribe_audio(audio_data: bytes) -> str`
- [ ] Confirm behaviors to test:
  1. Transcribe clear audio
  2. Handle empty audio
  3. Handle corrupted audio
  4. Performance <500ms

**Tracer Bullet (Test 1):**
```python
# tests/unit/voice/test_transcription.py

def test_transcribe_clear_audio():
    """RED: Test transcribing clear audio."""
    # Arrange
    audio_data = load_test_audio("clear_speech.wav")
    service = TranscriptionService()
    
    # Act
    result = service.transcribe(audio_data)
    
    # Assert
    assert result.text == "search my notes for photosynthesis"
    assert result.confidence > 0.9
```

**Implementation (GREEN):**
```python
# app/services/voice/transcription.py

from faster_whisper import WhisperModel
from pydantic import BaseModel

class TranscriptionResult(BaseModel):
    text: str
    confidence: float

class TranscriptionService:
    def __init__(self):
        self.model = WhisperModel("base", device="cpu")
    
    def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        # Minimal code to pass test
        segments, info = self.model.transcribe(audio_data)
        text = " ".join([seg.text for seg in segments])
        confidence = info.language_probability
        return TranscriptionResult(text=text, confidence=confidence)
```

**Incremental Loop (Tests 2-4):**
```python
# RED: Test 2
def test_transcribe_empty_audio():
    """Handle empty audio gracefully."""
    service = TranscriptionService()
    with pytest.raises(ValueError, match="Audio data is empty"):
        service.transcribe(b"")

# GREEN: Add validation
def transcribe(self, audio_data: bytes) -> TranscriptionResult:
    if not audio_data:
        raise ValueError("Audio data is empty")
    # ... rest of implementation

# RED: Test 3
def test_transcribe_corrupted_audio():
    """Handle corrupted audio gracefully."""
    service = TranscriptionService()
    with pytest.raises(AudioProcessingError):
        service.transcribe(b"corrupted data")

# GREEN: Add error handling
def transcribe(self, audio_data: bytes) -> TranscriptionResult:
    if not audio_data:
        raise ValueError("Audio data is empty")
    try:
        segments, info = self.model.transcribe(audio_data)
        # ... rest
    except Exception as e:
        raise AudioProcessingError(f"Failed to transcribe: {e}")

# RED: Test 4
def test_transcribe_performance():
    """Transcription completes in <500ms."""
    audio_data = load_test_audio("clear_speech.wav")
    service = TranscriptionService()
    
    start = time.time()
    service.transcribe(audio_data)
    duration = time.time() - start
    
    assert duration < 0.5, f"Took {duration}s, expected <0.5s"

# GREEN: Optimize (if needed)
# - Use smaller model
# - Enable GPU
# - Cache model loading
```

**Refactor:**
```python
# Extract model loading
class TranscriptionService:
    _model: Optional[WhisperModel] = None
    
    @classmethod
    def get_model(cls) -> WhisperModel:
        if cls._model is None:
            cls._model = WhisperModel("base", device="cpu")
        return cls._model
    
    def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        # Validation
        if not audio_data:
            raise ValueError("Audio data is empty")
        
        # Transcription
        try:
            model = self.get_model()
            segments, info = model.transcribe(audio_data)
            text = " ".join([seg.text for seg in segments])
            confidence = info.language_probability
            return TranscriptionResult(text=text, confidence=confidence)
        except Exception as e:
            raise AudioProcessingError(f"Failed to transcribe: {e}")
```

**Checklist:**
- [x] Test describes behavior (transcribe audio)
- [x] Test uses public interface (transcribe method)
- [x] Test would survive refactor (doesn't test internals)
- [x] Code is minimal for tests
- [x] No speculative features

---

#### Day 3-5: Intent Understanding Service

**Planning:**
- [ ] Confirm interface: `understand_intent(text: str, context: dict) -> Intent`
- [ ] Confirm behaviors:
  1. Recognize search intent
  2. Recognize summarize intent
  3. Recognize quiz intent
  4. Extract parameters
  5. Handle ambiguous input

**Tracer Bullet:**
```python
# tests/unit/voice/test_intent.py

def test_recognize_search_intent():
    """RED: Recognize search intent from text."""
    service = IntentService()
    
    result = service.understand("search my notes for photosynthesis")
    
    assert result.intent_type == IntentType.SEARCH
    assert result.parameters["query"] == "photosynthesis"
    assert result.parameters["filters"] == {"type": "notes"}
```

**Implementation:**
```python
# app/services/voice/intent.py

from enum import Enum
from pydantic import BaseModel

class IntentType(str, Enum):
    SEARCH = "search"
    SUMMARIZE = "summarize"
    QUIZ = "quiz"
    FOLLOW_UP = "follow_up"

class Intent(BaseModel):
    intent_type: IntentType
    parameters: dict
    confidence: float

class IntentService:
    def __init__(self):
        # Use existing LLM router from SurfSense
        from app.services.llm_router_service import get_llm_router
        self.llm = get_llm_router()
    
    def understand(self, text: str, context: dict = None) -> Intent:
        # Use LLM with structured output
        prompt = self._build_prompt(text, context)
        response = self.llm.chat(prompt, response_format="json")
        
        # Parse response
        data = json.loads(response)
        return Intent(
            intent_type=IntentType(data["intent"]),
            parameters=data["parameters"],
            confidence=data["confidence"]
        )
    
    def _build_prompt(self, text: str, context: dict = None) -> str:
        return f"""
        Analyze this voice command and extract the intent and parameters.
        
        Command: {text}
        Context: {context or {}}
        
        Return JSON:
        {{
          "intent": "search|summarize|quiz|follow_up",
          "parameters": {{}},
          "confidence": 0.0-1.0
        }}
        """
```

**Continue with Tests 2-5...**

---

#### Day 6-8: Search Tool Handler

**Planning:**
- [ ] Confirm interface: `handle_search(query: str, filters: dict, user_id: UUID) -> SearchResult`
- [ ] Confirm behaviors:
  1. Call SurfSense search API
  2. Format results for voice
  3. Include citations
  4. Handle no results
  5. Handle API errors

**Tracer Bullet:**
```python
# tests/unit/voice/test_search_tool.py

@pytest.mark.asyncio
async def test_search_documents():
    """RED: Search documents via SurfSense API."""
    tool = SearchTool()
    
    result = await tool.handle_search(
        query="photosynthesis",
        filters={"type": "notes"},
        user_id=UUID("...")
    )
    
    assert len(result.chunks) > 0
    assert "photosynthesis" in result.chunks[0].content.lower()
    assert result.chunks[0].source is not None
```

**Implementation:**
```python
# app/services/voice/tools/search.py

from app.retriever.chunks_hybrid_search import search_chunks  # REUSE existing!

class SearchTool:
    async def handle_search(
        self,
        query: str,
        filters: dict,
        user_id: UUID
    ) -> SearchResult:
        # Call existing SurfSense search
        chunks = await search_chunks(
            query=query,
            user_id=user_id,
            filters=filters,
            limit=5
        )
        
        # Format for voice
        formatted = self._format_for_voice(chunks)
        
        return SearchResult(
            chunks=chunks,
            voice_response=formatted
        )
    
    def _format_for_voice(self, chunks: list) -> str:
        if not chunks:
            return "I didn't find any documents matching that search."
        
        # Natural language formatting
        response = f"I found {len(chunks)} results. "
        
        for i, chunk in enumerate(chunks[:3], 1):
            source = chunk.document.title
            date = chunk.document.created_at.strftime("%B %d")
            response += f"From your {source} on {date}: {chunk.content[:200]}... "
        
        return response
```

---

#### Day 9-10: Voice Route (End-to-End)

**Planning:**
- [ ] Confirm interface: `POST /api/voice/search` with audio file
- [ ] Confirm behaviors:
  1. Accept audio upload
  2. Transcribe → Understand → Search → Format → TTS
  3. Return audio response
  4. Require authentication
  5. Rate limiting

**Tracer Bullet:**
```python
# tests/integration/voice/test_voice_routes.py

@pytest.mark.asyncio
async def test_voice_search_end_to_end(client, auth_headers):
    """RED: Complete voice search flow."""
    # Arrange
    audio_file = load_test_audio("search_photosynthesis.wav")
    
    # Act
    response = await client.post(
        "/api/voice/search",
        files={"audio": audio_file},
        headers=auth_headers
    )
    
    # Assert
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert len(response.content) > 0  # Has audio response
```

**Implementation:**
```python
# app/routes/voice_routes.py

from fastapi import APIRouter, UploadFile, Depends
from app.users import current_active_user
from app.services.voice.transcription import TranscriptionService
from app.services.voice.intent import IntentService
from app.services.voice.tools.search import SearchTool
from app.services.voice.tts import TTSService

router = APIRouter(prefix="/api/voice", tags=["voice"])

@router.post("/search")
async def voice_search(
    audio: UploadFile,
    user = Depends(current_active_user)
):
    # 1. Transcribe
    audio_data = await audio.read()
    transcription = TranscriptionService().transcribe(audio_data)
    
    # 2. Understand intent
    intent = IntentService().understand(transcription.text)
    
    # 3. Execute search
    search_tool = SearchTool()
    result = await search_tool.handle_search(
        query=intent.parameters["query"],
        filters=intent.parameters.get("filters", {}),
        user_id=user.id
    )
    
    # 4. Generate TTS
    tts = TTSService()
    audio_response = tts.synthesize(result.voice_response)
    
    # 5. Return audio
    return Response(
        content=audio_response,
        media_type="audio/wav"
    )
```

---

### Phase 2: Frontend Voice Interface (Week 3-4)

#### Day 11-12: State Management

**Planning:**
- [ ] Confirm atoms needed:
  - voiceSessionAtom
  - voiceConversationAtom
  - voiceSettingsAtom
  - voiceUIAtom

**Tracer Bullet:**
```typescript
// tests/atoms/voice/voice-session.test.ts

describe('voiceSessionAtom', () => {
  it('starts with null session', () => {
    // RED
    const session = voiceSessionAtom.read();
    expect(session).toBeNull();
  });
  
  it('creates new session', () => {
    // RED
    const newSession = createVoiceSession(userId);
    voiceSessionAtom.write(newSession);
    
    const session = voiceSessionAtom.read();
    expect(session).not.toBeNull();
    expect(session.userId).toBe(userId);
  });
});
```

**Implementation:**
```typescript
// atoms/voice/voice-session.atom.ts

import { atom } from 'jotai';

export interface VoiceSession {
  id: string;
  userId: string;
  status: 'idle' | 'recording' | 'processing' | 'playing';
  startedAt: Date;
}

export const voiceSessionAtom = atom<VoiceSession | null>(null);

// Derived atoms (rerender-derived-state)
export const isRecordingAtom = atom(
  (get) => get(voiceSessionAtom)?.status === 'recording'
);

export const isProcessingAtom = atom(
  (get) => get(voiceSessionAtom)?.status === 'processing'
);
```

---

#### Day 13-16: VoiceRecorder Component

**Planning:**
- [ ] Confirm interface: `<VoiceRecorder onRecordingComplete={(audio) => ...} />`
- [ ] Confirm behaviors:
  1. Request microphone permission
  2. Start/stop recording
  3. Visual feedback
  4. Error handling

**Tracer Bullet:**
```typescript
// tests/components/voice/VoiceRecorder.test.tsx

describe('VoiceRecorder', () => {
  it('requests microphone permission on mount', async () => {
    // RED
    const mockGetUserMedia = vi.fn();
    global.navigator.mediaDevices.getUserMedia = mockGetUserMedia;
    
    render(<VoiceRecorder onRecordingComplete={vi.fn()} />);
    
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });
});
```

**Implementation:**
```typescript
// components/voice/VoiceRecorder.tsx

import { memo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

// Memo expensive component (rerender-memo)
export const VoiceRecorder = memo(function VoiceRecorder({
  onRecordingComplete
}: {
  onRecordingComplete: (audio: Blob) => void;
}) {
  // Use refs for transient values (rerender-use-ref-transient-values)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Functional setState (rerender-functional-setstate)
  const [isRecording, setIsRecording] = useState(false);
  
  // Request permission on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        // Setup event handlers...
      })
      .catch(error => {
        console.error('Microphone permission denied:', error);
      });
  }, []);
  
  const startRecording = useCallback(() => {
    setIsRecording(true);
    audioChunksRef.current = [];
    mediaRecorderRef.current?.start();
  }, []);
  
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  }, []);
  
  return (
    <div>
      <Button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Start'} Recording
      </Button>
    </div>
  );
});
```

---

## 📦 Phase 2: Frontend Voice Interface (Week 3-4) - REVISED

### New Approach: Always-Listening Dashboard Integration

**Goal**: Integrate voice detection into the main dashboard chat interface

**Key Components**:
1. **Voice Activity Detection (VAD)** - Detect when user starts speaking
2. **Continuous Audio Capture** - Record audio while user is speaking
3. **Auto-transcription** - Send audio to backend when user stops speaking
4. **Chat Integration** - Insert transcribed text into chat input
5. **Visual Feedback** - Show recording/processing status

### Day 11-14: Voice Activity Detection (VAD)

**Objective**: Detect when user starts/stops speaking automatically

**Implementation**:
```typescript
// hooks/use-voice-activity-detection.ts
export function useVoiceActivityDetection() {
  // Use Web Audio API to analyze audio levels
  // Detect speech start (audio level > threshold)
  // Detect speech end (silence > 1.5 seconds)
  // Return: isListening, isSpeaking, audioLevel
}
```

**Features**:
- Microphone permission handling
- Audio level analysis (detect speech vs silence)
- Configurable thresholds (sensitivity adjustment)
- Visual feedback (audio level indicator)

**Tests**:
- Permission granted → Start listening
- Audio level > threshold → Detect speech start
- Silence > 1.5s → Detect speech end
- Permission denied → Show error

---

### Day 15-18: Continuous Audio Recording

**Objective**: Record audio while user is speaking

**Implementation**:
```typescript
// hooks/use-continuous-recording.ts
export function useContinuousRecording() {
  // Start recording when speech detected
  // Stop recording when silence detected
  // Return audio blob
}
```

**Features**:
- MediaRecorder API integration
- Automatic start/stop based on VAD
- Audio format: WebM (browser native)
- Buffer management (prevent memory leaks)

**Tests**:
- Speech detected → Start recording
- Silence detected → Stop recording
- Recording stopped → Return audio blob
- Multiple recordings → Clean up previous blobs

---

### Day 19-22: Auto-Transcription Service

**Objective**: Automatically transcribe audio and insert into chat

**Implementation**:
```typescript
// hooks/use-auto-transcription.ts
export function useAutoTranscription() {
  // When audio blob ready → Send to backend
  // Backend transcribes → Return text
  // Insert text into chat input
}
```

**Features**:
- Automatic API call when recording stops
- Error handling (retry logic)
- Loading states (transcribing indicator)
- Text insertion into chat composer

**Integration Points**:
- Use existing `/api/v1/voice/search` endpoint (just for transcription)
- Or create new `/api/v1/voice/transcribe` endpoint (simpler)
- Insert text into existing chat input field
- Trigger chat submission automatically (optional)

---

### Day 23-25: Dashboard Integration

**Objective**: Add voice controls to dashboard chat interface

**Implementation**:
```typescript
// components/voice/VoiceToggle.tsx
export function VoiceToggle() {
  // Toggle button: Enable/Disable voice
  // Visual indicator: Listening, Speaking, Processing
  // Settings: Sensitivity, auto-submit
}
```

**UI Components**:
1. **Voice Toggle Button** (top-right of chat)
   - Click to enable/disable always-listening
   - Icon changes: Mic (off) → Mic + pulse (listening) → Mic + wave (speaking)

2. **Status Indicator** (subtle, non-intrusive)
   - "Listening..." (when VAD active)
   - "Recording..." (when speech detected)
   - "Transcribing..." (when processing)

3. **Settings Panel** (optional)
   - Sensitivity slider (VAD threshold)
   - Auto-submit toggle (send immediately vs insert only)
   - Language selection

**Integration**:
- Add to `new-chat/[[...chat_id]]/page.tsx`
- Use existing chat state (messages, onNew)
- Minimal UI changes (just add toggle button)

---

## 🔄 Updated Architecture

### Frontend Flow (Revised)

```
User speaks
    ↓
VAD detects speech start
    ↓
Start recording (MediaRecorder)
    ↓
User stops speaking
    ↓
VAD detects silence (1.5s)
    ↓
Stop recording → Audio blob
    ↓
Send to backend /api/v1/voice/transcribe
    ↓
Backend: Faster-Whisper → Text
    ↓
Frontend: Insert text into chat input
    ↓
(Optional) Auto-submit to chat
    ↓
Existing chat flow handles the rest
```

### Backend Changes (Minimal)

**Option A: Reuse existing endpoint**
- Use `/api/v1/voice/search` but ignore intent/search
- Just return transcript

**Option B: New transcription-only endpoint** (Recommended)
```python
@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile):
    """Simple transcription endpoint - no intent, no search."""
    audio_data = await audio.read()
    service = TranscriptionService()
    result = service.transcribe(audio_data)
    return {"transcript": result.text}
```

---

## 📋 Updated Implementation Checklist

### Week 3-4: Always-Listening Voice Interface

- [x] Day 11-14: Voice Activity Detection (VAD)
  - [x] Web Audio API integration
  - [x] Speech detection algorithm
  - [x] Silence detection (1.5s threshold)
  - [x] Visual feedback (audio level)
  
- [x] Day 15-18: Continuous Audio Recording
  - [x] MediaRecorder integration
  - [x] Auto start/stop based on VAD
  - [x] Audio blob management
  - [x] Memory cleanup
  
- [x] Day 19-22: Auto-Transcription Service
  - [x] Backend endpoint (transcribe-only)
  - [x] Frontend API client
  - [x] Error handling & retry
  - [x] Chat input integration
  
- [x] Day 23-25: Dashboard Integration
  - [x] Voice toggle button
  - [x] Status indicators
  - [x] Integrated into chat composer
  - [x] Visual feedback (pulse, audio level)

### Week 5-6: Polish & Enhancement (TODO)

- [ ] Day 26-28: TTS Integration
  - [ ] Web Speech API for responses
  - [ ] Or backend Piper TTS
  - [ ] Audio playback controls
  
- [ ] Day 29-30: Settings & Preferences
  - [ ] Sensitivity adjustment
  - [ ] Auto-submit toggle
  - [ ] Language selection
  - [ ] Keyboard shortcuts (Space to toggle)
  
- [ ] Day 31-36: Testing & Refinement
  - [ ] User testing with visually impaired users
  - [ ] Performance optimization
  - [ ] Error handling improvements
  - [ ] Documentation

---

## 🎯 Success Criteria (Updated)

### Technical Metrics
- [ ] VAD accuracy: >95% (detect speech start/stop correctly)
- [ ] Transcription latency: <2s (from speech end to text)
- [ ] False positive rate: <5% (don't trigger on background noise)
- [ ] Memory usage: <50MB (continuous listening)
- [ ] Battery impact: Minimal (efficient audio processing)

### User Experience
- [ ] Hands-free operation: 100% voice-controlled
- [ ] Natural interaction: No button presses needed
- [ ] Fast response: Transcription feels instant
- [ ] Reliable: Works in various noise environments
- [ ] Accessible: Clear audio/visual feedback

### Integration
- [ ] Seamless: Feels like native chat feature
- [ ] Non-intrusive: Easy to enable/disable
- [ ] Compatible: Works with existing chat features
- [ ] Performant: No impact on chat performance

---

## 🔧 Technical Decisions

### Why Always-Listening?
- **Accessibility**: Visually impaired users can't easily find/click buttons
- **Natural**: Mimics human conversation (no "push to talk")
- **Efficient**: Faster than typing for many users
- **Inclusive**: Makes the app usable for more people

### Why Integrate into Chat?
- **Simplicity**: One interface for everything
- **Reuse**: Leverage existing chat infrastructure
- **Consistency**: Same experience for voice and text users
- **Maintainability**: Less code to maintain

### Why VAD Instead of Push-to-Talk?
- **Hands-free**: No button press needed
- **Accessible**: Works for users who can't see buttons
- **Natural**: More like human conversation
- **Efficient**: Faster interaction flow

---

## 🚀 Next Steps (Immediate)

1. **Create transcription-only endpoint** (Backend)
   ```python
   # app/routes/voice_routes.py
   @router.post("/transcribe")
   async def transcribe_audio(audio: UploadFile):
       # Simple transcription, no intent/search
   ```

2. **Build VAD hook** (Frontend)
   ```typescript
   // hooks/use-voice-activity-detection.ts
   export function useVoiceActivityDetection()
   ```

3. **Add voice toggle to chat** (Frontend)
   ```typescript
   // In new-chat page, add VoiceToggle component
   ```

4. **Test end-to-end flow**
   - Enable voice → Speak → See text in chat input

---

## 📝 Notes

### Advantages of New Approach
- ✅ Simpler architecture (no separate page)
- ✅ Better UX (integrated into main workflow)
- ✅ More accessible (always available)
- ✅ Easier to maintain (less code)
- ✅ Reuses existing chat infrastructure

### Challenges to Address
- ⚠️ Battery usage (continuous microphone access)
- ⚠️ Privacy concerns (always listening)
- ⚠️ Background noise (false positives)
- ⚠️ Browser compatibility (Web Audio API)

### Mitigation Strategies
- 🔧 Efficient VAD algorithm (low CPU usage)
- 🔧 Clear on/off toggle (user control)
- 🔧 Adjustable sensitivity (noise filtering)
- 🔧 Fallback to manual recording (if VAD fails)

---

**Status**: Phase 1 Complete ✅ | Phase 2 Revised (Always-Listening) 🚀
