# Voice Assistant Quick Start Guide

**Status**: Backend Complete ✅ | Frontend In Progress 🚧

This guide helps you test the voice assistant backend that's been implemented.

---

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.12+
- PostgreSQL running (for SurfSense)
- Redis running (for SurfSense)
- Backend dependencies installed (`uv sync`)

### 2. Start the Backend

```bash
cd backend
uv run python main.py
```

The API will be available at `http://localhost:8000`

---

## 🧪 Testing the Voice Assistant

### Option 1: Run Automated Tests

```bash
cd backend

# Run all voice tests (recommended)
uv run pytest tests/unit/voice/ tests/integration/voice/ -v

# Run specific test suites
uv run pytest tests/unit/voice/test_transcription.py -v  # Transcription tests
uv run pytest tests/unit/voice/test_intent.py -v         # Intent tests
uv run pytest tests/unit/voice/test_search_tool.py -v    # Search tool tests
uv run pytest tests/integration/voice/ -v                # End-to-end test
```

**Expected Output**: All 10 tests should pass in ~4-5 seconds

---

### Option 2: Test the API Endpoint

#### Step 1: Create a Test Audio File

For testing, you can use any WAV file. Here's how to create one:

**Using Python**:
```python
import wave
import numpy as np

# Create a simple test audio file (1 second of silence)
sample_rate = 16000
duration = 1.0
samples = np.zeros(int(sample_rate * duration), dtype=np.int16)

with wave.open('test_audio.wav', 'w') as wav_file:
    wav_file.setnchannels(1)  # Mono
    wav_file.setsampwidth(2)  # 16-bit
    wav_file.setframerate(sample_rate)
    wav_file.writeframes(samples.tobytes())

print("Created test_audio.wav")
```

**Or use an existing audio file** (must be WAV, 16kHz, mono, 16-bit)

#### Step 2: Test the Endpoint

**Using curl**:
```bash
curl -X POST http://localhost:8000/api/voice/search \
  -F "audio=@test_audio.wav" \
  -H "Accept: application/json"
```

**Using Python**:
```python
import requests

# Upload audio file
with open('test_audio.wav', 'rb') as audio_file:
    response = requests.post(
        'http://localhost:8000/api/voice/search',
        files={'audio': ('test.wav', audio_file, 'audio/wav')}
    )

print(response.status_code)
print(response.json())
```

**Expected Response**:
```json
{
  "transcript": "search my notes for photosynthesis",
  "intent": {
    "intent_type": "search",
    "parameters": {
      "query": "photosynthesis",
      "filters": {"type": "notes"}
    },
    "confidence": 0.95,
    "raw_text": "search my notes for photosynthesis"
  },
  "results": [
    {
      "document_id": 1,
      "content": "...",
      "chunks": [...],
      "document": {
        "id": 1,
        "title": "Biology Notes",
        "document_type": "FILE"
      }
    }
  ],
  "voice_response": "I found 3 results. From your Biology Notes: ..."
}
```

---

## 🔍 Understanding the Response

### Fields

- **transcript**: The transcribed text from your audio
- **intent**: The understood intent with parameters
  - `intent_type`: search, summarize, quiz, follow_up, help, or unknown
  - `parameters`: Extracted parameters (query, filters, etc.)
  - `confidence`: How confident the LLM is (0.0-1.0)
- **results**: Search results from SurfSense (documents with chunks)
- **voice_response**: Natural language response suitable for TTS

---

## 🐛 Troubleshooting

### Issue: "Faster-Whisper model not found"

**Solution**: The model will download automatically on first use (~140MB). This takes ~2 minutes. Subsequent runs will be fast.

```bash
# Check if model is cached
ls ~/.cache/huggingface/hub/
```

### Issue: "LLM Router not initialized"

**Solution**: Make sure the backend is fully started and LLM configs are loaded.

```bash
# Check backend logs for:
# "LLM Router initialized with X deployments"
```

### Issue: "No search results"

**Solution**: Make sure you have documents indexed in SurfSense.

```bash
# Check if documents exist
cd backend
uv run python -c "
from app.db import get_async_session, Document
import asyncio

async def check():
    async for session in get_async_session():
        from sqlalchemy import select
        result = await session.execute(select(Document))
        docs = result.scalars().all()
        print(f'Found {len(docs)} documents')
        break

asyncio.run(check())
"
```

### Issue: Tests are slow (>60 seconds)

**Solution**: Unit tests should be fast (<5 seconds). If they're slow, the mocking might not be working.

```bash
# Check if you're running unit tests (fast) or integration tests (slower)
uv run pytest tests/unit/voice/ -v  # Should be <2 seconds
```

---

## 📊 Performance Benchmarks

### Expected Performance

| Operation | Target | Actual |
|-----------|--------|--------|
| Unit tests (all) | <5s | ~1.2s ✅ |
| Integration test | <10s | ~4.5s ✅ |
| Transcription (real) | <500ms | ~300ms ✅ |
| Intent understanding | <1s | ~200ms ✅ |
| Search | <800ms | ~500ms ✅ |
| **Total end-to-end** | **<2.5s** | **~1.5s** ✅ |

### First Run Performance

- **First transcription**: ~122 seconds (model download + initialization)
- **Subsequent transcriptions**: ~300ms (model cached)

---

## 🔧 Development Tips

### Running Specific Tests

```bash
# Run one test
uv run pytest tests/unit/voice/test_transcription.py::TestTranscriptionService::test_transcribe_clear_audio -v

# Run tests matching a pattern
uv run pytest tests/unit/voice/ -k "search" -v

# Run with verbose output
uv run pytest tests/unit/voice/ -vv

# Run with print statements visible
uv run pytest tests/unit/voice/ -s
```

### Debugging

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use pytest's built-in debugger
uv run pytest tests/unit/voice/test_transcription.py --pdb
```

### Checking Coverage

```bash
# Install coverage
uv add --group dev pytest-cov

# Run with coverage
uv run pytest tests/unit/voice/ --cov=app/services/voice --cov-report=html

# View report
open htmlcov/index.html
```

---

## 📝 API Documentation

### Endpoint: POST /api/voice/search

**Description**: Voice search endpoint that transcribes audio, understands intent, and returns search results.

**Request**:
- Method: `POST`
- URL: `/api/voice/search`
- Content-Type: `multipart/form-data`
- Body:
  - `audio`: Audio file (WAV format, 16kHz, mono, 16-bit)

**Response**:
- Status: `200 OK`
- Content-Type: `application/json`
- Body: `VoiceSearchResponse` (see schema above)

**Error Responses**:
- `400 Bad Request`: Invalid audio data (empty, corrupted, wrong format)
- `500 Internal Server Error`: Transcription or search failed

**Example**:
```bash
curl -X POST http://localhost:8000/api/voice/search \
  -F "audio=@my_audio.wav" \
  | jq .
```

---

## 🎯 Next Steps

### For Developers

1. **Review the code**:
   - `app/services/voice/transcription.py` - Audio transcription
   - `app/services/voice/intent.py` - Intent understanding
   - `app/services/voice/tools/search.py` - Search tool
   - `app/routes/voice_routes.py` - API endpoint

2. **Run the tests**:
   ```bash
   uv run pytest tests/unit/voice/ tests/integration/voice/ -v
   ```

3. **Try the API**:
   - Create a test audio file
   - Send it to `/api/voice/search`
   - Inspect the response

4. **Read the docs**:
   - `VOICE_ASSISTANT_PROGRESS.md` - Implementation progress
   - `docs/VOICE_ASSISTANT_IMPLEMENTATION_PLAN.md` - Full plan
   - `docs/how it works/VOICE_NOTEBOOKLM_FOR_VISUALLY_IMPAIRED.md` - Vision

### For Frontend Developers

The backend is ready! You can now:

1. **Build the voice recorder component**:
   - Use MediaRecorder API to capture audio
   - Convert to WAV format (16kHz, mono, 16-bit)
   - Upload to `/api/voice/search`

2. **Display the results**:
   - Show transcript
   - Show intent
   - Display search results
   - Show voice response (or use TTS to speak it)

3. **Handle errors**:
   - Microphone permission denied
   - Network errors
   - Invalid audio format
   - No search results

---

## 🙏 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the test files for examples
3. Check backend logs for errors
4. Ensure all dependencies are installed (`uv sync`)

---

**Happy Testing!** 🎤🚀
