# Voice Assistant Implementation - TODO List

> **Project:** Voice-First Research Assistant for Visually Impaired Users  
> **Timeline:** 8 weeks to production  
> **Last Updated:** 2026-04-09

---

## 📋 Quick Status

- [ ] **Phase 1:** Setup & Proof of Concept (Week 1-2)
- [ ] **Phase 2:** Core Features (Week 3-4)
- [ ] **Phase 3:** Advanced Features (Week 5-6)
- [ ] **Phase 4:** Production Ready (Week 7-8)

**Current Phase:** Planning ✅  
**Next Milestone:** Environment Setup

---

## Phase 1: Setup & Proof of Concept (Week 1-2)

### Week 1: Environment Setup

#### Day 1-2: Install Core Dependencies

**Backend Setup:**
- [ ] Verify Python 3.12 installation
- [ ] Create virtual environment
- [ ] Install SurfSense backend dependencies
- [ ] Verify PostgreSQL + pgvector running
- [ ] Verify Redis running
- [ ] Verify Elasticsearch running
- [ ] Run database migrations
- [ ] Test SurfSense backend starts successfully

**Ollama & Gemma 4 E2B:**
- [ ] Download and install Ollama
- [ ] Verify Ollama installation: `ollama --version`
- [ ] Start Ollama service: `ollama serve`
- [ ] Pull Gemma 4 E2B model: `ollama pull gemma4:2b-e2b-q4_0`
- [ ] Test model: `ollama run gemma4:2b-e2b-q4_0 "Hello"`
- [ ] Verify model responds correctly
- [ ] Measure inference latency (target: <300ms)

**Faster-Whisper:**
- [ ] Verify Faster-Whisper in dependencies
- [ ] Test import: `from faster_whisper import WhisperModel`
- [ ] Download base model (auto-downloads on first use)
- [ ] Create test script: `test_whisper.py`
- [ ] Test transcription with sample audio
- [ ] Measure STT latency (target: <500ms)

**Piper TTS:**
- [ ] Download Piper binary from GitHub
- [ ] Install system dependencies (espeak-ng)
- [ ] Download voice model: `en_US-lessac-medium`
- [ ] Test: `echo "Hello" | piper --model en_US-lessac-medium`
- [ ] Verify audio output quality
- [ ] Measure TTS latency (target: <500ms)

---

#### Day 3: Test Each Component

**Test Faster-Whisper (STT):**
- [ ] Create `tests/test_whisper.py`
- [ ] Record 5-second test audio
- [ ] Transcribe: "This is a test"
- [ ] Verify accuracy >95%
- [ ] Measure latency
- [ ] Test with background noise
- [ ] Test with different accents

**Test Gemma 4 E2B (LLM):**
- [ ] Create `tests/test_gemma.py`
- [ ] Test simple prompt: "What is photosynthesis?"
- [ ] Verify response quality
- [ ] Measure latency
- [ ] Test function calling capability
- [ ] Test with conversation history
- [ ] Test context window (128K tokens)

**Test Piper TTS:**
- [ ] Create `tests/test_piper.py`
- [ ] Convert text: "Hello, this is a test"
- [ ] Play audio file
- [ ] Verify voice quality
- [ ] Measure latency
- [ ] Test with long text (chunking)
- [ ] Test different speech rates

**Test SurfSense Search API:**
- [ ] Verify backend running
- [ ] Test endpoint: `POST /api/search/chunks`
- [ ] Send test query
- [ ] Verify results returned
- [ ] Check response format
- [ ] Test with filters
- [ ] Measure search latency

---

#### Day 4-5: Build Simple Voice Pipeline

**Create Basic Voice Service:**
- [ ] Create file: `app/services/simple_voice_service.py`
- [ ] Implement `transcribe_audio(audio_bytes)` function
- [ ] Implement `understand_intent(text)` function
- [ ] Implement `execute_search(query, user_id)` function
- [ ] Implement `generate_response(results)` function
- [ ] Implement `synthesize_speech(text)` function
- [ ] Add error handling
- [ ] Add logging

**Create Basic Voice Route:**
- [ ] Create file: `app/routes/simple_voice_routes.py`
- [ ] Add POST `/api/voice/search` endpoint
- [ ] Accept audio file upload
- [ ] Process through voice pipeline
- [ ] Return audio response
- [ ] Add authentication
- [ ] Add rate limiting

**Create Simple HTML Test Page:**
- [ ] Create file: `app/templates/voice_test.html`
- [ ] Add "Record" button
- [ ] Implement audio recorder (5 seconds)
- [ ] Add upload functionality
- [ ] Add audio player for response
- [ ] Add status display
- [ ] Add error handling

**Test End-to-End:**
- [ ] Start SurfSense backend
- [ ] Open test page in browser
- [ ] Grant microphone permission
- [ ] Record: "Search my notes for test"
- [ ] Verify audio uploads
- [ ] Verify response received
- [ ] Verify audio plays
- [ ] Measure total latency (target: <2.5s)

---

### Week 2: Intent Understanding & Tool Calling

#### Day 6-7: Build Intent Parser

**Design Intent Schema:**
- [ ] Define intent types: search, summarize, quiz, follow_up
- [ ] Define parameter extraction format (JSON)
- [ ] Create example prompts for each intent
- [ ] Document intent schema

**Implement Intent Understanding:**
- [ ] Create function: `understand_intent(user_input: str)`
- [ ] Build system prompt for Gemma 4 E2B
- [ ] Send to Ollama API
- [ ] Parse JSON response
- [ ] Extract intent + parameters
- [ ] Handle JSON parsing errors
- [ ] Add fallback for unclear intents

**Test Intent Understanding:**
- [ ] Test: "Search my notes for photosynthesis" → search intent
- [ ] Test: "Summarize chapter 3" → summarize intent
- [ ] Test: "Quiz me on biology" → quiz intent
- [ ] Test: "Repeat that" → follow_up intent
- [ ] Test: "Tell me more" → follow_up intent
- [ ] Test ambiguous inputs
- [ ] Verify accuracy >90%

---

#### Day 8-9: Implement Tool Handlers

**Create Search Tool Handler:**
- [ ] Create file: `app/services/voice_tools/search_tool.py`
- [ ] Function: `handle_search(query, filters, user_id)`
- [ ] Call SurfSense search API
- [ ] Format results with citations
- [ ] Generate natural language response
- [ ] Test with real data

**Create Summarize Tool Handler:**
- [ ] Create file: `app/services/voice_tools/summarize_tool.py`
- [ ] Function: `handle_summarize(document_id, section, user_id)`
- [ ] Fetch document chunks from SurfSense
- [ ] Use Gemma 4 E2B to generate summary
- [ ] Structure summary (intro, points, conclusion)
- [ ] Test with sample documents

**Create Follow-up Handler:**
- [ ] Create file: `app/services/voice_tools/followup_tool.py`
- [ ] Function: `handle_followup(query, context)`
- [ ] Access conversation history
- [ ] Handle "repeat" command
- [ ] Handle "more detail" command
- [ ] Handle "source" command
- [ ] Test with mock conversation

**Test Tool Handlers:**
- [ ] Test search with real SurfSense data
- [ ] Test summarize with sample document
- [ ] Test follow-up with mock history
- [ ] Verify response quality
- [ ] Measure execution time

---

#### Day 10: Integration & Testing

**Update Voice Service:**
- [ ] Add tool routing logic
- [ ] Connect intent parser to tool handlers
- [ ] Add error handling for tool failures
- [ ] Add conversation context tracking

**Test Integrated Pipeline:**
- [ ] Voice search: "Search my notes for X"
- [ ] Voice summarize: "Summarize document Y"
- [ ] Voice follow-up: "Tell me more"
- [ ] Verify all work end-to-end
- [ ] Test error scenarios

**Measure Performance:**
- [ ] Record latency for each step
- [ ] Identify bottlenecks
- [ ] Optimize slow components
- [ ] Verify total latency <2.5s

**Deliverable:**
- [ ] Working voice search demo
- [ ] Demo video recorded
- [ ] Performance metrics documented

---

## Phase 2: Core Features (Week 3-4)

### Week 3: Conversation Management

#### Day 11-12: Conversation State

**Design State Schema:**
- [ ] Define session structure
- [ ] Define conversation history format
- [ ] Define context data structure
- [ ] Document schema

**Create Conversation Manager:**
- [ ] Create file: `app/services/conversation_state_service.py`
- [ ] Function: `create_session(user_id)`
- [ ] Function: `add_turn(session_id, user_input, response)`
- [ ] Function: `get_context(session_id)`
- [ ] Function: `clear_session(session_id)`

**Choose Storage Backend:**
- [ ] Evaluate options: Redis, PostgreSQL, in-memory
- [ ] Implement chosen storage
- [ ] Add TTL for sessions (30 minutes)
- [ ] Add cleanup task

**Test Conversation State:**
- [ ] Create session
- [ ] Add multiple turns
- [ ] Retrieve context
- [ ] Verify history maintained
- [ ] Test session expiry

---

#### Day 13-14: Follow-up Handling

**Build Follow-up Logic:**
- [ ] Detect "repeat" command
- [ ] Detect "more detail" command
- [ ] Detect "what was the source" command
- [ ] Detect "skip" / "next" command
- [ ] Implement each handler

**Update Intent Parser:**
- [ ] Add conversation history to prompt
- [ ] Enable context-aware understanding
- [ ] Test with multi-turn conversations

**Test Follow-up Scenarios:**
- [ ] Search → "Tell me more about the first result"
- [ ] Summarize → "Repeat that"
- [ ] Any response → "What was the source?"
- [ ] Verify context maintained

---

#### Day 15-16: Response Formatting

**Create Response Formatter:**
- [ ] Function: `format_for_voice(search_results)`
- [ ] Natural citation phrasing
- [ ] Handle multiple results
- [ ] Add pauses for clarity
- [ ] Structure for voice output

**Handle Long Responses:**
- [ ] Detect response length
- [ ] Chunk if >30 seconds
- [ ] Offer to continue
- [ ] Allow user interruption
- [ ] Implement progressive delivery

**Test Response Quality:**
- [ ] Listen to generated responses
- [ ] Verify citations are clear
- [ ] Check for natural flow
- [ ] Adjust prompts as needed
- [ ] Get feedback from testers

---

### Week 4: Error Handling & Polish

#### Day 17-18: Error Handling

**Handle STT Failures:**
- [ ] Detect unclear audio
- [ ] Response: "I didn't catch that"
- [ ] Implement retry mechanism
- [ ] Test with noisy audio

**Handle Intent Parsing Failures:**
- [ ] Detect ambiguous commands
- [ ] Ask clarifying questions
- [ ] Implement clarification flow
- [ ] Test with ambiguous inputs

**Handle No Results:**
- [ ] Detect empty search results
- [ ] Provide helpful response
- [ ] Suggest alternatives
- [ ] Test with non-existent queries

**Handle API Timeouts:**
- [ ] Set timeout limits
- [ ] Provide status updates
- [ ] Implement fallback responses
- [ ] Test with slow connections

---

#### Day 19-20: Testing & Optimization

**Performance Testing:**
- [ ] Test with 10 different queries
- [ ] Measure end-to-end latency
- [ ] Calculate average latency
- [ ] Identify bottlenecks
- [ ] Optimize slow components

**Accuracy Testing:**
- [ ] Test STT with various accents
- [ ] Test intent recognition accuracy
- [ ] Test search result relevance
- [ ] Calculate accuracy metrics
- [ ] Target: >90% accuracy

**User Testing:**
- [ ] Recruit 3-5 test users
- [ ] Test voice quality
- [ ] Test response accuracy
- [ ] Test conversation flow
- [ ] Collect feedback

**Bug Fixes:**
- [ ] Fix issues found in testing
- [ ] Improve error messages
- [ ] Polish user experience
- [ ] Update documentation

**Deliverable:**
- [ ] Stable voice assistant MVP
- [ ] Performance report
- [ ] User feedback summary

---

## Phase 3: Advanced Features (Week 5-6)

### Week 5: Quiz Generation

#### Day 21-22: Quiz Generator

**Design Quiz Schema:**
- [ ] Define question structure
- [ ] Define answer format
- [ ] Define explanation format
- [ ] Document schema

**Implement Quiz Generation:**
- [ ] Create file: `app/services/voice_tools/quiz_tool.py`
- [ ] Function: `generate_quiz(content, num_questions)`
- [ ] Use Gemma 4 E2B to create questions
- [ ] Parse questions into structured format
- [ ] Validate question quality

**Test Quiz Generation:**
- [ ] Generate quiz from sample document
- [ ] Verify questions are relevant
- [ ] Verify answers are correct
- [ ] Check explanation quality
- [ ] Test with different topics

---

#### Day 23-24: Quiz Flow

**Create Quiz State Manager:**
- [ ] Store quiz questions
- [ ] Track current question index
- [ ] Track user score
- [ ] Track user answers
- [ ] Implement state persistence

**Implement Quiz Conversation:**
- [ ] Start quiz: Generate questions
- [ ] Ask question: Read aloud
- [ ] Wait for answer: Capture audio
- [ ] Evaluate answer: Check correctness
- [ ] Give feedback: Explain result
- [ ] Next question: Move forward or end

**Test Quiz Flow:**
- [ ] Start quiz on sample topic
- [ ] Answer all questions
- [ ] Verify score calculated correctly
- [ ] Verify feedback is helpful
- [ ] Test interruption handling

---

### Week 6: Quiz Polish & Integration

#### Day 25-26: Answer Evaluation

**Build Answer Evaluator:**
- [ ] Function: `evaluate_answer(question, correct, user_answer)`
- [ ] Use Gemma 4 E2B for flexible matching
- [ ] Handle partial correctness
- [ ] Generate helpful feedback
- [ ] Test edge cases

**Test Answer Evaluation:**
- [ ] Test exact matches
- [ ] Test paraphrased answers
- [ ] Test incorrect answers
- [ ] Test partial answers
- [ ] Verify feedback quality

---

#### Day 27-28: Quiz Integration

**Add Quiz Routes:**
- [ ] POST `/api/voice/quiz/start`
- [ ] POST `/api/voice/quiz/answer`
- [ ] GET `/api/voice/quiz/status`
- [ ] POST `/api/voice/quiz/end`

**Update HTML Test Page:**
- [ ] Add "Quiz Me" button
- [ ] Show quiz progress
- [ ] Show score
- [ ] Add quiz controls

**End-to-End Quiz Testing:**
- [ ] Start quiz via voice
- [ ] Complete full quiz
- [ ] Verify score is correct
- [ ] Test interruption
- [ ] Test error handling

**Deliverable:**
- [ ] Working quiz feature
- [ ] Quiz demo video
- [ ] User testing feedback

---

## Phase 4: Production Ready (Week 7-8)

### Week 7: Pipecat Integration

#### Day 29-30: Install Pipecat

**Install Dependencies:**
- [ ] Add Pipecat to dependencies
- [ ] Install WebRTC dependencies
- [ ] Verify installation
- [ ] Test basic Pipecat example

**Create Pipecat Pipeline:**
- [ ] Create file: `app/services/pipecat_voice_service.py`
- [ ] Set up WebRTC transport
- [ ] Add VAD processor
- [ ] Add STT processor (Faster-Whisper)
- [ ] Add LLM processor (Gemma 4 E2B)
- [ ] Add TTS processor (Piper)

**Test Pipecat Pipeline:**
- [ ] Start pipeline
- [ ] Connect from browser
- [ ] Test voice input/output
- [ ] Verify real-time streaming
- [ ] Measure latency improvement

---

#### Day 31-32: Migrate to Pipecat

**Update Voice Routes:**
- [ ] Add WebRTC signaling endpoint
- [ ] Add Pipecat session management
- [ ] Keep old routes for compatibility
- [ ] Add migration flag

**Update HTML Interface:**
- [ ] Add WebRTC connection code
- [ ] Add real-time audio streaming
- [ ] Add interruption handling
- [ ] Add connection status display

**Test Migration:**
- [ ] Test all features with Pipecat
- [ ] Compare latency (should be lower)
- [ ] Verify conversation flow smoother
- [ ] Test error handling

---

### Week 8: Deployment & Documentation

#### Day 33-34: Deployment Setup

**Create Docker Setup:**
- [ ] Update Dockerfile with dependencies
- [ ] Add Ollama to container
- [ ] Add Piper to container
- [ ] Test Docker build
- [ ] Optimize image size

**Create docker-compose:**
- [ ] Add voice assistant service
- [ ] Add Redis for state
- [ ] Configure networking
- [ ] Add environment variables
- [ ] Test docker-compose up

**Environment Configuration:**
- [ ] Create `.env.example` for voice
- [ ] Document all variables
- [ ] Set up production configs
- [ ] Add security settings

---

#### Day 35-36: Documentation & Launch

**Write User Documentation:**
- [ ] Getting started guide
- [ ] Voice command reference
- [ ] Troubleshooting guide
- [ ] FAQ
- [ ] Video tutorials

**Write Developer Documentation:**
- [ ] Architecture overview
- [ ] API documentation
- [ ] Deployment guide
- [ ] Contributing guide
- [ ] Code examples

**Final Testing:**
- [ ] Full end-to-end test
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Accessibility testing with blind users
- [ ] Load testing

**Launch Preparation:**
- [ ] Create demo video
- [ ] Prepare announcement
- [ ] Set up feedback channels
- [ ] Set up monitoring
- [ ] Deploy to production

**Deliverable:**
- [ ] Production-ready voice assistant
- [ ] Complete documentation
- [ ] Launch announcement
- [ ] Monitoring dashboard

---

## Ongoing Tasks

### Maintenance
- [ ] Monitor performance metrics
- [ ] Track error rates
- [ ] Review user feedback
- [ ] Fix reported bugs
- [ ] Update dependencies

### Improvements
- [ ] Optimize latency
- [ ] Improve accuracy
- [ ] Add requested features
- [ ] Enhance accessibility
- [ ] Expand language support

### Community
- [ ] Respond to issues
- [ ] Review pull requests
- [ ] Update documentation
- [ ] Engage with users
- [ ] Share updates

---

## Success Criteria

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
- [ ] Time to first success <5 minutes
- [ ] Error recovery <3 attempts
- [ ] Zero critical barriers

---

## Notes

### Priorities
1. **Accessibility first** - Every feature must work without screen
2. **Performance** - Keep latency <2.5s
3. **Reliability** - Handle errors gracefully
4. **User experience** - Natural conversation flow

### Risks & Mitigation
- **Risk:** Latency too high → **Mitigation:** Optimize each component, use GPU
- **Risk:** Poor accuracy → **Mitigation:** Test with diverse users, improve prompts
- **Risk:** Complex setup → **Mitigation:** Docker, clear documentation
- **Risk:** Accessibility gaps → **Mitigation:** Test with blind users early

### Resources Needed
- [ ] Development machine (8-16GB RAM)
- [ ] GPU (optional, 4-6GB VRAM)
- [ ] Test users (visually impaired)
- [ ] Accessibility consultant
- [ ] Audio recording equipment

---

## Quick Commands

### Start Development
```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend
cd surfsense_backend
python main.py

# Terminal 3: Celery
celery -A app.celery_app worker --loglevel=info
```

### Run Tests
```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# All tests
pytest
```

### Check Progress
```bash
# Count completed tasks
grep -c "\[x\]" TODO.md

# Count remaining tasks
grep -c "\[ \]" TODO.md
```

---

**Last Updated:** 2026-04-09  
**Next Review:** Start of each week  
**Questions?** Check documentation or ask in Discord

---

**Remember:** We're building independence for visually impaired users. Every task matters. 🚀
