# Voice Assistant TDD Implementation Guide

> **Approach:** Test-Driven Development with System Architecture & React Best Practices  
> **Skills Applied:** TDD, System Architecture, Vercel React Best Practices  
> **Timeline:** 8 weeks  
> **Last Updated:** 2026-04-09

---

## 🎯 Core Principles

### From TDD Skill
- **Vertical slices**: One test → one implementation → repeat (NO horizontal slicing)
- **Test behavior, not implementation**: Tests verify through public interfaces
- **Red-Green-Refactor**: Write failing test → minimal code to pass → refactor
- **Integration-style tests**: Exercise real code paths, not mocked internals

### From System Architecture Skill
- **Appropriate complexity**: Match architecture to actual requirements
- **Clear boundaries**: Separate concerns that change for different reasons
- **Dependencies flow inward**: Core logic depends on nothing
- **Design for operations**: Every request needs a trace, every error needs context

### From Vercel React Best Practices
- **Eliminate waterfalls**: Parallel data fetching, early promise starts
- **Bundle optimization**: Direct imports, dynamic loading, defer third-party
- **Server-side performance**: React.cache(), minimize serialization
- **Re-render optimization**: Memo expensive work, use refs for transient values

---

## 📋 Architecture Overview

### System Constraints

**Scale:**
- Current: 0 users (new feature)
- Expected: 100-500 concurrent users (Year 1)
- Design for: 10x current = 5,000 concurrent users

**Team:**
- Size: 1-3 developers
- Structure: Full-stack (backend + frontend)
- Deployable units: 1 (monolith with voice layer)

**Lifespan:**
- Phase: MVP → Long-term product
- Timeline: 8 weeks to production
- Maintenance: Ongoing

**Change Vectors:**
- Voice models (STT/TTS) may change
- LLM provider may change
- UI components will evolve
- Backend search API is stable

### Architecture Decision

**Chosen: Well-structured monolith with voice layer**

**Rationale:**
- Team size (1-3) doesn't justify microservices
- Voice assistant is a feature, not a separate service
- Shared authentication, database, and search infrastructure
- Easier to debug and deploy as single unit

**Boundaries:**
```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  ┌────────────────────────────────────┐ │
│  │  Voice Interface Layer             │ │
│  │  - Components (UI)                 │ │
│  │  - Hooks (behavior)                │ │
│  │  - State (atoms)                   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  │
                  │ HTTP/WebRTC
                  ▼
┌─────────────────────────────────────────┐
│         Backend (FastAPI)               │
│  ┌────────────────────────────────────┐ │
│  │  Voice Service Layer               │ │
│  │  - Voice routes                    │ │
│  │  - Voice service                   │ │
│  │  - Tool handlers                   │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Existing SurfSense Core           │ │
│  │  - Search API                      │ │
│  │  - RAG pipeline                    │ │
│  │  - Auth                            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Boundaries:**

| Boundary | Reason | Change Rate |
|----------|--------|-------------|
| Voice Layer ↔ SurfSense Core | Voice features change frequently, core is stable | Voice: weekly, Core: monthly |
| Frontend ↔ Backend | Different deployment, different tech stack | Frontend: daily, Backend: weekly |
| STT/TTS ↔ Voice Service | Models may be swapped | Models: quarterly, Service: weekly |

**Trade-offs:**
- Chose monolith over microservices: Simpler deployment, easier debugging, sufficient for scale
- Accepted tight coupling to SurfSense: Faster development, shared infrastructure
- Chose WebRTC over simple HTTP: Lower latency, better UX, more complex setup

---

## 🔄 TDD Workflow Template

### For Each Feature

```
1. PLANNING
   - [ ] Confirm interface with user
   - [ ] List behaviors to test (prioritize)
   - [ ] Design for testability
   - [ ] Get approval

2. TRACER BULLET
   - [ ] Write ONE test for core behavior
   - [ ] RED: Test fails
   - [ ] GREEN: Minimal code to pass
   - [ ] Verify end-to-end path works

3. INCREMENTAL LOOP
   For each remaining behavior:
   - [ ] RED: Write test → fails
   - [ ] GREEN: Minimal code → passes
   - [ ] Verify: Test describes behavior, not implementation

4. REFACTOR
   - [ ] Extract duplication
   - [ ] Deepen modules (hide complexity)
   - [ ] Apply SOLID where natural
   - [ ] Run tests after each step
```


---

## 📦 Phase 1: Backend Voice Service (Week 1-2)

### Feature 1.1: Audio Transcription Service

#### Planning

**Interface:**
```python
# Public interface
async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio to text using Faster-Whisper."""
    pass
```

**Behaviors to test:**
1. Transcribes clear audio correctly
2. Handles empty audio
3. Handles corrupted audio
4. Returns text in <500ms

#### Tracer Bullet

**Test 1: Transcribes clear audio**
```
RED: Write test
- Create test audio file (5 seconds, "Hello world")
- Call transcribe_audio(audio_bytes)
- Assert result == "Hello world" (or close match)
- Test FAILS (function not implemented)

GREEN: Minimal implementation
- Import WhisperModel
- Load base model
- Transcribe audio
- Return text
- Test PASSES

Verify: Test uses public interface, tests behavior not implementation
```

#### Incremental Loop

**Test 2: Handles empty audio**
```
RED: Write test
- Call transcribe_audio(b"")
- Assert raises ValueError with clear message
- Test FAILS

GREEN: Add validation
- Check if audio_bytes is empty
- Raise ValueError("Audio data is empty")
- Test PASSES
```

**Test 3: Handles corrupted audio**
```
RED: Write test
- Call transcribe_audio(b"corrupted data")
- Assert raises AudioProcessingError
- Test FAILS

GREEN: Add error handling
- Wrap transcription in try-except
- Catch Whisper errors
- Raise AudioProcessingError with context
- Test PASSES
```

**Test 4: Performance requirement**
```
RED: Write test
- Transcribe 5-second audio
- Measure time
- Assert time < 0.5 seconds
- Test FAILS (too slow)

GREEN: Optimize
- Use smaller model if needed
- Enable GPU if available
- Cache model loading
- Test PASSES
```

#### Refactor

- [ ] Extract model loading to module level (avoid reload)
- [ ] Extract audio validation to separate function
- [ ] Add logging for debugging
- [ ] Run all tests → still pass

**Deliverable:** `app/services/audio_transcription_service.py` with tests

---

### Feature 1.2: Intent Understanding Service

#### Planning

**Interface:**
```python
# Public interface
async def understand_intent(text: str, context: dict) -> Intent:
    """Parse user input into structured intent."""
    pass

# Intent dataclass
@dataclass
class Intent:
    type: str  # "search", "summarize", "quiz", "follow_up"
    parameters: dict
    confidence: float
```

**Behaviors to test:**
1. Recognizes search intent
2. Recognizes summarize intent
3. Recognizes quiz intent
4. Recognizes follow-up intent
5. Extracts parameters correctly
6. Handles ambiguous input
7. Uses conversation context

#### Tracer Bullet

**Test 1: Recognizes search intent**
```
RED: Write test
- Call understand_intent("Search my notes for photosynthesis", {})
- Assert intent.type == "search"
- Assert intent.parameters["query"] == "photosynthesis"
- Test FAILS

GREEN: Minimal implementation
- Create system prompt for Gemma 4 E2B
- Call Ollama API
- Parse JSON response
- Return Intent object
- Test PASSES
```

#### Incremental Loop

**Test 2-4: Other intent types**
```
RED: Write tests for summarize, quiz, follow_up
GREEN: Enhance system prompt to handle all types
```

**Test 5: Parameter extraction**
```
RED: Write test
- "Summarize chapter 3 of biology book"
- Assert parameters["document"] contains "biology"
- Assert parameters["section"] == "chapter 3"
- Test FAILS

GREEN: Improve prompt engineering
- Add examples for parameter extraction
- Test PASSES
```

**Test 6: Ambiguous input**
```
RED: Write test
- "Tell me about that"
- Assert intent.type == "follow_up"
- Assert intent.confidence < 0.7
- Test FAILS

GREEN: Add confidence scoring
- Analyze LLM response quality
- Return confidence score
- Test PASSES
```

**Test 7: Context awareness**
```
RED: Write test
- Previous: search for "photosynthesis"
- Current: "Tell me more"
- Assert uses context to understand "more" refers to photosynthesis
- Test FAILS

GREEN: Add context to prompt
- Include conversation history
- Test PASSES
```

#### Refactor

- [ ] Extract Ollama client to separate module
- [ ] Extract prompt templates to config
- [ ] Add retry logic for API failures
- [ ] Run all tests → still pass

**Deliverable:** `app/services/intent_understanding_service.py` with tests

---

### Feature 1.3: Search Tool Handler

#### Planning

**Interface:**
```python
# Public interface
async def handle_search(
    query: str,
    filters: dict,
    user_id: str
) -> SearchResult:
    """Execute search and format results for voice."""
    pass

@dataclass
class SearchResult:
    results: list[dict]
    formatted_response: str
    citations: list[str]
```

**Behaviors to test:**
1. Calls SurfSense search API
2. Formats results naturally for voice
3. Includes citations
4. Handles no results
5. Handles API errors

#### Tracer Bullet

**Test 1: Calls search API and formats**
```
RED: Write test
- Mock SurfSense API response
- Call handle_search("photosynthesis", {}, "user123")
- Assert formatted_response contains natural language
- Assert citations included
- Test FAILS

GREEN: Minimal implementation
- Call SurfSense search endpoint
- Format results with Gemma 4 E2B
- Extract citations
- Return SearchResult
- Test PASSES
```

#### Incremental Loop

**Test 2: Natural voice formatting**
```
RED: Write test
- Verify response starts with "I found X results"
- Verify citations phrased naturally
- Test FAILS

GREEN: Improve formatting prompt
- Add voice-specific instructions
- Test PASSES
```

**Test 3: No results handling**
```
RED: Write test
- Mock empty search results
- Assert helpful message returned
- Test FAILS

GREEN: Add no-results branch
- Return "I didn't find any documents about..."
- Suggest alternatives
- Test PASSES
```

**Test 4: API error handling**
```
RED: Write test
- Mock API timeout
- Assert raises SearchError with context
- Test FAILS

GREEN: Add error handling
- Wrap API call in try-except
- Raise SearchError
- Test PASSES
```

#### Refactor

- [ ] Extract API client to separate module
- [ ] Extract formatting logic to separate function
- [ ] Add caching for frequent queries
- [ ] Run all tests → still pass

**Deliverable:** `app/services/voice_tools/search_tool.py` with tests

---

### Feature 1.4: Voice Route (Simple HTTP)

#### Planning

**Interface:**
```python
# Public API endpoint
POST /api/voice/search
Content-Type: multipart/form-data
Body: audio file

Response:
{
  "text": "transcribed text",
  "response": "formatted response",
  "audio_url": "/api/voice/audio/response.wav"
}
```

**Behaviors to test:**
1. Accepts audio upload
2. Returns transcribed text
3. Returns formatted response
4. Returns audio URL
5. Requires authentication
6. Rate limits requests

#### Tracer Bullet

**Test 1: End-to-end voice search**
```
RED: Write integration test
- Upload test audio file
- Assert 200 response
- Assert response contains text, response, audio_url
- Test FAILS

GREEN: Implement route
- Create FastAPI route
- Wire up transcription → intent → search → TTS
- Return response
- Test PASSES
```

#### Incremental Loop

**Test 2: Authentication required**
```
RED: Write test
- Call endpoint without auth token
- Assert 401 Unauthorized
- Test FAILS

GREEN: Add auth dependency
- Use existing FastAPI auth
- Test PASSES
```

**Test 3: Rate limiting**
```
RED: Write test
- Make 10 requests in 1 second
- Assert 429 Too Many Requests
- Test FAILS

GREEN: Add rate limiter
- Use slowapi
- Limit to 5 requests/minute
- Test PASSES
```

#### Refactor

- [ ] Extract pipeline logic to service
- [ ] Add request logging
- [ ] Add error tracking
- [ ] Run all tests → still pass

**Deliverable:** `app/routes/voice_routes.py` with integration tests

---

## 📱 Phase 2: Frontend Voice Interface (Week 3-4)

### Feature 2.1: VoiceRecorder Component

#### Planning

**Interface:**
```typescript
// Public interface
interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError: (error: Error) => void;
}

export function VoiceRecorder(props: VoiceRecorderProps): JSX.Element
```

**Behaviors to test:**
1. Requests microphone permission
2. Starts recording on button click
3. Stops recording after 5 seconds
4. Returns audio blob
5. Handles permission denied
6. Shows recording indicator

#### Tracer Bullet

**Test 1: Records and returns audio**
```
RED: Write test
- Render VoiceRecorder
- Mock MediaRecorder API
- Click record button
- Wait 5 seconds
- Assert onRecordingComplete called with Blob
- Test FAILS

GREEN: Minimal implementation
- Request microphone permission
- Create MediaRecorder
- Start recording
- Stop after 5 seconds
- Call onRecordingComplete
- Test PASSES
```

#### Incremental Loop

**Test 2: Permission handling**
```
RED: Write test
- Mock permission denied
- Assert onError called with PermissionError
- Test FAILS

GREEN: Add permission check
- Handle getUserMedia rejection
- Call onError
- Test PASSES
```

**Test 3: Visual feedback**
```
RED: Write test
- Start recording
- Assert recording indicator visible
- Stop recording
- Assert indicator hidden
- Test FAILS

GREEN: Add state management
- Use useState for recording state
- Render indicator conditionally
- Test PASSES
```

#### Refactor (Apply Vercel Best Practices)

- [ ] **rerender-memo**: Extract expensive audio processing to memoized component
- [ ] **rerender-use-ref-transient-values**: Use ref for recording state (updates frequently)
- [ ] **rendering-hoist-jsx**: Extract static button JSX outside component
- [ ] Run all tests → still pass

**Deliverable:** `components/voice/VoiceRecorder.tsx` with tests

---

### Feature 2.2: useVoiceRecording Hook

#### Planning

**Interface:**
```typescript
// Public interface
interface UseVoiceRecordingReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  isRecording: boolean;
  error: Error | null;
}

export function useVoiceRecording(): UseVoiceRecordingReturn
```

**Behaviors to test:**
1. Manages recording state
2. Returns audio blob on stop
3. Handles errors gracefully
4. Cleans up on unmount

#### Tracer Bullet

**Test 1: Start and stop recording**
```
RED: Write test
- Render hook with renderHook
- Call startRecording()
- Assert isRecording === true
- Call stopRecording()
- Assert returns Blob
- Assert isRecording === false
- Test FAILS

GREEN: Minimal implementation
- Use useState for recording state
- Use useRef for MediaRecorder
- Implement start/stop logic
- Test PASSES
```

#### Incremental Loop

**Test 2: Error handling**
```
RED: Write test
- Mock MediaRecorder error
- Call startRecording()
- Assert error state set
- Test FAILS

GREEN: Add try-catch
- Set error state on failure
- Test PASSES
```

**Test 3: Cleanup on unmount**
```
RED: Write test
- Start recording
- Unmount component
- Assert MediaRecorder stopped
- Test FAILS

GREEN: Add useEffect cleanup
- Stop recording on unmount
- Test PASSES
```

#### Refactor (Apply Vercel Best Practices)

- [ ] **rerender-functional-setstate**: Use functional setState for stable callbacks
- [ ] **rerender-dependencies**: Use primitive dependencies in useEffect
- [ ] **advanced-use-latest**: Use useLatest for stable callback refs
- [ ] Run all tests → still pass

**Deliverable:** `hooks/voice/use-voice-recording.ts` with tests

---

### Feature 2.3: Voice API Client

#### Planning

**Interface:**
```typescript
// Public interface
export class VoiceAPI {
  async sendAudio(audioBlob: Blob): Promise<VoiceResponse>;
  async getConversationHistory(sessionId: string): Promise<Turn[]>;
  async clearConversation(sessionId: string): Promise<void>;
}

interface VoiceResponse {
  text: string;
  response: string;
  audioUrl: string;
}
```

**Behaviors to test:**
1. Sends audio to backend
2. Returns parsed response
3. Handles network errors
4. Retries on failure
5. Includes auth token

#### Tracer Bullet

**Test 1: Sends audio and returns response**
```
RED: Write test
- Mock fetch API
- Create VoiceAPI instance
- Call sendAudio(mockBlob)
- Assert fetch called with correct endpoint
- Assert returns VoiceResponse
- Test FAILS

GREEN: Minimal implementation
- Create FormData with audio
- POST to /api/voice/search
- Parse JSON response
- Return VoiceResponse
- Test PASSES
```

#### Incremental Loop

**Test 2: Authentication**
```
RED: Write test
- Mock auth token
- Call sendAudio()
- Assert Authorization header included
- Test FAILS

GREEN: Add auth header
- Get token from storage
- Add to fetch headers
- Test PASSES
```

**Test 3: Error handling**
```
RED: Write test
- Mock 500 error
- Call sendAudio()
- Assert throws APIError
- Test FAILS

GREEN: Add error handling
- Check response.ok
- Throw APIError with details
- Test PASSES
```

**Test 4: Retry logic**
```
RED: Write test
- Mock timeout on first call
- Mock success on second call
- Assert retries and succeeds
- Test FAILS

GREEN: Add retry logic
- Use exponential backoff
- Max 3 retries
- Test PASSES
```

#### Refactor (Apply Vercel Best Practices)

- [ ] **async-parallel**: Use Promise.all() for independent operations
- [ ] **client-swr-dedup**: Consider using SWR for automatic deduplication
- [ ] **js-cache-function-results**: Cache API responses in module-level Map
- [ ] Run all tests → still pass

**Deliverable:** `lib/apis/voice/voice-api.ts` with tests

---

### Feature 2.4: VoiceInterface Component (Main)

#### Planning

**Interface:**
```typescript
// Public interface
export function VoiceInterface(): JSX.Element
```

**Behaviors to test:**
1. Renders recorder and player
2. Sends audio on recording complete
3. Plays response audio
4. Shows conversation history
5. Handles errors gracefully
6. Shows loading states

#### Tracer Bullet

**Test 1: End-to-end voice interaction**
```
RED: Write test
- Render VoiceInterface
- Simulate recording
- Assert audio sent to API
- Assert response displayed
- Assert audio played
- Test FAILS

GREEN: Minimal implementation
- Render VoiceRecorder
- Handle onRecordingComplete
- Call VoiceAPI.sendAudio()
- Render response
- Play audio
- Test PASSES
```

#### Incremental Loop

**Test 2: Loading states**
```
RED: Write test
- Start recording
- Assert "Processing..." shown
- Response received
- Assert loading hidden
- Test FAILS

GREEN: Add loading state
- Use useState for loading
- Show spinner during API call
- Test PASSES
```

**Test 3: Error handling**
```
RED: Write test
- Mock API error
- Assert error message shown
- Assert user can retry
- Test FAILS

GREEN: Add error state
- Show error message
- Add retry button
- Test PASSES
```

**Test 4: Conversation history**
```
RED: Write test
- Complete 3 interactions
- Assert all 3 shown in history
- Test FAILS

GREEN: Add history state
- Store turns in array
- Render ConversationHistory
- Test PASSES
```

#### Refactor (Apply Vercel Best Practices)

- [ ] **bundle-dynamic-imports**: Use next/dynamic for heavy components
- [ ] **rerender-memo**: Memo ConversationHistory (expensive render)
- [ ] **rerender-transitions**: Use startTransition for non-urgent updates
- [ ] **rendering-conditional-render**: Use ternary, not && for conditionals
- [ ] **server-serialization**: Minimize data passed to client components
- [ ] Run all tests → still pass

**Deliverable:** `components/voice/VoiceInterface.tsx` with tests

---

## 🔗 Phase 3: WebRTC Integration (Week 5-6)

### Feature 3.1: WebRTC Manager

#### Planning

**Interface:**
```typescript
// Public interface
export class WebRTCManager {
  async connect(sessionId: string): Promise<void>;
  async disconnect(): Promise<void>;
  onAudioReceived(callback: (audio: ArrayBuffer) => void): void;
  sendAudio(audio: ArrayBuffer): void;
  getConnectionState(): RTCPeerConnectionState;
}
```

**Behaviors to test:**
1. Establishes peer connection
2. Exchanges SDP offer/answer
3. Handles ICE candidates
4. Sends audio stream
5. Receives audio stream
6. Handles connection failures
7. Reconnects on disconnect

#### Tracer Bullet

**Test 1: Establishes connection**
```
RED: Write test
- Create WebRTCManager
- Call connect(sessionId)
- Assert peer connection created
- Assert connection state === "connected"
- Test FAILS

GREEN: Minimal implementation
- Create RTCPeerConnection
- Send offer to backend
- Receive answer
- Exchange ICE candidates
- Test PASSES
```

#### Incremental Loop

**Test 2-7: Other behaviors**
```
RED: Write tests for each behavior
GREEN: Implement each feature
```

#### Refactor

- [ ] Extract signaling logic to separate module
- [ ] Add connection monitoring
- [ ] Add automatic reconnection
- [ ] Run all tests → still pass

**Deliverable:** `lib/voice/webrtc-manager.ts` with tests

---

## 🎯 Phase 4: Advanced Features (Week 7-8)

### Feature 4.1: Quiz Mode

#### Planning

**Interface:**
```python
# Backend
async def generate_quiz(content: str, num_questions: int) -> Quiz
async def evaluate_answer(question: str, correct: str, user: str) -> Evaluation

# Frontend
export function QuizInterface(): JSX.Element
```

**Behaviors to test:**
1. Generates questions from content
2. Asks questions one by one
3. Evaluates answers
4. Tracks score
5. Provides feedback
6. Completes quiz

#### Tracer Bullet

**Test 1: End-to-end quiz flow**
```
RED: Write integration test
- Start quiz on topic
- Answer all questions
- Assert score calculated
- Test FAILS

GREEN: Implement quiz flow
- Generate questions (backend)
- Quiz UI (frontend)
- Answer evaluation (backend)
- Score tracking (frontend)
- Test PASSES
```

#### Incremental Loop

**Test 2-6: Individual behaviors**
```
RED: Write tests for each behavior
GREEN: Implement each feature
```

#### Refactor

- [ ] Extract quiz state management
- [ ] Add quiz persistence
- [ ] Optimize question generation
- [ ] Run all tests → still pass

**Deliverable:** Quiz feature with full test coverage

---

## ✅ Success Criteria

### Test Coverage
- [ ] Backend: >80% coverage
- [ ] Frontend: >70% coverage
- [ ] Integration tests: All critical paths covered

### Performance
- [ ] End-to-end latency <2.5s
- [ ] STT accuracy >95%
- [ ] Intent recognition >90%
- [ ] Bundle size <500KB (initial load)

### Code Quality
- [ ] All tests pass
- [ ] No console errors
- [ ] Accessibility audit passes
- [ ] Performance audit passes

### Architecture
- [ ] Can draw on whiteboard
- [ ] New developer understands in 30 minutes
- [ ] Adding feature touches 1-3 modules
- [ ] Can trace request in minutes

---

## 📝 Notes

### TDD Reminders
- ❌ **DON'T**: Write all tests first (horizontal slicing)
- ✅ **DO**: One test → one implementation → repeat (vertical slicing)
- ❌ **DON'T**: Test implementation details
- ✅ **DO**: Test behavior through public interfaces
- ❌ **DON'T**: Mock internal collaborators
- ✅ **DO**: Use integration-style tests

### Architecture Reminders
- ❌ **DON'T**: Over-engineer for imagined scale
- ✅ **DO**: Design for 10x current, not 1000x
- ❌ **DON'T**: Add complexity without evidence
- ✅ **DO**: Run complexity checklist before adding patterns
- ❌ **DON'T**: Create boundaries without reason
- ✅ **DO**: Separate concerns that change at different rates

### React Best Practices Reminders
- ✅ **DO**: Eliminate waterfalls (parallel fetching)
- ✅ **DO**: Optimize bundle (direct imports, dynamic loading)
- ✅ **DO**: Memo expensive work
- ✅ **DO**: Use refs for transient values
- ❌ **DON'T**: Premature optimization
- ❌ **DON'T**: Over-use memo for simple primitives

---

## 🚀 Getting Started

1. **Read this guide completely**
2. **Set up development environment** (see README.md)
3. **Start with Feature 1.1** (Audio Transcription)
4. **Follow TDD workflow** for each feature
5. **Refactor after GREEN** (never while RED)
6. **Run all tests** before moving to next feature
7. **Review architecture** at end of each phase

---

**Remember:** We're building independence for visually impaired users. Every test matters. Every refactor matters. Build it right. 🚀
