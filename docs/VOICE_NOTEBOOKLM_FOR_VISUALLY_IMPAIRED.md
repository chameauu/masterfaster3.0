# Voice-First NotebookLM for Visually Impaired Users

## Project Vision

Building a fully voice-driven research assistant that makes SurfSense's powerful features accessible without any screen interaction. This addresses a real accessibility gap by creating a hands-free, voice-first alternative to NotebookLM specifically designed for visually impaired users.

---

## Core Concept

A voice-first research assistant that enables users to:
- Search documents by voice
- Get spoken summaries with citations
- Engage in interactive Q&A sessions
- Take quizzes on their study materials
- Access Gmail, Google Drive, and other connected sources
- All without touching a screen

---

## How It Works - Feature by Feature

### Feature 1: Voice Search
**User says:** "Search my notes for photosynthesis"

**Flow:**
1. Pipecat captures the audio stream
2. Faster-Whisper transcribes it to text
3. Claude interprets the intent and calls SurfSense's search API
4. SurfSense RAG returns relevant chunks with citations
5. Claude formats a natural response
6. Piper reads the cited answer back aloud

**Example Response:**
> "I found 3 notes about photosynthesis. From your biology notes on March 15th: Photosynthesis is the process by which plants convert light energy into chemical energy..."

---

### Feature 2: Document Summarization
**User says:** "Summarize chapter 3 of my biology PDF"

**Flow:**
1. Claude retrieves the relevant chunks via SurfSense's RAG
2. Generates a structured summary
3. Reads it out via TTS
4. User can follow up with "repeat that" or "give me more detail on the first point"

**Natural Follow-ups:**
- "Repeat that"
- "Give me more detail on the first point"
- "What about the second section?"
- "Skip to the conclusion"

---

### Feature 3: Voice Q&A Quiz Mode
**User says:** "Quiz me on chapter 3"

**Flow:**
1. Claude generates 5 questions from the retrieved content
2. Asks them one by one via TTS
3. Waits for the user's spoken answer (STT)
4. Evaluates the answer
5. Gives voice feedback
6. Continues to next question

**Example Interaction:**
```
System: "Question 1: What is the primary product of glycolysis?"
User: "Pyruvate"
System: "Correct! Pyruvate is the main product. Question 2: Where does the citric acid cycle occur?"
User: "In the mitochondria"
System: "Excellent! That's right. Question 3..."
```

**No screen needed at any point.**

---

### Feature 4: Gmail & Google Drive Integration
**User says:** "Search my emails about the exam schedule"

**Flow:**
1. SurfSense's existing Gmail connector has already indexed emails
2. Voice search works identically to document search
3. Results include email metadata (sender, date, subject)
4. User can ask follow-ups: "Read the full email" or "When did I receive this?"

**Supported Connectors (Already in SurfSense):**
- Gmail
- Google Drive
- Slack
- Notion
- Discord
- GitHub
- Jira
- Linear
- Confluence
- YouTube

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Voice Interface Layer                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Pipecat  │───▶│  Faster  │───▶│  Claude  │          │
│  │ (Audio)  │    │ Whisper  │    │ (Intent) │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       ▲                                  │               │
│       │                                  ▼               │
│  ┌──────────┐                    ┌──────────────┐      │
│  │  Piper   │◀───────────────────│ Tool Calling │      │
│  │  (TTS)   │                    │   Router     │      │
│  └──────────┘                    └──────────────┘      │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              SurfSense Backend (Existing)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Search  │  │   RAG    │  │Documents │             │
│  │   API    │  │ Retrieval│  │   API    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Gmail   │  │  Drive   │  │  Slack   │             │
│  │Connector │  │Connector │  │Connector │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## Why This Works Well

### 1. SurfSense Already Has the Foundation
✅ RAG pipeline is production-ready  
✅ Document processing handles PDFs, emails, Drive files  
✅ Search and retrieval are battle-tested  
✅ Connectors (Gmail, Drive, Slack, etc.) already exist  
✅ Faster-Whisper already in dependencies (v1.1.0+)  

### 2. Voice Layer is Smart
✅ **Pipecat** - Real-time voice pipeline framework  
✅ **Faster-Whisper** - Fast, accurate STT (already integrated)  
✅ **Piper TTS** - Fast, local, high-quality voice synthesis  
✅ **Claude** - Intent understanding + orchestration via tool calling  

### 3. Features Are Perfect for Accessibility
✅ Voice search with citations  
✅ Document summarization  
✅ Interactive Q&A quiz mode  
✅ Natural follow-ups ("repeat that", "more detail")  
✅ Fully hands-free operation  

---

## Technical Stack

### Voice Pipeline (New)
- **Pipecat** - Real-time voice framework with WebRTC support
- **Faster-Whisper** - STT (already in SurfSense dependencies)
- **Piper TTS** - High-quality, fast text-to-speech
- **Claude 3.5 Sonnet** - Intent understanding + tool orchestration

### Backend (Existing - SurfSense)
- **FastAPI** - Async web framework
- **PostgreSQL + pgvector** - Vector database
- **LangGraph** - Conversation state management
- **Existing connectors** - Gmail, Drive, Slack, Notion, etc.

### Deployment
- Docker container with voice services
- WebRTC for browser access
- Optional: Mobile app (React Native + Pipecat)

---

## Implementation Approach

### Phase 1: Core Voice Pipeline (MVP) - 1-2 weeks
**Goal:** Basic voice search working

**New Components:**
```python
# app/services/voice_assistant_service.py
# app/routes/voice_assistant_routes.py
```

**Features:**
- Voice search with TTS responses
- Document summarization
- Basic Q&A

**Deliverable:** User can say "search my notes for X" and get a spoken response

---

### Phase 2: Interactive Features - 3-4 weeks
**Goal:** Multi-turn conversations

**Features:**
- Quiz mode with multi-turn conversation
- Follow-up questions ("repeat", "more detail")
- Conversation state management
- Context retention across turns

**Deliverable:** Full quiz mode + natural follow-ups working

---

### Phase 3: Advanced Features - 6-8 weeks
**Goal:** Production-ready system

**Features:**
- Multi-document synthesis
- Study session mode (timed learning)
- Voice bookmarks ("save this for later")
- Gmail/Drive integration
- Performance optimization

**Deliverable:** Beta release for user testing

---

## Key Technical Decisions

### 1. Piper TTS vs Kokoro
**Recommendation: Piper**

**Why:**
- Faster inference (critical for real-time)
- Better voice quality for long-form content
- Lower latency
- More natural prosody
- SurfSense has Kokoro, but Piper is better for accessibility

### 2. Pipecat Integration
**Why Pipecat:**
- Built specifically for real-time voice AI
- Handles audio streaming automatically
- VAD (voice activity detection) built-in
- WebRTC support for web/mobile
- Already integrates with Whisper + LLMs
- Active community and good documentation

### 3. Claude Tool Calling
**Perfect for this use case:**

```python
tools = [
    {
        "name": "search_documents",
        "description": "Search user's documents and notes",
        "parameters": {
            "query": "string",
            "filters": "object"
        }
    },
    {
        "name": "summarize_document",
        "description": "Summarize a specific document or chapter",
        "parameters": {
            "document_id": "string",
            "section": "string"
        }
    },
    {
        "name": "generate_quiz",
        "description": "Create quiz questions from content",
        "parameters": {
            "topic": "string",
            "num_questions": "integer"
        }
    },
    {
        "name": "get_document_chunks",
        "description": "Retrieve specific sections of a document",
        "parameters": {
            "document": "string",
            "section": "string"
        }
    }
]
```

### 4. Conversation State Management
**Use SurfSense's existing infrastructure:**

```python
# Already in SurfSense!
from app.agents.new_chat.checkpointer import get_checkpointer

# Store voice conversation state
# Handle "repeat that", "more detail" context
# Maintain quiz progress
# Track user preferences
```

---

## Feature Implementation Details

### Feature 1: Voice Search Implementation

```python
# User: "Search my notes for photosynthesis"

# Step 1: Audio Capture
audio_stream = pipecat.capture_audio()

# Step 2: Speech-to-Text
transcript = faster_whisper.transcribe(audio_stream)
# Result: "search my notes for photosynthesis"

# Step 3: Intent Understanding (Claude)
claude_response = claude.chat(
    messages=[{
        "role": "user",
        "content": transcript
    }],
    tools=tools
)

# Step 4: Tool Call
tool_call = claude_response.tool_calls[0]
# {
#   "tool": "search_documents",
#   "query": "photosynthesis",
#   "filters": {"type": "notes"}
# }

# Step 5: Execute Search (SurfSense API)
results = surfsense_api.search(
    query="photosynthesis",
    filters={"type": "notes"}
)

# Step 6: Format Response
formatted_response = claude.format_response(results)
# "I found 3 notes about photosynthesis. From your biology 
#  notes on March 15th: Photosynthesis is the process..."

# Step 7: Text-to-Speech
audio_response = piper.synthesize(formatted_response)

# Step 8: Play Audio
pipecat.play_audio(audio_response)
```

---

### Feature 2: Document Summarization Implementation

```python
# User: "Summarize chapter 3 of my biology PDF"

# Step 1-2: STT
transcript = "summarize chapter 3 of my biology PDF"

# Step 3: Claude identifies document + section
tool_call = {
    "tool": "get_document_chunks",
    "document": "biology.pdf",
    "section": "chapter 3"
}

# Step 4: Retrieve chunks
chunks = surfsense_api.get_chunks(
    document="biology.pdf",
    section="chapter 3"
)

# Step 5: Generate structured summary
summary = claude.summarize(chunks)
# "Chapter 3 covers cellular respiration. First, glycolysis 
#  breaks down glucose into pyruvate. Second, the citric acid 
#  cycle produces electron carriers. Third, the electron 
#  transport chain generates ATP."

# Step 6: TTS + Play
audio = piper.synthesize(summary)
pipecat.play_audio(audio)

# Step 7: Handle follow-up
# User: "Repeat that"
# System: Replays from conversation state

# User: "Give me more detail on the first point"
# Claude: Expands on glycolysis section
```

---

### Feature 3: Quiz Mode Implementation

```python
# User: "Quiz me on chapter 3"

# Step 1: Retrieve content
chunks = surfsense_api.get_chunks(
    document="biology.pdf",
    section="chapter 3"
)

# Step 2: Generate questions
questions = claude.generate_quiz(
    content=chunks,
    num_questions=5
)

# Step 3: Conversation loop
quiz_state = {
    "questions": questions,
    "current_question": 0,
    "score": 0
}

for i, question in enumerate(questions):
    # Ask question
    audio = piper.synthesize(f"Question {i+1}: {question.text}")
    pipecat.play_audio(audio)
    
    # Wait for answer (VAD detection)
    user_audio = pipecat.wait_for_speech()
    user_answer = faster_whisper.transcribe(user_audio)
    
    # Evaluate
    evaluation = claude.evaluate_answer(
        question=question,
        answer=user_answer
    )
    
    # Provide feedback
    if evaluation.correct:
        feedback = f"Correct! {evaluation.explanation}"
        quiz_state["score"] += 1
    else:
        feedback = f"Not quite. {evaluation.explanation}"
    
    audio = piper.synthesize(feedback)
    pipecat.play_audio(audio)

# Final score
final_message = f"Quiz complete! You scored {quiz_state['score']} out of {len(questions)}."
audio = piper.synthesize(final_message)
pipecat.play_audio(audio)
```

---

## Why This Will Work

### 1. Technical Feasibility: HIGH ✅
- SurfSense backend is production-ready
- Faster-Whisper already integrated
- Just need to add Pipecat + Piper layer
- Claude tool calling is straightforward
- All components are proven technologies

### 2. User Experience: EXCELLENT ✅
- Fully hands-free operation
- Natural conversation flow
- No screen dependency
- Works with existing documents
- Intuitive voice commands

### 3. Differentiation: STRONG ✅
- NotebookLM has no voice-first mode
- Existing screen readers are clunky for research
- This is purpose-built for accessibility
- Unique value proposition

### 4. Scalability: GOOD ✅
- Piper runs locally (no API costs for TTS)
- Faster-Whisper is efficient
- Claude API costs are reasonable
- Can optimize with local LLMs later (Llama 3, etc.)

---

## Potential Challenges & Solutions

### Challenge 1: Latency
**Problem:** Voice interactions need <1s response time for natural feel

**Solutions:**
- Use Piper's streaming mode for progressive audio
- Cache common queries and responses
- Optimize Whisper model size (base or small for speed)
- WebSocket for real-time audio streaming
- Preload frequently accessed documents

**Target Latency:**
- STT: <500ms
- LLM processing: <1s
- TTS: <500ms (streaming)
- Total: <2s end-to-end

---

### Challenge 2: Citation Handling
**Problem:** How to convey "source: biology.pdf, page 23" naturally in voice

**Solutions:**
- Natural phrasing: "From your biology notes, page 23..."
- Voice bookmarks: User says "Mark this source" to save reference
- Optional: Send citations to phone/email for later review
- Repeat citations on request: "Where was that from?"

**Example:**
> "I found this in your biology textbook, chapter 3, page 45. The answer is..."

---

### Challenge 3: Long Documents
**Problem:** Summarizing 50-page PDFs takes time and attention

**Solutions:**
- Progressive summarization: "I'm reading through chapter 3... [pause] Here's what I found..."
- Chunk-by-chunk streaming with pauses
- User can interrupt: "That's enough" or "Skip to the conclusion"
- Offer different summary lengths: "brief", "detailed", "comprehensive"

**Example:**
```
System: "This is a long chapter. Would you like a brief summary or detailed walkthrough?"
User: "Brief summary"
System: "Chapter 3 covers three main topics: glycolysis, citric acid cycle, and electron transport. Would you like details on any of these?"
```

---

### Challenge 4: Ambiguity
**Problem:** "Search my notes" - which notes? Biology? Chemistry? All subjects?

**Solutions:**
- Claude clarification: "I found notes in biology, chemistry, and physics. Which subject?"
- Smart defaults based on recent activity
- User preferences: "Always search biology first"
- Context awareness: If just discussed biology, assume biology notes

**Example:**
```
User: "Search my notes for cellular respiration"
System: "I found results in biology and chemistry. Which would you like?"
User: "Biology"
System: "From your biology notes on March 15th..."
```

---

## Recommended Tech Stack Summary

```yaml
Voice Pipeline (New Layer):
  Audio Framework: Pipecat
  Speech-to-Text: Faster-Whisper (already in SurfSense)
  Text-to-Speech: Piper
  LLM Orchestration: Claude 3.5 Sonnet
  
Backend (Existing - SurfSense):
  Web Framework: FastAPI
  Database: PostgreSQL + pgvector
  Search: Elasticsearch
  Conversation State: LangGraph checkpointer
  Task Queue: Celery + Redis
  Connectors: Gmail, Drive, Slack, Notion, etc.

Deployment:
  Containerization: Docker
  Web Access: WebRTC via Pipecat
  Mobile: React Native + Pipecat (optional)
  Hosting: Self-hosted or cloud (AWS, GCP, Azure)
```

---

## Development Roadmap

### Week 1-2: Prototype
**Goal:** Proof of concept

**Tasks:**
- Set up Pipecat + Piper in development environment
- Connect to SurfSense search API
- Basic voice search working end-to-end
- Test latency and audio quality

**Deliverable:** Demo video of voice search

---

### Week 3-4: MVP
**Goal:** Core features working

**Tasks:**
- Voice search + document summarization
- Basic conversation state management
- Error handling and fallbacks
- Deploy to staging environment

**Deliverable:** Testable MVP for internal use

---

### Week 5-8: Beta
**Goal:** Feature complete

**Tasks:**
- Quiz mode implementation
- Follow-up question handling
- Gmail/Drive integration testing
- Performance optimization
- User testing with visually impaired users
- Accessibility audit

**Deliverable:** Beta release for user testing

---

### Week 9-12: Production
**Goal:** Launch-ready product

**Tasks:**
- Polish UX based on feedback
- Performance optimization (latency, accuracy)
- Mobile app development (optional)
- Documentation and tutorials
- Marketing materials
- Public launch

**Deliverable:** Production release

---

## Success Metrics

### Technical Metrics
- **Latency:** <2s end-to-end response time
- **Accuracy:** >95% STT accuracy, >90% intent recognition
- **Uptime:** 99.5% availability
- **Throughput:** Support 100+ concurrent users

### User Metrics
- **Task Completion:** >80% of voice searches successful
- **User Satisfaction:** >4.5/5 rating
- **Engagement:** Average 15+ minutes per session
- **Retention:** >60% weekly active users

### Accessibility Metrics
- **Screen-Free Usage:** 100% of features accessible without screen
- **Learning Curve:** <5 minutes to first successful interaction
- **Error Recovery:** <3 attempts to complete task on average

---

## Competitive Advantage

### vs NotebookLM
- ✅ Fully voice-first (NotebookLM requires screen)
- ✅ Purpose-built for accessibility
- ✅ Self-hosted option (privacy)
- ✅ More connectors (Gmail, Slack, etc.)

### vs Screen Readers
- ✅ Natural conversation (not just reading text)
- ✅ Intelligent summarization
- ✅ Interactive Q&A and quizzes
- ✅ Context-aware responses

### vs Voice Assistants (Alexa, Siri)
- ✅ Deep document understanding
- ✅ RAG-powered accuracy
- ✅ Academic/research focus
- ✅ Privacy (self-hosted option)

---

## Next Steps

### Immediate Actions
1. **Set up development environment**
   - Install Pipecat
   - Configure Piper TTS
   - Test Faster-Whisper integration

2. **Create voice assistant service**
   - `app/services/voice_assistant_service.py`
   - `app/routes/voice_assistant_routes.py`

3. **Build Claude tool calling router**
   - Define tool schemas
   - Implement tool execution
   - Handle responses

4. **Design conversation state management**
   - Extend LangGraph checkpointer
   - Store voice session context
   - Handle follow-ups

### Questions to Answer
- [ ] Target deployment: Cloud or self-hosted?
- [ ] Mobile app priority: High or low?
- [ ] LLM choice: Claude only or support local models?
- [ ] User authentication: Integrate with SurfSense or separate?
- [ ] Pricing model: Free, freemium, or paid?

---

## Conclusion

This is a **high-impact, technically feasible project** that addresses a real accessibility gap. SurfSense provides 80% of the backend infrastructure, and the voice layer is well-architected with proven technologies.

**Key Strengths:**
- Strong technical foundation (SurfSense)
- Clear user need (accessibility)
- Differentiated product (voice-first)
- Achievable timeline (12 weeks to launch)

**Recommended Next Step:**
Start with the prototype phase to validate the voice pipeline and user experience. The technical risk is low, and the potential impact is high.

---

## Resources

### Documentation
- [Pipecat Documentation](https://docs.pipecat.ai/)
- [Piper TTS](https://github.com/rhasspy/piper)
- [Faster-Whisper](https://github.com/guillaumekln/faster-whisper)
- [Claude API](https://docs.anthropic.com/)
- [SurfSense GitHub](https://github.com/MODSetter/SurfSense)

### Community
- SurfSense Discord: https://discord.gg/ejRNvftDp9
- Pipecat Community
- Accessibility testing groups

### Similar Projects
- NotebookLM (Google)
- Open NotebookLM (open source alternative)
- PDF2Audio (document to audio)

---

**Ready to build? Let's start with the prototype!** 🚀
