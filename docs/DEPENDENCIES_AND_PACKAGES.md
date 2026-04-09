# Voice Assistant - Dependencies and Packages

> **Complete guide to all packages, libraries, and dependencies needed for the voice-first research assistant**

---

## Overview

This document lists all required dependencies for building the voice assistant, organized by category with installation instructions, configuration examples, and integration patterns.

---

## Core Voice Processing Stack

### 1. Pipecat AI Framework

**Purpose:** Real-time voice pipeline orchestration with WebRTC support

**Package Information:**
- **PyPI:** `pipecat-ai`
- **GitHub:** https://github.com/pipecat-ai/pipecat
- **Documentation:** https://docs.pipecat.ai
- **License:** Open Source
- **Version:** Latest stable

**Installation:**
```bash
pip install pipecat-ai
```

**Key Features:**
- WebRTC transport for real-time audio streaming
- Built-in VAD (Voice Activity Detection) with Silero
- Pipeline-based architecture for audio processing
- Support for multiple STT/TTS/LLM services
- Low-latency audio streaming
- Session management

**Integration Example:**
```python
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.transports.daily.transport import DailyTransport, DailyParams

# Configure WebRTC transport
transport = DailyTransport(
    room_url,
    token,
    "Voice Assistant",
    DailyParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        transcription_enabled=True,
    ),
)

# Create pipeline
pipeline = Pipeline([
    transport.input(),
    stt_service,
    user_aggregator,
    llm_service,
    tts_service,
    transport.output(),
    assistant_aggregator,
])
```

**Dependencies:**
- `aiohttp` - Async HTTP client
- `websockets` - WebSocket support
- `numpy` - Audio processing
- `silero-vad` - Voice activity detection

---

### 2. Faster-Whisper (Speech-to-Text)

**Purpose:** Fast, accurate speech-to-text transcription

**Package Information:**
- **PyPI:** `faster-whisper`
- **GitHub:** https://github.com/guillaumekln/faster-whisper
- **Documentation:** https://github.com/guillaumekln/faster-whisper/blob/master/README.md
- **License:** MIT
- **Version:** Latest stable

**Installation:**
```bash
pip install faster-whisper
```

**Key Features:**
- 4x faster than OpenAI Whisper
- Lower memory usage with quantization
- Support for GPU acceleration (CUDA)
- Multiple model sizes (tiny, base, small, medium, large)
- Built-in VAD filtering
- Word-level timestamps
- Multilingual support (99 languages)

**Model Sizes:**
| Model | Parameters | Memory (GPU) | Memory (CPU) | Speed | Accuracy |
|-------|-----------|--------------|--------------|-------|----------|
| tiny | 39M | ~1GB | ~1GB | Fastest | Good |
| base | 74M | ~1GB | ~1GB | Very Fast | Better |
| small | 244M | ~2GB | ~2GB | Fast | Good |
| medium | 769M | ~5GB | ~5GB | Moderate | Very Good |
| large-v3 | 1550M | ~10GB | ~10GB | Slower | Best |

**Recommended for Voice Assistant:** `base` model (74M params)
- Latency: ~300ms
- Accuracy: >95%
- Memory: 1GB

**Integration Example:**
```python
from faster_whisper import WhisperModel

# Initialize model
model = WhisperModel(
    "base",
    device="cuda",  # or "cpu"
    compute_type="float16"  # or "int8" for lower memory
)

# Transcribe audio
segments, info = model.transcribe(
    audio_file,
    beam_size=5,
    vad_filter=True,  # Enable VAD
    vad_parameters={
        "threshold": 0.5,
        "min_speech_duration_ms": 250,
        "min_silence_duration_ms": 500,
    }
)

# Get transcription
for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
```

**Dependencies:**
- `ctranslate2` - Fast inference engine
- `onnxruntime` - ONNX model runtime
- `tokenizers` - Text tokenization
- `av` - Audio/video processing

---

### 3. Piper TTS (Text-to-Speech)

**Purpose:** Fast, local neural text-to-speech synthesis

**Package Information:**
- **PyPI:** `piper-tts` (Python bindings)
- **GitHub:** https://github.com/rhasspy/piper
- **Documentation:** https://github.com/rhasspy/piper/blob/master/README.md
- **License:** MIT
- **Version:** Latest stable

**Installation:**

**Option 1: Binary (Recommended for production)**
```bash
# Download Piper binary
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz
tar -xzf piper_amd64.tar.gz

# Install system dependencies
sudo apt-get install espeak-ng

# Download voice model
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

**Option 2: Python library**
```bash
pip install piper-tts
```

**Key Features:**
- Fast neural TTS (latency <500ms)
- Runs locally (no API calls)
- Natural-sounding voices
- Multiple languages and voices
- Low resource usage
- ONNX model format
- Adjustable speech rate and quality

**Available Voices:**
- `en_US-lessac-medium` - Clear, professional (Recommended)
- `en_US-amy-low` - Lightweight, fast
- `en_US-libritts-high` - High quality, multi-speaker
- Many more: https://huggingface.co/rhasspy/piper-voices

**Integration Example:**

**Command-line:**
```bash
echo "Hello, this is a test" | piper \
  --model en_US-lessac-medium.onnx \
  --output-file output.wav \
  --length-scale 1.0 \
  --sentence-silence 0.2
```

**Python:**
```python
from piper import PiperVoice
import wave

# Load voice model
voice = PiperVoice.load("en_US-lessac-medium.onnx", use_cuda=False)

# Synthesize to WAV file
text = "Hello, this is a test of the Piper text to speech system."
with wave.open("output.wav", "wb") as wav_file:
    voice.synthesize(
        text=text,
        wav_file=wav_file,
        length_scale=1.0,  # Speed (1.0=normal, <1=faster, >1=slower)
        noise_scale=0.667,  # Variation
        sentence_silence=0.2  # Pause between sentences
    )

# Stream raw audio for real-time playback
for audio_bytes in voice.synthesize_stream_raw(text):
    # Process 16-bit PCM audio at 22050 Hz
    pass
```

**Dependencies:**
- `onnxruntime` - ONNX model runtime
- `espeak-ng` - Phonemization (system package)
- `numpy` - Audio processing

---

### 4. Ollama + Gemma 4 E2B (LLM)

**Purpose:** Local LLM for intent understanding and response generation

**Package Information:**
- **Ollama:** https://ollama.ai
- **Ollama Python:** `ollama`
- **GitHub:** https://github.com/ollama/ollama
- **Documentation:** https://github.com/ollama/ollama/blob/main/README.md
- **License:** MIT

**Installation:**

**Install Ollama:**
```bash
# Linux/Mac
curl https://ollama.ai/install.sh | sh

# Or download from https://ollama.ai/download
```

**Install Python client:**
```bash
pip install ollama
```

**Download Gemma 4 E2B model:**
```bash
ollama pull gemma4:2b-e2b-q4_0
```

**Model Specifications:**
- **Parameters:** 2.3B effective (5.1B with embeddings)
- **Context Window:** 128K tokens
- **Memory:** 1-1.5GB (4-bit quantization)
- **Inference Latency:** <300ms
- **Capabilities:** Chat, function calling, streaming

**Integration Example:**
```python
from ollama import chat, ChatResponse

# Basic chat completion
response: ChatResponse = chat(
    model='gemma4:2b-e2b-q4_0',
    messages=[
        {'role': 'system', 'content': 'You are a helpful voice assistant.'},
        {'role': 'user', 'content': 'Search my notes for photosynthesis'}
    ]
)
print(response.message.content)

# Streaming response
stream = chat(
    model='gemma4:2b-e2b-q4_0',
    messages=[{'role': 'user', 'content': 'Tell me about biology'}],
    stream=True
)
for chunk in stream:
    print(chunk['message']['content'], end='', flush=True)

# Function calling
def search_documents(query: str) -> dict:
    """
    Search user's documents.
    
    Args:
        query (str): The search query
    
    Returns:
        dict: Search results
    """
    # Implementation here
    pass

available_functions = {
    'search_documents': search_documents,
}

messages = [{'role': 'user', 'content': 'Search my notes for biology'}]

response = chat(
    model='gemma4:2b-e2b-q4_0',
    messages=messages,
    tools=[search_documents],  # Pass function directly
)

# Process tool calls
if response.message.tool_calls:
    for tool in response.message.tool_calls:
        func = available_functions.get(tool.function.name)
        if func:
            result = func(**tool.function.arguments)
            # Add result to conversation
            messages.append(response.message)
            messages.append({
                'role': 'tool',
                'content': str(result),
                'tool_name': tool.function.name
            })
    
    # Get final response
    final_response = chat(model='gemma4:2b-e2b-q4_0', messages=messages)
    print(final_response.message.content)
```

**Async Support:**
```python
import asyncio
from ollama import AsyncClient

async def chat_async():
    message = {'role': 'user', 'content': 'Why is the sky blue?'}
    async for part in await AsyncClient().chat(
        model='gemma4:2b-e2b-q4_0',
        messages=[message],
        stream=True
    ):
        print(part['message']['content'], end='', flush=True)

asyncio.run(chat_async())
```

**Dependencies:**
- `httpx` - HTTP client
- `pydantic` - Data validation

---

## SurfSense Backend (Existing)

### 5. FastAPI

**Purpose:** Async web framework for backend API

**Package Information:**
- **PyPI:** `fastapi`
- **Version:** 0.115+
- **Already installed in SurfSense**

**Key Features:**
- Async/await support
- Automatic API documentation
- WebSocket support
- Dependency injection
- Type hints with Pydantic

---

### 6. PostgreSQL + pgvector

**Purpose:** Database with vector search capabilities

**Package Information:**
- **PostgreSQL:** 14+
- **pgvector extension:** Latest
- **Python client:** `psycopg2` or `asyncpg`
- **Already configured in SurfSense**

**Key Features:**
- Vector similarity search
- Full ACID compliance
- JSON support
- Full-text search

---

### 7. Redis

**Purpose:** Caching and session management

**Package Information:**
- **Redis:** 7+
- **Python client:** `redis` or `aioredis`
- **Already configured in SurfSense**

**Key Features:**
- In-memory data store
- Pub/sub messaging
- Session storage
- Rate limiting

---

### 8. Elasticsearch

**Purpose:** Full-text search engine

**Package Information:**
- **Elasticsearch:** 8+
- **Python client:** `elasticsearch`
- **Already configured in SurfSense**

**Key Features:**
- Full-text search
- Faceted search
- Aggregations
- Real-time indexing

---

## Additional Python Dependencies

### Audio Processing

```bash
# Audio I/O and processing
pip install sounddevice  # Audio playback/recording
pip install soundfile    # Audio file I/O
pip install pyaudio      # Alternative audio I/O
pip install librosa      # Audio analysis
pip install numpy        # Numerical operations
```

### WebRTC and Networking

```bash
# WebRTC and real-time communication
pip install aiortc       # WebRTC implementation
pip install websockets   # WebSocket support
pip install aiohttp      # Async HTTP client
```

### Async and Concurrency

```bash
# Async utilities
pip install asyncio      # Async I/O (built-in Python 3.7+)
pip install uvloop       # Fast event loop
pip install aiofiles     # Async file operations
```

### Data Processing

```bash
# Data handling
pip install pydantic     # Data validation
pip install python-multipart  # File uploads
pip install orjson       # Fast JSON
```

### Testing and Development

```bash
# Testing
pip install pytest       # Testing framework
pip install pytest-asyncio  # Async test support
pip install httpx        # HTTP client for testing

# Development tools
pip install black        # Code formatting
pip install ruff         # Linting
pip install mypy         # Type checking
```

---

## Complete requirements.txt

Create `surfsense_backend/requirements-voice.txt`:

```txt
# Voice Assistant Core Dependencies
pipecat-ai>=0.0.1
faster-whisper>=1.0.0
ollama>=0.1.0
piper-tts>=1.2.0

# Audio Processing
sounddevice>=0.4.6
soundfile>=0.12.1
librosa>=0.10.0
numpy>=1.24.0

# WebRTC and Networking
aiortc>=1.6.0
websockets>=12.0
aiohttp>=3.9.0

# Async Utilities
uvloop>=0.19.0
aiofiles>=23.2.0

# Data Processing
pydantic>=2.5.0
python-multipart>=0.0.6
orjson>=3.9.0

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.25.0

# Development
black>=23.12.0
ruff>=0.1.0
mypy>=1.7.0

# Existing SurfSense dependencies
# (Keep all existing dependencies from surfsense_backend/requirements.txt)
```

---

## System Dependencies

### Ubuntu/Debian

```bash
# Audio libraries
sudo apt-get update
sudo apt-get install -y \
    portaudio19-dev \
    libsndfile1 \
    ffmpeg \
    espeak-ng

# Build tools (if needed)
sudo apt-get install -y \
    build-essential \
    python3-dev \
    git
```

### macOS

```bash
# Using Homebrew
brew install portaudio
brew install libsndfile
brew install ffmpeg
brew install espeak-ng
```

---

## Docker Configuration

Update `surfsense_backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    libsndfile1 \
    ffmpeg \
    espeak-ng \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl https://ollama.ai/install.sh | sh

# Install Piper TTS
WORKDIR /opt/piper
RUN wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz \
    && tar -xzf piper_amd64.tar.gz \
    && rm piper_amd64.tar.gz

# Download Piper voice model
RUN wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx \
    && wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt requirements-voice.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r requirements-voice.txt

# Copy application code
COPY . .

# Expose ports
EXPOSE 8000 8001

# Start services
CMD ["sh", "-c", "ollama serve & python main.py"]
```

---

## Environment Variables

Create `.env.voice`:

```bash
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma4:2b-e2b-q4_0

# Piper TTS Configuration
PIPER_MODEL_PATH=/opt/piper/en_US-lessac-medium.onnx
PIPER_VOICE=en_US-lessac-medium

# Faster-Whisper Configuration
WHISPER_MODEL=base
WHISPER_DEVICE=cuda  # or cpu
WHISPER_COMPUTE_TYPE=float16  # or int8

# Pipecat Configuration
PIPECAT_TRANSPORT=webrtc
PIPECAT_VAD_ENABLED=true

# Voice Assistant Configuration
VOICE_LATENCY_TARGET=2500  # milliseconds
VOICE_SESSION_TIMEOUT=1800  # seconds (30 minutes)
VOICE_MAX_AUDIO_LENGTH=300  # seconds (5 minutes)

# Redis (for conversation state)
REDIS_URL=redis://localhost:6379/1

# Existing SurfSense environment variables
# (Keep all existing variables)
```

---

## Installation Script

Create `scripts/install-voice-dependencies.sh`:

```bash
#!/bin/bash

set -e

echo "Installing Voice Assistant Dependencies..."

# Install system dependencies
echo "Installing system dependencies..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt-get update
    sudo apt-get install -y portaudio19-dev libsndfile1 ffmpeg espeak-ng
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew install portaudio libsndfile ffmpeg espeak-ng
fi

# Install Ollama
echo "Installing Ollama..."
curl https://ollama.ai/install.sh | sh

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements-voice.txt

# Download Gemma 4 E2B model
echo "Downloading Gemma 4 E2B model (1.5GB)..."
ollama pull gemma4:2b-e2b-q4_0

# Download Piper TTS
echo "Installing Piper TTS..."
mkdir -p /opt/piper
cd /opt/piper
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz
tar -xzf piper_amd64.tar.gz
rm piper_amd64.tar.gz

# Download Piper voice model
echo "Downloading Piper voice model..."
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Start Ollama: ollama serve"
echo "2. Test Gemma: ollama run gemma4:2b-e2b-q4_0 'Hello'"
echo "3. Test Piper: echo 'Hello' | /opt/piper/piper --model /opt/piper/en_US-lessac-medium.onnx"
echo "4. Start backend: python main.py"
```

Make it executable:
```bash
chmod +x scripts/install-voice-dependencies.sh
```

---

## Verification Script

Create `scripts/verify-voice-setup.py`:

```python
#!/usr/bin/env python3
"""Verify all voice assistant dependencies are installed correctly."""

import sys

def check_import(module_name, package_name=None):
    """Check if a module can be imported."""
    package_name = package_name or module_name
    try:
        __import__(module_name)
        print(f"✓ {package_name} installed")
        return True
    except ImportError:
        print(f"✗ {package_name} NOT installed")
        return False

def check_ollama():
    """Check if Ollama is installed and running."""
    try:
        import subprocess
        result = subprocess.run(['ollama', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ Ollama installed: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    print("✗ Ollama NOT installed")
    return False

def check_piper():
    """Check if Piper is installed."""
    try:
        import subprocess
        result = subprocess.run(['/opt/piper/piper', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ Piper installed")
            return True
    except FileNotFoundError:
        pass
    print("✗ Piper NOT installed")
    return False

def main():
    """Run all checks."""
    print("Checking Voice Assistant Dependencies...\n")
    
    checks = []
    
    # Core dependencies
    print("Core Dependencies:")
    checks.append(check_import('pipecat', 'pipecat-ai'))
    checks.append(check_import('faster_whisper', 'faster-whisper'))
    checks.append(check_import('ollama', 'ollama'))
    checks.append(check_ollama())
    checks.append(check_piper())
    
    # Audio processing
    print("\nAudio Processing:")
    checks.append(check_import('sounddevice'))
    checks.append(check_import('soundfile'))
    checks.append(check_import('numpy'))
    
    # Networking
    print("\nNetworking:")
    checks.append(check_import('aiohttp'))
    checks.append(check_import('websockets'))
    
    # Results
    print(f"\n{'='*50}")
    passed = sum(checks)
    total = len(checks)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All dependencies installed correctly!")
        return 0
    else:
        print("✗ Some dependencies are missing. Please install them.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
```

Make it executable:
```bash
chmod +x scripts/verify-voice-setup.py
```

Run verification:
```bash
python scripts/verify-voice-setup.py
```

---

## Quick Start Commands

```bash
# 1. Install all dependencies
./scripts/install-voice-dependencies.sh

# 2. Verify installation
python scripts/verify-voice-setup.py

# 3. Start Ollama
ollama serve

# 4. Test components
# Test Whisper
python -c "from faster_whisper import WhisperModel; print('Whisper OK')"

# Test Ollama
ollama run gemma4:2b-e2b-q4_0 "Hello"

# Test Piper
echo "Hello" | /opt/piper/piper --model /opt/piper/en_US-lessac-medium.onnx > test.wav

# 5. Start backend
cd surfsense_backend
python main.py
```

---

## Resource Requirements

### Minimum Configuration
- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 10GB
- **Network:** 10 Mbps

### Recommended Configuration
- **CPU:** 8 cores
- **RAM:** 16GB
- **GPU:** 4-6GB VRAM (optional, 10x faster)
- **Storage:** 50GB SSD
- **Network:** 50 Mbps

### Memory Breakdown
- Gemma 4 E2B: 1-1.5GB
- Faster-Whisper (base): 1GB
- Piper TTS: 500MB
- SurfSense Backend: 2-4GB
- PostgreSQL: 2-4GB
- Redis: 500MB-1GB
- **Total:** 8-12GB

---

## Troubleshooting

### Common Issues

**1. Ollama not found**
```bash
# Reinstall Ollama
curl https://ollama.ai/install.sh | sh
```

**2. Piper audio issues**
```bash
# Install espeak-ng
sudo apt-get install espeak-ng
```

**3. Faster-Whisper CUDA errors**
```bash
# Use CPU instead
export WHISPER_DEVICE=cpu
```

**4. Port conflicts**
```bash
# Check ports
lsof -i :8000  # Backend
lsof -i :11434 # Ollama
```

---

## Next Steps

1. Install all dependencies using the installation script
2. Verify installation with the verification script
3. Follow the implementation guide in `VOICE_ASSISTANT_IMPLEMENTATION_STEPS.md`
4. Start with Phase 1: Basic voice search

---

**Last Updated:** 2026-04-09  
**Questions?** Check the troubleshooting section or ask in Discord
