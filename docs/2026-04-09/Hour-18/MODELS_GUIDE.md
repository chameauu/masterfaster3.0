# Models Guide - Complete Reference

**Project:** Voice-First Research Assistant for Visually Impaired Users  
**Last Updated:** 2026-04-09

---

## 📋 Table of Contents

1. [Generation Models (LLM)](#generation-models-llm)
2. [Embedding Models](#embedding-models)
3. [Speech-to-Text Models (STT)](#speech-to-text-models-stt)
4. [Text-to-Speech Models (TTS)](#text-to-speech-models-tts)
5. [Model Selection Guide](#model-selection-guide)
6. [Configuration Examples](#configuration-examples)

---

## 🎯 Generation Models (LLM)

### Purpose
Generate human-like text responses for:
- Chat conversations
- Document summarization
- Question answering
- Intent understanding
- Quiz generation

---

### 1. Azure OpenAI GPT-4o Mini

**Current Configuration** ✅

**What It Does:**
- Generates intelligent responses to user questions
- Understands context from conversation history
- Summarizes long documents into concise answers
- Creates quiz questions from content
- Formats responses naturally for voice output

**Specifications:**
- **Provider:** Microsoft Azure OpenAI
- **Model:** gpt-4o-mini
- **Context Window:** 128,000 tokens (~96,000 words)
- **Output Tokens:** 16,384 max
- **Speed:** ~50-100 tokens/second
- **Cost:** $0.15/1M input tokens, $0.60/1M output tokens
- **Latency:** 200-500ms (cloud)

**Strengths:**
- ✅ Excellent reasoning and comprehension
- ✅ Follows instructions precisely
- ✅ Good at structured output (JSON)
- ✅ Multilingual support
- ✅ Cost-effective for production

**Weaknesses:**
- ❌ Requires internet connection
- ❌ API costs (though minimal)
- ❌ Data sent to cloud (privacy concern)

**Use Cases:**
- Main chat interface
- Document Q&A
- Summarization
- Report generation

**Configuration:**
```env
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

---

### 2. Gemma 4 E2B (2.3B)

**Planned for Voice Assistant** 🎤

**What It Does:**
- **Intent Understanding:** Determines what user wants (search, summarize, quiz)
- **Parameter Extraction:** Extracts key information from voice commands
- **Quick Responses:** Generates short, focused answers
- **Offline Operation:** Works without internet

**Specifications:**
- **Provider:** Google (via Ollama)
- **Model Size:** 2.3 billion parameters
- **Quantization:** Q4_0 (4-bit quantized)
- **Download Size:** 1.5GB
- **RAM Required:** 3-4GB
- **Speed:** 20-40 tokens/second (CPU), 100+ tokens/second (GPU)
- **Cost:** Free (local)
- **Latency:** 100-300ms (local)

**Strengths:**
- ✅ Fast inference on consumer hardware
- ✅ No API costs
- ✅ Privacy-first (all local)
- ✅ Works offline
- ✅ Good for structured tasks

**Weaknesses:**
- ❌ Less capable than GPT-4
- ❌ Requires local resources
- ❌ Limited context window (8K tokens)

**Use Cases:**
- Voice intent classification
- Quick parameter extraction
- Offline voice assistant
- Privacy-sensitive applications

**Installation:**
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Download Gemma 4 E2B
ollama pull gemma4:2b-e2b-q4_0

# Test it
ollama run gemma4:2b-e2b-q4_0 "Hello!"
```

**Configuration:**
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:2b-e2b-q4_0
```

---

### 3. Other Supported LLMs

**Via LiteLLM Integration:**

| Provider | Models | Use Case |
|----------|--------|----------|
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-3.5 | Best quality, higher cost |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus | Long context, analysis |
| **Google** | Gemini 1.5 Pro, Gemini 1.5 Flash | Multimodal, fast |
| **Ollama** | Llama 3, Mistral, Phi-3 | Local, privacy |
| **Groq** | Llama 3 70B, Mixtral 8x7B | Ultra-fast inference |
| **Together AI** | Various open models | Cost-effective |

**Configuration Example (OpenAI):**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

---

## 📊 Embedding Models

### Purpose
Convert text into numerical vectors (embeddings) for:
- Semantic search (find similar documents)
- Document retrieval (RAG - Retrieval Augmented Generation)
- Clustering and classification
- Similarity comparison

---

### 1. sentence-transformers/all-MiniLM-L6-v2

**Current Configuration** ✅

**What It Does:**
- Converts documents into 384-dimensional vectors
- Enables semantic search (meaning-based, not keyword-based)
- Powers the RAG system for accurate document retrieval
- Finds relevant chunks when user asks questions

**Example:**
```
User: "How does photosynthesis work?"

1. Embedding model converts query → [0.23, -0.45, 0.67, ...]
2. Compares with document embeddings in database
3. Finds most similar documents (cosine similarity)
4. Returns: Biology textbook, Chapter 3, Page 23
```

**Specifications:**
- **Provider:** Hugging Face (sentence-transformers)
- **Model Size:** 90MB
- **Embedding Dimensions:** 384
- **Max Sequence Length:** 256 tokens (~200 words)
- **Speed:** ~1000 sentences/second (CPU)
- **Quality:** Good for general-purpose search
- **Cost:** Free (local)

**Strengths:**
- ✅ Small and fast
- ✅ Good accuracy for most use cases
- ✅ Low memory footprint
- ✅ No API costs
- ✅ Works offline

**Weaknesses:**
- ❌ Limited to 256 tokens (can't embed long documents)
- ❌ Lower quality than larger models
- ❌ English-focused (limited multilingual)

**Use Cases:**
- Document search
- Question answering
- Semantic similarity
- Content recommendation

**Performance:**
- **Retrieval Accuracy:** ~85% (BEIR benchmark)
- **Speed:** 1ms per document (CPU)
- **Memory:** ~500MB RAM when loaded

**Configuration:**
```env
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

### 2. Alternative Embedding Models

#### A. text-embedding-3-small (Azure OpenAI)

**What It Does:**
- Higher quality embeddings than MiniLM
- Better semantic understanding
- Supports 100+ languages

**Specifications:**
- **Dimensions:** 1536
- **Max Tokens:** 8191
- **Cost:** $0.02/1M tokens
- **Quality:** Excellent

**When to Use:**
- Need better search accuracy
- Multilingual documents
- Budget allows API costs

**Configuration:**
```env
EMBEDDING_MODEL=azure/text-embedding-3-small
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-small
```

---

#### B. all-mpnet-base-v2 (Local)

**What It Does:**
- Better quality than MiniLM
- Still runs locally
- Good balance of speed and accuracy

**Specifications:**
- **Size:** 420MB
- **Dimensions:** 768
- **Max Tokens:** 384
- **Quality:** Better than MiniLM

**When to Use:**
- Need better accuracy than MiniLM
- Want to stay local (no API)
- Have enough RAM/storage

**Configuration:**
```env
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
```

---

#### C. bge-large-en-v1.5 (Local)

**What It Does:**
- State-of-the-art local embeddings
- Best quality for English
- Used in production systems

**Specifications:**
- **Size:** 1.3GB
- **Dimensions:** 1024
- **Max Tokens:** 512
- **Quality:** Excellent

**When to Use:**
- Need best local quality
- English-only documents
- Have GPU for speed

**Configuration:**
```env
EMBEDDING_MODEL=BAAI/bge-large-en-v1.5
```

---

### Embedding Model Comparison

| Model | Size | Dims | Quality | Speed | Cost |
|-------|------|------|---------|-------|------|
| **MiniLM-L6-v2** ✅ | 90MB | 384 | Good | Fast | Free |
| **mpnet-base-v2** | 420MB | 768 | Better | Medium | Free |
| **bge-large-en** | 1.3GB | 1024 | Best | Slow | Free |
| **text-embedding-3-small** | API | 1536 | Excellent | Fast | $0.02/1M |
| **text-embedding-3-large** | API | 3072 | Best | Medium | $0.13/1M |

---

## 🎤 Speech-to-Text Models (STT)

### Purpose
Convert spoken audio into text for:
- Voice commands
- Voice search
- Transcription
- Accessibility

---

### 1. Faster-Whisper (Base Model)

**Current Configuration** ✅

**What It Does:**
- Listens to user's voice
- Converts speech to text in real-time
- Handles accents and background noise
- Supports 99 languages

**How It Works:**
```
User speaks: "Search my notes for photosynthesis"
    ↓
Audio captured (5 seconds, 16kHz)
    ↓
Faster-Whisper processes
    ↓
Text output: "Search my notes for photosynthesis"
    ↓
Sent to intent understanding
```

**Specifications:**
- **Provider:** OpenAI Whisper (optimized by Guillaume Klein)
- **Model:** base (74M parameters)
- **Download Size:** 140MB
- **Languages:** 99 (including English, Spanish, French, etc.)
- **Accuracy:** >95% (English)
- **Speed:** 4x faster than original Whisper
- **Latency:** 200-500ms for 5-second audio
- **Cost:** Free (local)

**Model Sizes:**

| Model | Size | Params | Speed | Accuracy | Use Case |
|-------|------|--------|-------|----------|----------|
| **tiny** | 39MB | 39M | Fastest | 85% | Quick commands |
| **base** ✅ | 140MB | 74M | Fast | 95% | General use |
| **small** | 466MB | 244M | Medium | 97% | Better accuracy |
| **medium** | 1.5GB | 769M | Slow | 98% | High accuracy |
| **large** | 2.9GB | 1550M | Slowest | 99% | Best quality |

**Strengths:**
- ✅ Excellent accuracy
- ✅ Multilingual support
- ✅ Handles accents well
- ✅ Works offline
- ✅ No API costs
- ✅ Punctuation and capitalization

**Weaknesses:**
- ❌ Requires CPU/GPU resources
- ❌ Slower than cloud APIs
- ❌ Large model sizes

**Use Cases:**
- Voice assistant input
- Meeting transcription
- Accessibility features
- Offline voice control

**Performance:**
- **Word Error Rate (WER):** 5% (English)
- **Real-time Factor:** 0.2 (5x faster than audio length)
- **Memory:** 1-2GB RAM

**Configuration:**
```env
STT_SERVICE=local/base
WHISPER_MODEL=base
```

**Installation:**
```bash
# Already included in pyproject.toml
uv sync

# Models download automatically on first use
```

---

### 2. Alternative STT Models

#### A. Faster-Whisper (Tiny)

**When to Use:**
- Ultra-low latency needed (<100ms)
- Limited hardware
- Simple voice commands

**Trade-off:** Lower accuracy (85%)

```env
WHISPER_MODEL=tiny
```

---

#### B. Faster-Whisper (Large)

**When to Use:**
- Need best accuracy
- Have GPU
- Transcription quality critical

**Trade-off:** Slower (1-2s latency)

```env
WHISPER_MODEL=large-v3
```

---

#### C. Azure Speech-to-Text (Cloud)

**When to Use:**
- Need real-time streaming
- Want speaker diarization
- Budget allows API costs

**Cost:** $1/hour of audio

```env
STT_SERVICE=azure
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=eastus
```

---

## 🗣️ Text-to-Speech Models (TTS)

### Purpose
Convert text responses into natural-sounding speech for:
- Voice assistant responses
- Accessibility
- Hands-free operation
- Natural conversation

---

### 1. Piper TTS

**Current Configuration** ✅

**What It Does:**
- Converts text responses to natural speech
- Provides voice feedback to user
- Enables fully hands-free operation
- Sounds human-like and clear

**How It Works:**
```
Response text: "I found 3 notes about photosynthesis..."
    ↓
Piper TTS processes
    ↓
Audio generated (WAV format)
    ↓
Played to user through speakers
```

**Specifications:**
- **Provider:** Rhasspy (open source)
- **Model:** en_US-lessac-medium
- **Download Size:** 50MB
- **Voice:** Female, American English
- **Quality:** Natural, clear
- **Speed:** Real-time (1x audio length)
- **Latency:** 100-300ms
- **Cost:** Free (local)

**Available Voices:**

| Voice | Gender | Accent | Quality | Size |
|-------|--------|--------|---------|------|
| **lessac-medium** ✅ | Female | US | High | 50MB |
| **lessac-low** | Female | US | Medium | 20MB |
| **ljspeech** | Female | US | High | 50MB |
| **ryan** | Male | US | High | 50MB |
| **amy** | Female | UK | High | 50MB |

**Strengths:**
- ✅ Natural sounding
- ✅ Fast generation
- ✅ Works offline
- ✅ No API costs
- ✅ Multiple voices
- ✅ Adjustable speed

**Weaknesses:**
- ❌ Limited emotional expression
- ❌ English-focused
- ❌ Can sound robotic for complex text

**Use Cases:**
- Voice assistant responses
- Reading documents aloud
- Accessibility features
- Notifications

**Performance:**
- **Real-time Factor:** 1.0 (generates as fast as playback)
- **Quality:** MOS 4.0/5.0 (Mean Opinion Score)
- **Memory:** 200MB RAM

**Configuration:**
```env
TTS_SERVICE=local/piper
TTS_VOICE=en_US-lessac-medium
```

**Installation:**
```bash
# Download Piper
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz
tar -xzf piper_amd64.tar.gz

# Download voice model
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
```

---

### 2. Kokoro TTS

**Alternative Configuration**

**What It Does:**
- Higher quality than Piper
- More natural prosody
- Better emotional expression

**Specifications:**
- **Provider:** Kokoro (open source)
- **Size:** 100MB
- **Quality:** Excellent
- **Speed:** Real-time

**When to Use:**
- Need better voice quality
- Have extra storage
- Want more natural speech

**Configuration:**
```env
TTS_SERVICE=local/kokoro
```

---

### 3. Azure Text-to-Speech (Cloud)

**When to Use:**
- Need best quality
- Want multiple voices
- Need SSML support (emphasis, pauses)

**Specifications:**
- **Voices:** 400+ voices, 140+ languages
- **Quality:** Excellent (neural voices)
- **Cost:** $15/1M characters

**Configuration:**
```env
TTS_SERVICE=azure
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=eastus
AZURE_TTS_VOICE=en-US-JennyNeural
```

---

## 🎯 Model Selection Guide

### For Voice Assistant (Recommended)

```
┌─────────────────────────────────────────┐
│         Voice Assistant Pipeline        │
├─────────────────────────────────────────┤
│                                         │
│  User speaks                            │
│    ↓                                    │
│  Faster-Whisper (base) → Text          │
│    ↓                                    │
│  Gemma 4 E2B → Intent + Parameters     │
│    ↓                                    │
│  MiniLM-L6-v2 → Find relevant docs     │
│    ↓                                    │
│  Azure GPT-4o Mini → Generate response │
│    ↓                                    │
│  Piper TTS → Speech                    │
│    ↓                                    │
│  User hears response                   │
│                                         │
└─────────────────────────────────────────┘
```

**Why This Combination:**
- ✅ Fast (<2s end-to-end)
- ✅ Accurate (>90% success rate)
- ✅ Cost-effective (~$0.01 per conversation)
- ✅ Privacy-friendly (most processing local)
- ✅ Works offline (except LLM)

---

### By Use Case

#### 1. Maximum Privacy (All Local)
```
STT: Faster-Whisper (base)
LLM: Gemma 4 E2B (Ollama)
Embeddings: MiniLM-L6-v2
TTS: Piper
```
**Trade-off:** Lower LLM quality

---

#### 2. Best Quality (Cloud)
```
STT: Azure Speech-to-Text
LLM: Azure GPT-4o
Embeddings: text-embedding-3-large
TTS: Azure Neural TTS
```
**Trade-off:** Higher cost, requires internet

---

#### 3. Balanced (Current Setup) ✅
```
STT: Faster-Whisper (base) - Local
LLM: Azure GPT-4o Mini - Cloud
Embeddings: MiniLM-L6-v2 - Local
TTS: Piper - Local
```
**Trade-off:** Best balance of quality, cost, and privacy

---

#### 4. Ultra-Fast (Low Latency)
```
STT: Faster-Whisper (tiny)
LLM: Groq Llama 3 70B
Embeddings: MiniLM-L6-v2
TTS: Piper (low quality)
```
**Trade-off:** Lower accuracy

---

## 📊 Performance Comparison

### Latency Breakdown (Current Setup)

| Stage | Model | Time | Cumulative |
|-------|-------|------|------------|
| Audio Capture | - | 100ms | 100ms |
| STT | Faster-Whisper | 300ms | 400ms |
| Intent | Gemma 4 E2B | 200ms | 600ms |
| Embedding | MiniLM-L6-v2 | 50ms | 650ms |
| Search | PostgreSQL | 100ms | 750ms |
| LLM | Azure GPT-4o Mini | 500ms | 1250ms |
| TTS | Piper | 200ms | 1450ms |
| Audio Playback | - | 50ms | 1500ms |

**Total:** ~1.5 seconds ✅ (Target: <2.5s)

---

### Cost Comparison (1000 conversations)

| Model | Type | Cost |
|-------|------|------|
| Faster-Whisper | Local | $0 |
| MiniLM-L6-v2 | Local | $0 |
| Piper TTS | Local | $0 |
| Azure GPT-4o Mini | Cloud | $10 |
| **Total** | | **$10** |

**vs. All Cloud:**
- Azure STT: $10
- Azure GPT-4: $50
- Azure Embeddings: $2
- Azure TTS: $15
- **Total:** $77

**Savings:** 87% cost reduction

---

## ⚙️ Configuration Examples

### 1. Current Setup (Balanced)

```env
# .env file

# Embeddings (Local)
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# LLM (Cloud)
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# STT (Local)
STT_SERVICE=local/base
WHISPER_MODEL=base

# TTS (Local)
TTS_SERVICE=local/piper
TTS_VOICE=en_US-lessac-medium
```

---

### 2. All Local (Privacy-First)

```env
# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:2b-e2b-q4_0

# STT
STT_SERVICE=local/base
WHISPER_MODEL=base

# TTS
TTS_SERVICE=local/piper
TTS_VOICE=en_US-lessac-medium
```

---

### 3. All Cloud (Best Quality)

```env
# Embeddings
EMBEDDING_MODEL=azure/text-embedding-3-large
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# LLM
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# STT
STT_SERVICE=azure
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=eastus

# TTS
TTS_SERVICE=azure
AZURE_TTS_VOICE=en-US-JennyNeural
```

---

### 4. Ultra-Fast (Low Latency)

```env
# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# LLM (Groq - fastest inference)
GROQ_API_KEY=your-key
GROQ_MODEL=llama-3.1-70b-versatile

# STT
STT_SERVICE=local/tiny
WHISPER_MODEL=tiny

# TTS
TTS_SERVICE=local/piper
TTS_VOICE=en_US-lessac-low
```

---

## 🔧 Switching Models

### Change Embedding Model

```bash
# Edit .env
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2

# Restart backend
uv run python main.py

# Re-index documents (embeddings changed)
# This happens automatically on next document upload
```

---

### Change LLM Model

**Via Dashboard (Recommended):**
1. Go to Settings → LLM Configuration
2. Add new config
3. Select provider and model
4. Save

**Via .env:**
```bash
# Edit .env
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Restart backend
uv run python main.py
```

---

### Change STT Model

```bash
# Edit .env
WHISPER_MODEL=small

# Restart backend
uv run python main.py

# Model downloads automatically on first use
```

---

### Change TTS Voice

```bash
# Edit .env
TTS_VOICE=en_US-ryan-medium

# Download voice model
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx

# Restart backend
uv run python main.py
```

---

## 📚 Additional Resources

### Model Documentation
- **Faster-Whisper:** https://github.com/guillaumekln/faster-whisper
- **Sentence Transformers:** https://www.sbert.net/
- **Piper TTS:** https://github.com/rhasspy/piper
- **Ollama:** https://ollama.ai/
- **Azure OpenAI:** https://learn.microsoft.com/en-us/azure/ai-services/openai/

### Benchmarks
- **MTEB (Embeddings):** https://huggingface.co/spaces/mteb/leaderboard
- **OpenLLM Leaderboard:** https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard
- **Whisper Evaluation:** https://github.com/openai/whisper#available-models-and-languages

### Model Hubs
- **Hugging Face:** https://huggingface.co/models
- **Ollama Library:** https://ollama.ai/library
- **Piper Voices:** https://huggingface.co/rhasspy/piper-voices

---

## 🎯 Quick Reference

### Current Models (Your Setup)

| Purpose | Model | Location | Size | Cost |
|---------|-------|----------|------|------|
| **Chat** | Azure GPT-4o Mini | Cloud | - | $0.01/1K |
| **Embeddings** | MiniLM-L6-v2 | Local | 90MB | Free |
| **STT** | Faster-Whisper (base) | Local | 140MB | Free |
| **TTS** | Piper (lessac-medium) | Local | 50MB | Free |

**Total Storage:** 280MB  
**Total Cost:** ~$10/1000 conversations  
**Latency:** ~1.5 seconds  
**Quality:** Excellent

---

**This setup is optimized for the voice assistant project - fast, accurate, and cost-effective!** 🚀
