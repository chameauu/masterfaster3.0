# Voice Assistant Architecture - High-Level Design

## Core Voice Pipeline

```
User speaks → Audio captured → Speech-to-Text → Intent Understanding →
Tool Execution → Response Generation → Text-to-Speech → User hears response
```

---

## 1. Audio Capture & Streaming

### Requirements

* Real-time microphone input
* Continuous listening with Voice Activity Detection (VAD)
* Buffer management for smooth streaming

### Key Decisions

* WebRTC for browser-based access
* Pipecat for audio streaming infrastructure
* VAD to detect speech boundaries

### Importance

* Enables hands-free operation
* No push-to-talk required
* Natural conversation flow

---

## 2. Speech-to-Text (STT)

### Requirements

* Fast transcription (<500ms)
* High accuracy across accents

### Technology

* Faster-Whisper (local, no API calls)

### Model Options

* base: recommended balance
* small: faster, less accurate
* medium: slower, more accurate

### Trade-off

* Prioritize speed for accessibility

---

## 3. Intent Understanding

### Purpose

* Detect user intent
* Extract parameters
* Route to correct tools

### Intent Types

* Search
* Summarize
* Quiz
* Follow-up

### Example

**Input:** "Search my biology notes for photosynthesis"

**Output:**

```
Intent: SEARCH
Query: photosynthesis
Filter: biology notes
Action: search_documents
```

---

## 4. Tool Execution

### Responsibilities

* Call SurfSense APIs
* Process results
* Format for response

### Mapping

| Intent    | API                 | Function           |
| --------- | ------------------- | ------------------ |
| Search    | /api/search/chunks  | Hybrid RAG search  |
| Summarize | /api/documents/{id} | Retrieve content   |
| Quiz      | /api/search/chunks  | Generate questions |
| Follow-up | Conversation state  | Context retrieval  |

---

## 5. Response Generation

### Requirements

* Natural language output
* Include citations
* Handle long responses

### Strategies

* Short responses: full playback
* Long responses: progressive delivery
* Interruptible by user

---

## 6. Text-to-Speech (TTS)

### Requirements

* Fast (<500ms)
* Natural voice

### Technology

* Piper TTS

### Voice Options

* lessac: professional
* amy: friendly

---

## 7. Conversation State Management

### Components

* Conversation history (last 5 turns)
* Session context
* Quiz state

### Storage

* PostgreSQL via LangGraph checkpointer

---

## 8. Multi-turn Conversations

### Example: Search Flow

1. User: Search query
2. System: Returns results
3. User: Follow-up
4. System: Uses context

### Example: Quiz Flow

1. Start quiz
2. Ask questions
3. Evaluate answers
4. Track score

---

## 9. Error Handling

### Scenarios

* STT failure
* Ambiguous intent
* No results
* Long processing
* User interruption

### Strategy

* Provide clear feedback
* Ask for clarification
* Allow interruption

---

## 10. Latency Budget

| Component | Target |
| --------- | ------ |
| STT       | <500ms |
| Intent    | <300ms |
| Tool      | <800ms |
| TTS       | <500ms |
| Total     | <2.3s  |

### Optimizations

* Quantized models
* GPU acceleration
* Streaming responses

---

## 11. Deployment Options

### A. Cloud

**Pros:** scalable, GPU support
**Cons:** latency, privacy concerns

### B. Local (Recommended)

**Pros:** privacy, low latency
**Cons:** hardware requirements

### C. Hybrid

**Pros:** balanced approach
**Cons:** added complexity

---

## 12. User Experience Flow

### First-time Setup

* Grant mic access
* Choose voice
* Test query

### Daily Usage

* Speak naturally
* Receive responses
* Continue conversation

### Quiz Mode

* Start quiz
* Answer questions
* Get score

---

## 13. Design Principles

### Accessibility

* Hands-free
* Natural interaction
* Clear feedback

### Performance

* <2s latency
* Streaming output
* Efficient models

### Reliability

* Error handling
* Context awareness
* Consistent behavior

---

## 14. Why Gemma 4 E2B

| Requirement    | Benefit  |
| -------------- | -------- |
| Fast inference | <300ms   |
| Intent parsing | Built-in |
| Local support  | Yes      |
| Cost           | Free     |

---

## 15. Success Criteria

### Technical

* <2s latency
* > 95% STT accuracy
* > 90% intent accuracy

### UX

* Natural conversation
* Clear voice output
* Reliable follow-ups

### Accessibility

* No screen needed
* Easy onboarding
* Privacy-first

---

## Implementation Phases

### Phase 1: Proof of Concept

* Basic voice search
* STT + TTS + intent

### Phase 2: Core Features

* Summarization
* Follow-ups
* State management

### Phase 3: Quiz Mode

* Question generation
* Score tracking

### Phase 4: Production

* Optimization
* User testing
* Deployment
