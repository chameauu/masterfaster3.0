"""
Audio transcription service using Faster-Whisper.

This service provides speech-to-text functionality for the voice assistant.
"""

from typing import Optional

from faster_whisper import WhisperModel
from pydantic import BaseModel


class TranscriptionResult(BaseModel):
    """Result of audio transcription."""
    
    text: str
    confidence: float
    language: str
    duration: Optional[float] = None


class AudioProcessingError(Exception):
    """Raised when audio processing fails."""
    
    pass


class TranscriptionService:
    """
    Service for transcribing audio to text using Faster-Whisper.
    
    This service uses the Faster-Whisper library for efficient speech-to-text.
    The model is loaded once and cached for performance.
    """
    
    _model: Optional[WhisperModel] = None
    
    @classmethod
    def get_model(cls) -> WhisperModel:
        """
        Get or create the Whisper model instance.
        
        The model is cached at the class level to avoid reloading
        on every transcription request.
        
        Returns:
            WhisperModel instance
        """
        if cls._model is None:
            # Use 'base' model for balance of speed and accuracy
            # Options: tiny, base, small, medium, large
            cls._model = WhisperModel("base", device="cpu", compute_type="int8")
        return cls._model
    
    def transcribe(self, audio_data: bytes) -> TranscriptionResult:
        """
        Transcribe audio data to text.
        
        Args:
            audio_data: Raw audio bytes (WAV format, 16kHz, mono, 16-bit)
        
        Returns:
            TranscriptionResult with text, confidence, and language
        
        Raises:
            ValueError: If audio data is empty
            AudioProcessingError: If transcription fails
        """
        # Validation
        if not audio_data:
            raise ValueError("Audio data is empty")
        
        # Get the model
        model = self.get_model()
        
        # Transcribe
        # Note: faster_whisper expects a file path or file-like object
        # For now, we'll save to a temporary file
        import io
        import tempfile
        
        try:
            # Create a temporary file for the audio
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_path = tmp_file.name
            
            # Transcribe
            segments, info = model.transcribe(
                tmp_path,
                language="en",  # Force English for now
                beam_size=5,
                vad_filter=True,  # Voice activity detection
            )
            
            # Collect all segments
            text_parts = []
            for segment in segments:
                text_parts.append(segment.text)
            
            # Combine text
            text = " ".join(text_parts).strip()
            
            # Calculate average confidence (language probability as proxy)
            confidence = info.language_probability
            
            return TranscriptionResult(
                text=text,
                confidence=confidence,
                language=info.language,
                duration=info.duration,
            )
            
        except Exception as e:
            raise AudioProcessingError(f"Failed to transcribe audio: {e}") from e
        
        finally:
            # Clean up temporary file
            import os
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
