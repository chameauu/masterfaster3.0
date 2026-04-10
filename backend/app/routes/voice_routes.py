"""
Voice assistant API routes.

Provides endpoints for voice-based interaction with SurfSense.
"""

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.voice.intent import Intent, IntentService
from app.services.voice.tools.search import SearchTool
from app.services.voice.transcription import TranscriptionService

router = APIRouter(prefix="/voice", tags=["voice"])


class VoiceSearchResponse(BaseModel):
    """Response from voice search endpoint."""

    transcript: str
    intent: Intent
    results: list[dict]
    voice_response: str


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file for transcription"),
):
    """
    Simple transcription endpoint.

    Transcribes audio to text without intent understanding or search.
    Used by always-listening voice interface in dashboard.

    Args:
        audio: Audio file upload (any format supported by Faster-Whisper)

    Returns:
        JSON with transcript text

    Raises:
        HTTPException: If transcription fails
    """
    try:
        # Read audio data
        audio_data = await audio.read()

        if not audio_data:
            raise HTTPException(status_code=400, detail="Empty audio file")

        print(
            f"[Voice/Transcribe] Received audio: {len(audio_data)} bytes, content_type: {audio.content_type}"
        )

        # Transcribe
        transcription_service = TranscriptionService()
        transcription_result = transcription_service.transcribe(audio_data)

        print(f"[Voice/Transcribe] Transcription: {transcription_result.text}")

        return {
            "transcript": transcription_result.text,
            "confidence": transcription_result.confidence,
        }

    except ValueError as e:
        print(f"[Voice/Transcribe] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[Voice/Transcribe] Exception: {type(e).__name__}: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e!s}")


@router.post("/search", response_model=VoiceSearchResponse)
async def voice_search(
    audio: UploadFile = File(..., description="Audio file (WAV format)"),
):
    """
    Voice search endpoint.

    Complete flow:
    1. Transcribe audio to text (STT)
    2. Understand intent from text
    3. Execute search based on intent
    4. Return results with voice-formatted response

    Args:
        audio: Audio file upload (WAV format, 16kHz, mono, 16-bit)

    Returns:
        VoiceSearchResponse with transcript, intent, results, and voice response

    Raises:
        HTTPException: If transcription or search fails
    """
    try:
        # Step 1: Transcribe audio
        audio_data = await audio.read()

        if not audio_data:
            raise HTTPException(status_code=400, detail="Empty audio file")

        print(
            f"[Voice] Received audio: {len(audio_data)} bytes, content_type: {audio.content_type}"
        )

        transcription_service = TranscriptionService()
        transcription_result = transcription_service.transcribe(audio_data)

        print(f"[Voice] Transcription: {transcription_result.text}")

        # Step 2: Understand intent
        intent_service = IntentService()
        intent = intent_service.understand(transcription_result.text)

        print(f"[Voice] Intent: {intent.intent_type.value}")

        # Step 3: Execute search based on intent
        if intent.intent_type.value == "search":
            search_tool = SearchTool()
            search_result = await search_tool.handle_search(
                query=intent.parameters.get("query", transcription_result.text),
                filters=intent.parameters.get("filters", {}),
                user_id=None,  # TODO: Get from auth
                search_space_id=1,  # TODO: Get from user context
            )

            return VoiceSearchResponse(
                transcript=transcription_result.text,
                intent=intent,
                results=search_result.documents,
                voice_response=search_result.voice_response,
            )
        else:
            # For now, only search is implemented
            return VoiceSearchResponse(
                transcript=transcription_result.text,
                intent=intent,
                results=[],
                voice_response=f"I understood your intent as '{intent.intent_type.value}', but this feature is not yet implemented. Currently, only search is supported.",
            )

    except ValueError as e:
        print(f"[Voice] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[Voice] Exception: {type(e).__name__}: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voice search failed: {e!s}")
