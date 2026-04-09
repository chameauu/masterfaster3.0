# Voice Assistant Backend Integration Guide

## Overview

This document describes what exists in the SurfSense backend that we can leverage, and what new components we need to add for the voice assistant feature.

---

## Existing Backend Infrastructure

### Core Framework

**FastAPI Application:**
- Async/await support throughout
- Automatic API documentation (OpenAPI/Swagger)
- Request validation with Pydantic
- Dependency injection system
- Middleware support
- WebSocket support (available but not heavily used)

**Location:** `surfsense_backend/app/app.py`

**Key Features:**
- CORS configuration
- Rate limiting
- Request performance monitoring
- Error handling middleware
- Authentication middleware

---

### Database & Storage

**PostgreSQL + pgvector:**
- User accounts and profiles
- Documents metadata
- Document chunks
- Vector embeddings (1536 dimensions)
- Connector configurations
- Chat sessions
- Notifications

**Redis:**
- Session storage
- Rate limiting data
- Cache for frequent queries
- Celery task queue

**Elasticsearch:**
- Full-text search index
- Document content
- Metadata search
- Faceted search

**Alembic Migrations:**
- 122+ migration files
- Schema versioning
- Database evolution tracking

---

### Authentication & Authorization

**Existing Auth System:**
- FastAPI Users framework
- JWT token-based authentication
- OAuth2 support (Google, GitHub)
- Email/password authentication
- Password reset flow
- Email verification

**RBAC (Role-Based Access Control):**
- User roles and permissions
- Resource-level access control
- Team/workspace support
- Invitation system

**Location:** `app/users.py`, `app/routes/auth_routes.py`

**What We Can Reuse:**
- User authentication
- Token validation
- Permission checking
- Session management

---

### Search & RAG Pipeline

**Hybrid Search:**
- Vector search (pgvector)
- Keyword search (Elasticsearch)
- Hybrid ranking algorithm
- Reranking with flashrank

**Location:** `app/retriever/`

**Components:**
- `chunks_hybrid_search.py` - Search document chunks
- `documents_hybrid_search.py` - Search full documents

**Features:**
- Semantic search
- Keyword matching
- Filters (date, document type, source)
- Pagination
- Relevance scoring

**What We Can Reuse:**
- Entire search pipeline
- Just need to call existing APIs
- No modifications needed

---

### Document Processing

**ETL Pipeline:**
- Document parsing (multiple parsers)
- Text extraction
- Metadata extraction
- Format conversion

**Parsers Available:**
- Docling (PDF, DOCX, PPTX)
- LlamaCloud (advanced parsing)
- Azure Document Intelligence
- Unstructured (universal parser)
- Audio transcription (Faster-Whisper)
- Direct converters (TXT, MD, HTML)

**Location:** `app/etl_pipeline/`

**Indexing Pipeline:**
- Document chunking (chonkie)
- Embedding generation (sentence-transformers)
- Vector storage
- Summarization (optional)
- Deduplication

**Location:** `app/indexing_pipeline/`

**What We Can Reuse:**
- Document retrieval
- Chunk retrieval
- Metadata access
- No changes needed

---

### LLM Integration

**LiteLLM Router:**
- Multiple LLM provider support
- Automatic failover
- Load balancing
- Cost tracking
- Rate limiting

**Supported Providers:**
- OpenAI
- Anthropic (Claude)
- Google (Gemini)
- Azure OpenAI
- Local models (via Ollama)
- And 100+ more

**Location:** `app/services/llm_router_service.py`

**What We Can Reuse:**
- LLM routing infrastructure
- Provider management
- Error handling
- Cost tracking

**What We Need to Add:**
- Gemma 4 E2B integration via Ollama
- Voice-specific prompts
- Streaming response handling for voice

---

### Existing AI Agents

**Chat Agent:**
- Location: `app/agents/new_chat/`
- LangGraph-based conversation
- Tool calling support
- Context management
- Streaming responses

**Podcaster Agent:**
- Location: `app/agents/podcaster/`
- Generates podcast scripts
- Text-to-speech integration (Kokoro)
- Multi-speaker support

**Video Presentation Agent:**
- Location: `app/agents/video_presentation/`
- Creates video presentations
- Slide generation
- Narration

**Autocomplete Agent:**
- Location: `app/agents/autocomplete/`
- Query suggestions
- Context-aware completions

**What We Can Reuse:**
- Agent architecture patterns
- LangGraph integration
- Tool calling patterns
- Streaming patterns

**What We Need to Add:**
- Voice-specific agent
- Voice conversation state management
- Voice tool handlers

---

### Text-to-Speech (TTS)

**Existing TTS:**
- Kokoro TTS service
- Location: `app/services/kokoro_tts_service.py`
- Used for podcast generation
- High-quality voices

**What We Can Reuse:**
- TTS service patterns
- Audio generation logic

**What We Need to Add:**
- Piper TTS integration (faster, better for real-time)
- Streaming TTS support
- Voice selection API

---

### Speech-to-Text (STT)

**Existing STT:**
- Faster-Whisper already in dependencies
- Location: `app/services/stt_service.py`
- Used for audio document processing

**What We Can Reuse:**
- Faster-Whisper integration
- Audio processing utilities
- Transcription logic

**What We Need to Add:**
- Real-time streaming transcription
- Voice activity detection
- Audio chunk handling

---

### Data Connectors

**20+ Connectors Available:**
- Google Drive
- Gmail
- Google Calendar
- OneDrive
- Dropbox
- Slack
- Discord
- Notion
- Confluence
- Jira
- Linear
- GitHub
- And more...

**Location:** `app/connectors/`, `app/tasks/connector_indexers/`

**What We Can Reuse:**
- All existing connectors
- Data already indexed and searchable
- No changes needed for voice assistant

---

### Celery Task Queue

**Async Task Processing:**
- Document indexing
- Connector syncing
- Podcast generation
- Video generation
- Email notifications

**Location:** `app/tasks/celery_tasks/`

**What We Can Reuse:**
- Task queue infrastructure
- Background job patterns

**What We Need to Add:**
- Voice session cleanup tasks
- Conversation history archival
- Quiz result processing

---

### API Routes

**Existing Routes:**
- `/api/auth/*` - Authentication
- `/api/chat/*` - Chat operations
- `/api/documents/*` - Document management
- `/api/search/*` - Search functionality
- `/api/connectors/*` - Connector management
- `/api/users/*` - User management
- `/api/prompts/*` - Prompt library
- And 40+ more endpoints

**Location:** `app/routes/`

**What We Can Reuse:**
- All existing APIs
- Authentication patterns
- Error handling
- Response formatting

**What We Need to Add:**
- `/api/voice/*` - Voice assistant endpoints

---

## What We Need to Add

### 1. Voice Assistant Service

**Location:** `app/services/voice_assistant_service.py`

**Purpose:** Core voice assistant logic

**Responsibilities:**

**Audio Processing:**
- Receive audio streams
- Send to Faster-Whisper for transcription
- Handle audio format conversions
- Manage audio buffers

**Intent Understanding:**
- Send transcripts to Gemma 4 E2B
- Parse intent and parameters
- Maintain conversation context
- Handle ambiguous inputs

**Tool Orchestration:**
- Route intents to appropriate tools
- Execute tool calls
- Handle tool responses
- Format results for voice

**Response Generation:**
- Generate natural language responses
- Add citations naturally
- Structure for voice output
- Handle long responses

**TTS Integration:**
- Send text to Piper TTS
- Receive audio responses
- Stream audio back to client
- Handle interruptions

---

### 2. Voice Routes

**Location:** `app/routes/voice_assistant_routes.py`

**Purpose:** API endpoints for voice assistant

**Endpoints to Add:**

#### Session Management

**POST `/api/voice/session/start`**
- Initialize voice session
- Create session ID
- Set up conversation state
- Return session details

**POST `/api/voice/session/end`**
- Close voice session
- Clean up resources
- Save conversation history
- Return session summary

**GET `/api/voice/session/{session_id}/status`**
- Check session health
- Get connection status
- Return current state

---

#### Audio Streaming (WebRTC)

**POST `/api/voice/webrtc/offer`**
- Receive WebRTC offer
- Create answer
- Set up peer connection
- Return WebRTC answer

**POST `/api/voice/webrtc/ice-candidate`**
- Receive ICE candidate
- Add to peer connection
- Handle connection negotiation

**WebSocket `/api/voice/stream`**
- Real-time audio streaming
- Bidirectional communication
- Handle audio chunks
- Stream responses back

---

#### Simple Audio (Fallback)

**POST `/api/voice/search`**
- Upload audio file
- Transcribe with Whisper
- Process search intent
- Return audio response

**POST `/api/voice/summarize`**
- Upload audio file
- Transcribe request
- Generate summary
- Return audio response

---

#### Conversation

**GET `/api/voice/conversation/{session_id}`**
- Retrieve conversation history
- Return turns with timestamps
- Include citations

**DELETE `/api/voice/conversation/{session_id}`**
- Clear conversation history
- Reset session state

---

#### Quiz

**POST `/api/voice/quiz/start`**
- Generate quiz questions
- Initialize quiz state
- Return first question (audio)

**POST `/api/voice/quiz/answer`**
- Receive answer (audio)
- Transcribe answer
- Evaluate correctness
- Return feedback (audio)

**GET `/api/voice/quiz/{quiz_id}/status`**
- Get quiz progress
- Return score
- Return current question

**POST `/api/voice/quiz/{quiz_id}/end`**
- Complete quiz
- Calculate final score
- Save results
- Return summary

---

### 3. Gemma 4 E2B Integration

**Location:** `app/services/gemma_service.py`

**Purpose:** Interface with Gemma 4 E2B via Ollama

**Functions:**

**Model Management:**
- Initialize Ollama client
- Load Gemma 4 E2B model
- Handle model errors
- Monitor model health

**Intent Understanding:**
- Send transcript + context
- Parse JSON response
- Extract intent and parameters
- Handle parsing errors

**Response Generation:**
- Format search results
- Generate natural responses
- Add citations
- Structure for voice

**Function Calling:**
- Define tool schemas
- Handle tool calls
- Execute tools
- Return results

**Conversation Context:**
- Maintain conversation history
- Add system prompts
- Manage context window
- Handle context overflow

---

### 4. Piper TTS Integration

**Location:** `app/services/piper_tts_service.py`

**Purpose:** Fast, high-quality text-to-speech

**Functions:**

**Voice Management:**
- Load voice models
- List available voices
- Switch voices
- Cache voice data

**Speech Generation:**
- Convert text to audio
- Handle long text (chunking)
- Adjust speech rate
- Adjust pitch/volume

**Streaming:**
- Generate audio progressively
- Stream chunks as ready
- Handle interruptions
- Clean up resources

**Audio Format:**
- Output format: WAV, MP3, or raw
- Sample rate: 16kHz or 22kHz
- Bit depth: 16-bit
- Channels: Mono

---

### 5. WebRTC Handler

**Location:** `app/services/webrtc_service.py`

**Purpose:** Manage WebRTC connections

**Functions:**

**Connection Setup:**
- Handle SDP offer/answer
- ICE candidate exchange
- DTLS handshake
- SRTP setup

**Media Handling:**
- Receive audio streams
- Send audio streams
- Handle codec negotiation
- Manage bandwidth

**Connection Management:**
- Monitor connection state
- Handle reconnection
- Detect disconnection
- Clean up resources

**Error Handling:**
- Connection failures
- Network issues
- Codec mismatches
- Timeout handling

---

### 6. Conversation State Manager

**Location:** `app/services/conversation_state_service.py`

**Purpose:** Manage voice conversation state

**State Storage:**

**Session State:**
- Session ID
- User ID
- Start time
- Last activity
- Connection status

**Conversation History:**
- User inputs (transcribed)
- Assistant responses
- Timestamps
- Intent types
- Tool calls
- Citations

**Context Data:**
- Active document
- Active topic
- Search filters
- User preferences

**Quiz State:**
- Questions list
- Current question index
- User answers
- Score
- Start time
- End time

**Storage Backend:**
- Redis (temporary, fast)
- PostgreSQL (persistent, long-term)

**Functions:**
- Create session
- Get session
- Update session
- Delete session
- Add conversation turn
- Get conversation history
- Clear conversation
- Save quiz state
- Get quiz state

---

### 7. Voice Tool Handlers

**Location:** `app/services/voice_tools/`

**Purpose:** Execute voice-specific actions

#### Search Tool Handler

**File:** `search_tool.py`

**Function:** `handle_voice_search(query, filters, user_id)`

**Process:**
1. Call SurfSense search API
2. Get top results with citations
3. Format for voice output
4. Return natural language response

**Output Example:**
"I found 3 notes about photosynthesis. From your biology notes on March 15th, page 23: Photosynthesis is the process by which plants convert light energy into chemical energy..."

---

#### Summarize Tool Handler

**File:** `summarize_tool.py`

**Function:** `handle_voice_summarize(document_id, section, user_id)`

**Process:**
1. Fetch document chunks
2. Use Gemma 4 E2B to summarize
3. Structure summary (intro, points, conclusion)
4. Format for voice

**Output Example:**
"Chapter 3 covers cellular respiration. First, glycolysis breaks down glucose into pyruvate. Second, the citric acid cycle produces electron carriers. Third, the electron transport chain generates ATP."

---

#### Quiz Tool Handler

**File:** `quiz_tool.py`

**Functions:**

**`generate_quiz(topic, num_questions, user_id)`**
- Fetch relevant content
- Use Gemma 4 E2B to generate questions
- Validate question quality
- Return questions with answers

**`evaluate_answer(question, correct_answer, user_answer)`**
- Use Gemma 4 E2B for flexible matching
- Handle paraphrased answers
- Generate feedback
- Return correctness + explanation

**`manage_quiz_state(quiz_id, action)`**
- Track progress
- Calculate score
- Handle completion
- Save results

---

#### Follow-up Tool Handler

**File:** `followup_tool.py`

**Function:** `handle_followup(query, conversation_history)`

**Supported Commands:**
- "Repeat that" → Return last response
- "More detail" → Expand on last response
- "What was the source?" → Cite last source
- "Skip" / "Next" → Move to next item

**Process:**
1. Detect follow-up type
2. Access conversation history
3. Retrieve relevant context
4. Generate appropriate response

---

### 8. Audio Utilities

**Location:** `app/utils/audio_utils.py`

**Purpose:** Audio processing helpers

**Functions:**

**Format Conversion:**
- `convert_audio_format(audio_data, from_format, to_format)`
- `resample_audio(audio_data, from_rate, to_rate)`
- `convert_to_mono(audio_data)`

**Audio Processing:**
- `normalize_volume(audio_data)`
- `remove_silence(audio_data, threshold)`
- `detect_speech(audio_data)`
- `calculate_duration(audio_data)`

**Chunking:**
- `chunk_audio(audio_data, chunk_size)`
- `merge_audio_chunks(chunks)`

**Validation:**
- `validate_audio_format(audio_data)`
- `check_audio_quality(audio_data)`

---

### 9. Database Schema Additions

**Location:** `app/db/` and new Alembic migration

**New Tables:**

#### voice_sessions

**Purpose:** Track voice assistant sessions

**Columns:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `session_id` (String, unique)
- `start_time` (DateTime)
- `end_time` (DateTime, nullable)
- `status` (Enum: active, completed, error)
- `connection_type` (Enum: webrtc, simple)
- `total_turns` (Integer)
- `created_at` (DateTime)
- `updated_at` (DateTime)

---

#### voice_conversations

**Purpose:** Store conversation history

**Columns:**
- `id` (UUID, primary key)
- `session_id` (UUID, foreign key)
- `turn_number` (Integer)
- `user_input` (Text) - transcribed
- `assistant_response` (Text)
- `intent_type` (Enum: search, summarize, quiz, followup)
- `tool_called` (String, nullable)
- `citations` (JSONB, nullable)
- `timestamp` (DateTime)
- `created_at` (DateTime)

---

#### voice_quiz_sessions

**Purpose:** Track quiz sessions

**Columns:**
- `id` (UUID, primary key)
- `session_id` (UUID, foreign key)
- `user_id` (UUID, foreign key)
- `topic` (String)
- `questions` (JSONB) - list of questions
- `answers` (JSONB) - user answers
- `score` (Integer)
- `total_questions` (Integer)
- `current_question` (Integer)
- `status` (Enum: active, completed)
- `start_time` (DateTime)
- `end_time` (DateTime, nullable)
- `created_at` (DateTime)

---

#### voice_settings

**Purpose:** User voice preferences

**Columns:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key, unique)
- `preferred_voice` (String)
- `speech_rate` (Float, default 1.0)
- `volume` (Float, default 1.0)
- `language` (String, default 'en')
- `auto_start_listening` (Boolean, default False)
- `confirmation_sounds` (Boolean, default True)
- `created_at` (DateTime)
- `updated_at` (DateTime)

---

### 10. Configuration

**Location:** `app/config/voice_config.py`

**Purpose:** Voice assistant configuration

**Settings:**

**Gemma 4 E2B:**
- Model name: `gemma4:2b-e2b-q4_0`
- Ollama host: `http://localhost:11434`
- Context window: 128K tokens
- Temperature: 0.3 (intent), 0.7 (response)

**Faster-Whisper:**
- Model: `base`
- Device: `cuda` or `cpu`
- Compute type: `int8`
- Language: `en`

**Piper TTS:**
- Default voice: `en_US-lessac-medium`
- Sample rate: 16000 Hz
- Quality: `medium`

**WebRTC:**
- STUN servers
- TURN servers (optional)
- ICE timeout: 30 seconds
- Connection timeout: 60 seconds

**Session:**
- Max session duration: 30 minutes
- Idle timeout: 5 minutes
- Max conversation turns: 100
- History retention: 7 days

**Audio:**
- Max audio chunk size: 1MB
- Audio format: WAV, 16kHz, 16-bit, mono
- Max recording duration: 30 seconds

---

### 11. Middleware

**Location:** `app/middleware/voice_middleware.py`

**Purpose:** Voice-specific middleware

**Functions:**

**Rate Limiting:**
- Limit voice sessions per user
- Limit audio uploads per minute
- Prevent abuse

**Session Validation:**
- Verify session exists
- Check session not expired
- Validate user ownership

**Audio Validation:**
- Check audio format
- Validate audio size
- Verify audio quality

**Error Handling:**
- Catch voice-specific errors
- Format error responses
- Log errors

---

### 12. Celery Tasks

**Location:** `app/tasks/celery_tasks/voice_tasks.py`

**Purpose:** Background tasks for voice assistant

**Tasks:**

**Session Cleanup:**
- Delete expired sessions
- Archive old conversations
- Clean up temporary files

**Quiz Processing:**
- Save quiz results
- Calculate statistics
- Generate reports

**Analytics:**
- Track usage metrics
- Calculate performance stats
- Generate insights

**Maintenance:**
- Clean up orphaned data
- Optimize database
- Update indexes

---

### 13. Testing

**Location:** `tests/`

**New Test Files:**

**Unit Tests:**
- `tests/unit/test_voice_service.py`
- `tests/unit/test_gemma_service.py`
- `tests/unit/test_piper_service.py`
- `tests/unit/test_voice_tools.py`

**Integration Tests:**
- `tests/integration/test_voice_routes.py`
- `tests/integration/test_voice_session.py`
- `tests/integration/test_voice_quiz.py`

**Test Coverage:**
- Voice service functions
- API endpoints
- WebRTC connection
- Audio processing
- Intent understanding
- Tool execution
- Error handling

---

## Integration Points with Existing Backend

### 1. Authentication

**Reuse Existing:**
- JWT token validation
- User authentication
- Permission checking
- Session management

**Integration:**
- Voice routes use same auth decorators
- Voice sessions linked to user accounts
- RBAC applies to voice features

---

### 2. Search & RAG

**Reuse Existing:**
- Hybrid search API
- Document retrieval
- Chunk retrieval
- Reranking

**Integration:**
- Voice search tool calls existing search API
- No modifications to search pipeline
- Results formatted for voice output

---

### 3. Document Processing

**Reuse Existing:**
- Document metadata
- Chunk storage
- Embeddings
- Connectors

**Integration:**
- Voice assistant accesses same documents
- Citations reference existing documents
- No changes to document pipeline

---

### 4. LLM Infrastructure

**Reuse Existing:**
- LiteLLM router
- Provider management
- Error handling
- Cost tracking

**Extend:**
- Add Gemma 4 E2B via Ollama
- Voice-specific prompts
- Streaming for voice

---

### 5. Task Queue

**Reuse Existing:**
- Celery infrastructure
- Redis backend
- Task monitoring
- Error handling

**Add:**
- Voice-specific tasks
- Session cleanup
- Quiz processing

---

## Deployment Considerations

### Docker Setup

**Update Dockerfile:**
- Add Ollama installation
- Add Piper TTS installation
- Add audio processing libraries
- Configure GPU support (optional)

**New Services:**
- Ollama service (for Gemma 4 E2B)
- STUN/TURN server (for WebRTC)

---

### Environment Variables

**New Variables:**
- `OLLAMA_HOST` - Ollama API endpoint
- `GEMMA_MODEL` - Model name
- `PIPER_VOICE_PATH` - Voice model path
- `WEBRTC_STUN_SERVER` - STUN server URL
- `WEBRTC_TURN_SERVER` - TURN server URL (optional)
- `VOICE_SESSION_TIMEOUT` - Session timeout in minutes
- `VOICE_MAX_AUDIO_SIZE` - Max audio upload size

---

### Resource Requirements

**CPU:**
- Gemma 4 E2B: 4-8 cores
- Faster-Whisper: 2-4 cores
- Piper TTS: 2-4 cores

**Memory:**
- Gemma 4 E2B: 2-4GB
- Faster-Whisper: 1-2GB
- Piper TTS: 500MB-1GB
- Total: 8-16GB recommended

**GPU (Optional):**
- Gemma 4 E2B: 4-6GB VRAM
- Faster-Whisper: 2-4GB VRAM
- 10x faster inference

**Storage:**
- Gemma 4 E2B model: 1.5GB
- Whisper model: 150MB
- Piper voice models: 50-100MB each
- Conversation history: ~1MB per user per month

---

## Performance Optimization

### Caching

**Model Caching:**
- Keep Gemma 4 E2B loaded in memory
- Cache Whisper model
- Cache Piper voice models

**Response Caching:**
- Cache common queries
- Cache quiz questions
- Cache summaries

**Audio Caching:**
- Cache TTS responses for common phrases
- Cache audio chunks

---

### Connection Pooling

**Database:**
- PostgreSQL connection pool
- Redis connection pool

**HTTP:**
- Ollama client connection pool
- External API connection pool

---

### Async Processing

**Use Async/Await:**
- All I/O operations
- Database queries
- API calls
- Audio processing

**Background Tasks:**
- Session cleanup
- Analytics
- Archival

---

## Monitoring & Logging

### Metrics to Track

**Performance:**
- Voice session latency
- STT latency
- LLM inference latency
- TTS latency
- WebRTC connection quality

**Usage:**
- Active sessions
- Total sessions per day
- Average session duration
- Commands per session
- Feature usage breakdown

**Errors:**
- Connection failures
- Transcription errors
- Intent parsing errors
- Tool execution errors
- TTS generation errors

---

### Logging

**Log Levels:**
- INFO: Session start/end, tool calls
- WARNING: Slow responses, retries
- ERROR: Failures, exceptions
- DEBUG: Detailed flow (development only)

**Log Format:**
- Timestamp
- Session ID
- User ID
- Component
- Message
- Metadata (latency, error details)

---

## Security Considerations

### Audio Data

**Privacy:**
- Audio processed in memory only
- Not stored permanently (unless user opts in)
- Encrypted in transit
- Secure deletion

**Validation:**
- Validate audio format
- Check audio size limits
- Scan for malicious content

---

### API Security

**Rate Limiting:**
- Per user limits
- Per IP limits
- Per endpoint limits

**Authentication:**
- JWT token validation
- Session validation
- Permission checks

**Input Validation:**
- Sanitize user inputs
- Validate parameters
- Prevent injection attacks

---

## Summary

### What Exists (Can Reuse)

✅ **Infrastructure:**
- FastAPI framework
- Authentication system
- Database (PostgreSQL, Redis, Elasticsearch)
- Search & RAG pipeline
- Document processing
- LLM integration (LiteLLM)
- Task queue (Celery)
- All data connectors

✅ **Services:**
- Search API
- Document API
- User API
- Auth API
- Faster-Whisper (STT)
- Kokoro TTS (can reference patterns)

✅ **Patterns:**
- Agent architecture
- Tool calling
- Streaming responses
- Error handling
- Async processing

---

### What We Need to Add

🆕 **Core Services:**
- Voice assistant service
- Gemma 4 E2B integration
- Piper TTS integration
- WebRTC handler
- Conversation state manager

🆕 **API Routes:**
- `/api/voice/*` endpoints
- Session management
- Audio streaming
- Quiz endpoints

🆕 **Tool Handlers:**
- Voice search tool
- Voice summarize tool
- Voice quiz tool
- Voice follow-up tool

🆕 **Database:**
- voice_sessions table
- voice_conversations table
- voice_quiz_sessions table
- voice_settings table

🆕 **Utilities:**
- Audio processing utilities
- WebRTC utilities
- Voice-specific middleware

🆕 **Configuration:**
- Voice config file
- Environment variables
- Model settings

🆕 **Tasks:**
- Session cleanup
- Quiz processing
- Analytics

🆕 **Tests:**
- Unit tests for voice services
- Integration tests for voice routes
- E2E tests for voice flows

---

## Implementation Priority

### Phase 1: Core Voice Service (Week 1-2)
1. Voice assistant service
2. Gemma 4 E2B integration
3. Piper TTS integration
4. Basic voice routes (simple audio upload)
5. Database schema

### Phase 2: Real-time Streaming (Week 3-4)
1. WebRTC handler
2. Streaming audio routes
3. Conversation state manager
4. Voice tool handlers

### Phase 3: Advanced Features (Week 5-6)
1. Quiz functionality
2. Follow-up handling
3. Celery tasks
4. Caching & optimization

### Phase 4: Production Ready (Week 7-8)
1. Comprehensive testing
2. Monitoring & logging
3. Documentation
4. Deployment setup

---

The existing SurfSense backend provides ~70% of what we need. We're adding a new voice interface layer that integrates cleanly with existing services while maintaining the same patterns and architecture.
