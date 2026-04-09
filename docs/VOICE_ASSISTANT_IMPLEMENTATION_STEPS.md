# Voice Assistant Implementation - Step-by-Step To-Do List

## Phase 1: Setup & Proof of Concept (Week 1-2)
**Goal:** Get basic voice search working end-to-end

---

### Week 1: Environment Setup

#### Day 1-2: Install Core Dependencies

- [ ] **Set up Python environment**
  - [ ] Verify Python 3.12 is installed
  - [ ] Create virtual environment for voice assistant
  - [ ] Activate environment

- [ ] **Install Ollama (for running Gemma 4 E2B)**
  - [ ] Download Ollama from https://ollama.ai
  - [ ] Install Ollama on your system
  - [ ] Verify installation: `ollama --version`
  - [ ] Start Ollama service: `ollama serve`

- [ ] **Download Gemma 4 E2B model**
  - [ ] Run: `ollama pull gemma4:2b-e2b-q4_0`
  - [ ] Wait for download (1-1.5GB)
  - [ ] Test model: `ollama run gemma4:2b-e2b-q4_0 "Hello"`
  - [ ] Verify response is generated

- [ ] **Install Faster-Whisper**
  - [ ] Add to SurfSense dependencies (already there, verify)
  - [ ] Test import: `python -c "from faster_whisper import WhisperModel"`
  - [ ] Download base model: Will auto-download on first use

- [ ] **Install Piper TTS**
  - [ ] Download Piper binary from https://github.com/rhasspy/piper
  - [ ] Install system dependencies (espeak-ng)
  - [ ] Download voice model: `en_US-lessac-medium`
  - [ ] Test: `echo "Hello" | piper --model en_US-lessac-medium --output-raw`

---

#### Day 3: Test Each Component Individually

- [ ] **Test Faster-Whisper (STT)**
  - [ ] Create test script: `test_whisper.py`
  - [ ] Record 5-second audio file (say "test")
  - [ ] Transcribe audio file
  - [ ] Verify transcription accuracy
  - [ ] Measure latency (should be <500ms)

- [ ] **Test Gemma 4 E2B (LLM)**
  - [ ] Create test script: `test_gemma.py`
  - [ ] Send simple prompt: "What is photosynthesis?"
  - [ ] Verify response is generated
  - [ ] Measure latency (should be <300ms)
  - [ ] Test function calling capability

- [ ] **Test Piper TTS**
  - [ ] Create test script: `test_piper.py`
  - [ ] Convert text to speech: "Hello, this is a test"
  - [ ] Play audio file
  - [ ] Verify voice quality
  - [ ] Measure latency (should be <500ms)

- [ ] **Test SurfSense Search API**
  - [ ] Verify SurfSense backend is running
  - [ ] Test search endpoint: `/api/search/chunks`
  - [ ] Verify results are returned
  - [ ] Check response format

---

#### Day 4-5: Build Simple Voice Pipeline (No Pipecat)

- [ ] **Create basic voice service**
  - [ ] Create file: `app/services/simple_voice_service.py`
  - [ ] Implement audio file upload handler
  - [ ] Implement STT function (Faster-Whisper)
  - [ ] Implement LLM function (Gemma 4 E2B via Ollama)
  - [ ] Implement TTS function (Piper)

- [ ] **Create basic voice route**
  - [ ] Create file: `app/routes/simple_voice_routes.py`
  - [ ] Add POST `/api/voice/search` endpoint
  - [ ] Accept audio file upload
  - [ ] Return audio response

- [ ] **Create simple HTML test page**
  - [ ] Create file: `app/templates/voice_test.html`
  - [ ] Add "Record" button
  - [ ] Add audio recorder (5 seconds)
  - [ ] Add upload functionality
  - [ ] Add audio player for response

- [ ] **Test end-to-end**
  - [ ] Start SurfSense backend
  - [ ] Open test page in browser
  - [ ] Record: "Search my notes for test"
  - [ ] Verify response is heard
  - [ ] Measure total latency

---

### Week 2: Intent Understanding & Tool Calling

#### Day 6-7: Build Intent Parser

- [ ] **Design intent schema**
  - [ ] Define intent types: search, summarize, quiz, follow_up
  - [ ] Define parameter extraction format (JSON)
  - [ ] Create example prompts for each intent

- [ ] **Implement intent understanding**
  - [ ] Create function: `understand_intent(user_input: str)`
  - [ ] Build system prompt for Gemma 4 E2B
  - [ ] Parse LLM response to extract intent + parameters
  - [ ] Handle JSON parsing errors

- [ ] **Test intent understanding**
  - [ ] Test: "Search my notes for photosynthesis" → search intent
  - [ ] Test: "Summarize chapter 3" → summarize intent
  - [ ] Test: "Quiz me on biology" → quiz intent
  - [ ] Test: "Repeat that" → follow_up intent
  - [ ] Verify accuracy >90%

---

#### Day 8-9: Implement Tool Handlers

- [ ] **Create search tool handler**
  - [ ] Function: `handle_search(query, user_id)`
  - [ ] Call SurfSense search API
  - [ ] Format results with citations
  - [ ] Return natural language response

- [ ] **Create summarize tool handler**
  - [ ] Function: `handle_summarize(document_id, section, user_id)`
  - [ ] Fetch document chunks from SurfSense
  - [ ] Use Gemma 4 E2B to generate summary
  - [ ] Return structured summary

- [ ] **Create follow-up handler**
  - [ ] Function: `handle_follow_up(query, context)`
  - [ ] Access conversation history
  - [ ] Handle "repeat", "more detail", "source"
  - [ ] Return appropriate response

- [ ] **Test each tool handler**
  - [ ] Test search with real SurfSense data
  - [ ] Test summarize with sample document
  - [ ] Test follow-up with mock conversation history

---

#### Day 10: Integrate Tools with Voice Pipeline

- [ ] **Update voice service**
  - [ ] Add tool routing logic
  - [ ] Connect intent parser to tool handlers
  - [ ] Add error handling for tool failures

- [ ] **Test integrated pipeline**
  - [ ] Voice search: "Search my notes for X"
  - [ ] Voice summarize: "Summarize document Y"
  - [ ] Voice follow-up: "Tell me more"
  - [ ] Verify all work end-to-end

- [ ] **Measure performance**
  - [ ] Record latency for each step
  - [ ] Identify bottlenecks
  - [ ] Optimize if needed

---

## Phase 2: Core Features (Week 3-4)
**Goal:** Add conversation state, follow-ups, and polish

---

### Week 3: Conversation Management

#### Day 11-12: Implement Conversation State

- [ ] **Design conversation state schema**
  - [ ] User ID
  - [ ] Session ID
  - [ ] Conversation history (last 5 turns)
  - [ ] Current context (active document, topic)

- [ ] **Create conversation manager**
  - [ ] Create file: `app/services/conversation_manager.py`
  - [ ] Function: `add_turn(user_input, assistant_response)`
  - [ ] Function: `get_context(session_id)`
  - [ ] Function: `clear_session(session_id)`

- [ ] **Store conversation state**
  - [ ] Option A: In-memory (simple, for MVP)
  - [ ] Option B: Redis (scalable)
  - [ ] Option C: PostgreSQL (persistent)
  - [ ] Choose and implement

- [ ] **Test conversation state**
  - [ ] Create session
  - [ ] Add multiple turns
  - [ ] Retrieve context
  - [ ] Verify history is maintained

---

#### Day 13-14: Implement Follow-up Handling

- [ ] **Build follow-up logic**
  - [ ] Detect "repeat" command → replay last response
  - [ ] Detect "more detail" → expand on last response
  - [ ] Detect "what was the source" → cite last source
  - [ ] Detect "skip" or "next" → move to next item

- [ ] **Update intent parser**
  - [ ] Add conversation history to prompt
  - [ ] Enable context-aware intent understanding
  - [ ] Test with multi-turn conversations

- [ ] **Test follow-up scenarios**
  - [ ] Search → "Tell me more about the first result"
  - [ ] Summarize → "Repeat that"
  - [ ] Any response → "What was the source?"

---

#### Day 15-16: Response Formatting for Voice

- [ ] **Create response formatter**
  - [ ] Function: `format_for_voice(search_results)`
  - [ ] Natural citation phrasing: "From your biology notes..."
  - [ ] Handle multiple results: "I found 3 notes..."
  - [ ] Add pauses for clarity

- [ ] **Handle long responses**
  - [ ] Detect response length
  - [ ] If >30 seconds, offer to continue
  - [ ] Allow user to interrupt
  - [ ] Implement progressive delivery

- [ ] **Test response quality**
  - [ ] Listen to generated responses
  - [ ] Verify citations are clear
  - [ ] Check for natural flow
  - [ ] Adjust prompts as needed

---

### Week 4: Error Handling & Polish

#### Day 17-18: Error Handling

- [ ] **Handle STT failures**
  - [ ] Detect unclear audio
  - [ ] Response: "I didn't catch that. Could you repeat?"
  - [ ] Retry mechanism

- [ ] **Handle intent parsing failures**
  - [ ] Detect ambiguous commands
  - [ ] Response: "Did you mean search or summarize?"
  - [ ] Clarification flow

- [ ] **Handle no results**
  - [ ] Detect empty search results
  - [ ] Response: "I didn't find any documents matching that"
  - [ ] Suggest alternatives

- [ ] **Handle API timeouts**
  - [ ] Set timeout limits
  - [ ] Response: "This is taking longer than expected..."
  - [ ] Fallback responses

---

#### Day 19-20: Testing & Optimization

- [ ] **Performance testing**
  - [ ] Test with 10 different queries
  - [ ] Measure end-to-end latency
  - [ ] Target: <2.5 seconds average
  - [ ] Identify and fix bottlenecks

- [ ] **Accuracy testing**
  - [ ] Test STT accuracy with various accents
  - [ ] Test intent recognition accuracy
  - [ ] Test search result relevance
  - [ ] Target: >90% accuracy

- [ ] **User testing**
  - [ ] Test with 3-5 users
  - [ ] Collect feedback on voice quality
  - [ ] Collect feedback on response accuracy
  - [ ] Collect feedback on conversation flow

- [ ] **Bug fixes**
  - [ ] Fix issues found in testing
  - [ ] Improve error messages
  - [ ] Polish user experience

---

## Phase 3: Quiz Mode (Week 5-6)
**Goal:** Interactive quiz functionality

---

### Week 5: Quiz Generation

#### Day 21-22: Build Quiz Generator

- [ ] **Design quiz schema**
  - [ ] Question text
  - [ ] Correct answer
  - [ ] Explanation
  - [ ] Difficulty level

- [ ] **Implement quiz generation**
  - [ ] Function: `generate_quiz(content, num_questions)`
  - [ ] Use Gemma 4 E2B to create questions
  - [ ] Parse questions into structured format
  - [ ] Validate question quality

- [ ] **Test quiz generation**
  - [ ] Generate quiz from sample document
  - [ ] Verify questions are relevant
  - [ ] Verify answers are correct
  - [ ] Check explanation quality

---

#### Day 23-24: Build Quiz Flow

- [ ] **Create quiz state manager**
  - [ ] Store quiz questions
  - [ ] Track current question index
  - [ ] Track user score
  - [ ] Track user answers

- [ ] **Implement quiz conversation**
  - [ ] Start quiz: Generate questions
  - [ ] Ask question: Read question aloud
  - [ ] Wait for answer: Capture user response
  - [ ] Evaluate answer: Check correctness
  - [ ] Give feedback: Explain result
  - [ ] Next question: Move to next or end

- [ ] **Test quiz flow**
  - [ ] Start quiz on sample topic
  - [ ] Answer all questions
  - [ ] Verify score is calculated correctly
  - [ ] Verify feedback is helpful

---

### Week 6: Quiz Polish & Integration

#### Day 25-26: Answer Evaluation

- [ ] **Build answer evaluator**
  - [ ] Function: `evaluate_answer(question, correct_answer, user_answer)`
  - [ ] Use Gemma 4 E2B for flexible matching
  - [ ] Handle partial correctness
  - [ ] Generate feedback

- [ ] **Test answer evaluation**
  - [ ] Test exact matches
  - [ ] Test paraphrased answers
  - [ ] Test incorrect answers
  - [ ] Test partial answers

---

#### Day 27-28: Quiz Integration

- [ ] **Add quiz to voice routes**
  - [ ] POST `/api/voice/quiz/start`
  - [ ] POST `/api/voice/quiz/answer`
  - [ ] GET `/api/voice/quiz/status`

- [ ] **Update HTML test page**
  - [ ] Add "Quiz Me" button
  - [ ] Show quiz progress
  - [ ] Show score

- [ ] **End-to-end quiz testing**
  - [ ] Start quiz via voice
  - [ ] Complete full quiz
  - [ ] Verify score is correct
  - [ ] Test interruption handling

---

## Phase 4: Production Ready (Week 7-8)
**Goal:** Deploy-ready system with Pipecat

---

### Week 7: Add Pipecat for Real-time

#### Day 29-30: Install & Configure Pipecat

- [ ] **Install Pipecat**
  - [ ] Add to dependencies: `pip install pipecat-ai`
  - [ ] Install WebRTC dependencies
  - [ ] Verify installation

- [ ] **Create Pipecat pipeline**
  - [ ] Create file: `app/services/pipecat_voice_service.py`
  - [ ] Set up WebRTC transport
  - [ ] Add VAD processor
  - [ ] Add STT processor (Faster-Whisper)
  - [ ] Add LLM processor (Gemma 4 E2B)
  - [ ] Add TTS processor (Piper)

- [ ] **Test Pipecat pipeline**
  - [ ] Start pipeline
  - [ ] Connect from browser
  - [ ] Test voice input/output
  - [ ] Verify real-time streaming works

---

#### Day 31-32: Migrate to Pipecat

- [ ] **Update voice routes**
  - [ ] Add WebRTC signaling endpoint
  - [ ] Add Pipecat session management
  - [ ] Keep old routes for backward compatibility

- [ ] **Update HTML interface**
  - [ ] Add WebRTC connection code
  - [ ] Add real-time audio streaming
  - [ ] Add interruption handling

- [ ] **Test migration**
  - [ ] Test all features with Pipecat
  - [ ] Compare latency (should be lower)
  - [ ] Verify conversation flow is smoother

---

### Week 8: Deployment & Documentation

#### Day 33-34: Deployment Setup

- [ ] **Create Docker setup**
  - [ ] Update Dockerfile with all dependencies
  - [ ] Add Ollama to container
  - [ ] Add Piper to container
  - [ ] Test Docker build

- [ ] **Create docker-compose**
  - [ ] Add voice assistant service
  - [ ] Add Redis for conversation state
  - [ ] Configure networking
  - [ ] Test docker-compose up

- [ ] **Environment configuration**
  - [ ] Create `.env.example` for voice assistant
  - [ ] Document all environment variables
  - [ ] Set up production configs

---

#### Day 35-36: Documentation & Launch

- [ ] **Write user documentation**
  - [ ] Getting started guide
  - [ ] Voice command reference
  - [ ] Troubleshooting guide
  - [ ] FAQ

- [ ] **Write developer documentation**
  - [ ] Architecture overview
  - [ ] API documentation
  - [ ] Deployment guide
  - [ ] Contributing guide

- [ ] **Final testing**
  - [ ] Full end-to-end test
  - [ ] Performance benchmarks
  - [ ] Security audit
  - [ ] Accessibility testing

- [ ] **Launch preparation**
  - [ ] Create demo video
  - [ ] Prepare announcement
  - [ ] Set up feedback channels
  - [ ] Monitor deployment

---

## Ongoing: Maintenance & Improvements

### Post-Launch Tasks

- [ ] **Monitor performance**
  - [ ] Track latency metrics
  - [ ] Track accuracy metrics
  - [ ] Track user engagement

- [ ] **Collect feedback**
  - [ ] User surveys
  - [ ] Bug reports
  - [ ] Feature requests

- [ ] **Iterate and improve**
  - [ ] Fix reported bugs
  - [ ] Optimize performance
  - [ ] Add requested features

---

## Optional Enhancements (Future)

### Advanced Features

- [ ] **Multi-language support**
  - [ ] Add language detection
  - [ ] Support Spanish, French, etc.
  - [ ] Test with multilingual users

- [ ] **Mobile app**
  - [ ] React Native app
  - [ ] iOS/Android support
  - [ ] Offline mode

- [ ] **Voice bookmarks**
  - [ ] "Save this for later"
  - [ ] "Mark this source"
  - [ ] Bookmark management

- [ ] **Study session mode**
  - [ ] Timed learning sessions
  - [ ] Progress tracking
  - [ ] Spaced repetition

- [ ] **Advanced quiz features**
  - [ ] Multiple choice questions
  - [ ] True/false questions
  - [ ] Difficulty adaptation

---

## Success Metrics

### Technical Metrics
- [ ] End-to-end latency <2.5 seconds
- [ ] STT accuracy >95%
- [ ] Intent recognition >90%
- [ ] System uptime >99%

### User Metrics
- [ ] Task completion rate >80%
- [ ] User satisfaction >4.5/5
- [ ] Average session length >15 minutes
- [ ] Weekly active users >60%

### Accessibility Metrics
- [ ] 100% screen-free operation
- [ ] Time to first successful interaction <5 minutes
- [ ] Error recovery <3 attempts average

---

## Notes

- **Prioritize MVP:** Focus on getting basic voice search working first
- **Test frequently:** Test each component before moving to next
- **Iterate based on feedback:** User testing is crucial for accessibility
- **Document as you go:** Don't wait until the end
- **Keep it simple:** Start without Pipecat, add it later for better UX

---

## Resources

- Ollama: https://ollama.ai
- Gemma 4 E2B: https://huggingface.co/google/gemma-4-E2B
- Faster-Whisper: https://github.com/guillaumekln/faster-whisper
- Piper TTS: https://github.com/rhasspy/piper
- Pipecat: https://docs.pipecat.ai
- SurfSense: https://github.com/MODSetter/SurfSense

---

**Ready to start? Begin with Phase 1, Day 1!** 🚀
