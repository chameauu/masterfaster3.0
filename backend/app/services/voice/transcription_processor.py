"""
Pipecat Transcription Processor.

Custom Pipecat processor that wraps the existing TranscriptionService
to integrate Faster-Whisper into the Pipecat pipeline.

Example:
    >>> processor = TranscriptionProcessor()
    >>> async for frame in processor.process_frame(audio_frame, direction):
    ...     if isinstance(frame, TranscriptionFrame):
    ...         print(f"Transcribed: {frame.text}")
"""

import logging
import wave
import io
from typing import AsyncGenerator

from pipecat.frames.frames import (
    Frame,
    AudioRawFrame,
    TranscriptionFrame,
    ErrorFrame,
)
from pipecat.processors.frame_processor import FrameProcessor

from .transcription import TranscriptionService, AudioProcessingError

logger = logging.getLogger(__name__)


class TranscriptionError(Exception):
    """Base exception for transcription processor errors."""
    pass


class AudioConversionError(TranscriptionError):
    """Raised when audio format conversion fails."""
    pass


class TranscriptionProcessor(FrameProcessor):
    """
    Pipecat processor for speech-to-text transcription.
    
    This processor:
    1. Receives AudioRawFrame from user aggregator (after VAD)
    2. Converts audio to WAV format
    3. Sends to TranscriptionService (Faster-Whisper)
    4. Emits TranscriptionFrame with the text
    
    The processor integrates the existing TranscriptionService into
    the Pipecat pipeline, maintaining separation of concerns.
    
    Attributes:
        transcription_service: Faster-Whisper transcription service
        
    Example:
        >>> processor = TranscriptionProcessor()
        >>> # In pipeline: user_aggregator → processor → output
        >>> async for frame in processor.process_frame(audio_frame, direction):
        ...     if isinstance(frame, TranscriptionFrame):
        ...         print(f"User said: {frame.text}")
    """
    
    def __init__(self):
        """
        Initialize transcription processor.
        
        Creates a new TranscriptionService instance with Faster-Whisper.
        The service is initialized with default settings (base model, auto language).
        
        Raises:
            TranscriptionError: If transcription service initialization fails
        """
        super().__init__()
        try:
            self.transcription_service = TranscriptionService()
            logger.info("Initialized TranscriptionProcessor with Faster-Whisper")
        except Exception as e:
            logger.error(f"Failed to initialize transcription service: {e}", exc_info=True)
            raise TranscriptionError(f"Transcription service initialization failed: {e}") from e
    
    async def process_frame(self, frame: Frame, direction) -> AsyncGenerator[Frame, None]:
        """
        Process a frame through the transcription pipeline.
        
        Only AudioRawFrame instances are transcribed. Other frame types
        are passed through unchanged.
        
        Args:
            frame: Input frame (AudioRawFrame or other)
            direction: Frame direction (not used)
            
        Yields:
            TranscriptionFrame: If audio was successfully transcribed
            ErrorFrame: If transcription or conversion failed
            Frame: Original frame if not an AudioRawFrame
            
        Example:
            >>> async for frame in processor.process_frame(audio_frame, direction):
            ...     if isinstance(frame, TranscriptionFrame):
            ...         print(f"Transcribed: {frame.text}")
            ...     elif isinstance(frame, ErrorFrame):
            ...         print(f"Error: {frame.error}")
        """
        # Only process AudioRawFrame
        if not isinstance(frame, AudioRawFrame):
            yield frame
            return
        
        try:
            logger.debug(
                f"Processing audio frame: {len(frame.audio)} bytes, "
                f"rate={frame.sample_rate}Hz, channels={frame.num_channels}"
            )
            
            # Convert audio to WAV format
            try:
                audio_wav = self._convert_to_wav(
                    frame.audio, 
                    frame.sample_rate, 
                    frame.num_channels
                )
                logger.debug(f"Converted to WAV: {len(audio_wav)} bytes")
            except Exception as e:
                logger.error(f"Audio conversion failed: {e}", exc_info=True)
                raise AudioConversionError(f"Failed to convert audio to WAV: {e}") from e
            
            # Transcribe using TranscriptionService
            try:
                result = self.transcription_service.transcribe(audio_wav)
                logger.info(
                    f"Transcribed audio: '{result.text}' "
                    f"(confidence={result.confidence:.2f}, language={result.language})"
                )
            except AudioProcessingError as e:
                logger.error(f"Transcription failed: {e}")
                raise TranscriptionError(f"Transcription failed: {e}") from e
            
            # Emit TranscriptionFrame
            yield TranscriptionFrame(
                text=result.text,
                user_id="",  # Will be set by aggregator
                timestamp=frame.timestamp if hasattr(frame, 'timestamp') else None,
            )
            
        except (AudioConversionError, TranscriptionError) as e:
            # Known errors - already logged
            yield ErrorFrame(error=str(e))
        except Exception as e:
            # Unexpected errors
            logger.error(f"Unexpected error in transcription: {e}", exc_info=True)
            yield ErrorFrame(error=f"Transcription error: {e}")
    
    def _convert_to_wav(self, audio_data: bytes, sample_rate: int, num_channels: int) -> bytes:
        """
        Convert raw PCM audio to WAV format.
        
        Takes raw PCM audio bytes and wraps them in a WAV container with
        proper headers. This is required because Faster-Whisper expects
        WAV-formatted audio.
        
        Args:
            audio_data: Raw PCM audio bytes (16-bit signed integers)
            sample_rate: Sample rate in Hz (e.g., 16000, 44100)
            num_channels: Number of channels (1 for mono, 2 for stereo)
            
        Returns:
            WAV-formatted audio bytes with proper headers
            
        Raises:
            AudioConversionError: If conversion fails (invalid parameters, etc.)
            
        Example:
            >>> processor = TranscriptionProcessor()
            >>> pcm_audio = b'\\x00\\x01\\x02\\x03...'  # Raw PCM
            >>> wav_audio = processor._convert_to_wav(pcm_audio, 16000, 1)
            >>> # wav_audio now has WAV headers and can be transcribed
        """
        if not audio_data:
            raise AudioConversionError("Audio data is empty")
        
        if sample_rate <= 0:
            raise AudioConversionError(f"Invalid sample rate: {sample_rate}")
        
        if num_channels not in (1, 2):
            raise AudioConversionError(f"Invalid number of channels: {num_channels} (must be 1 or 2)")
        
        try:
            # Create WAV file in memory
            wav_buffer = io.BytesIO()
            
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(num_channels)
                wav_file.setsampwidth(2)  # 16-bit audio
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data)
            
            # Get WAV bytes
            wav_bytes = wav_buffer.getvalue()
            
            logger.debug(
                f"Converted {len(audio_data)} bytes PCM to {len(wav_bytes)} bytes WAV "
                f"(rate={sample_rate}Hz, channels={num_channels})"
            )
            
            return wav_bytes
            
        except Exception as e:
            logger.error(f"WAV conversion failed: {e}", exc_info=True)
            raise AudioConversionError(f"Failed to create WAV file: {e}") from e
