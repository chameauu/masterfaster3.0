"""
Unit tests for audio transcription service.

Following TDD principles:
- Test behavior through public interface
- One test at a time (vertical slicing)
- Tests describe what the system does, not how

Note: These are unit tests that mock the Whisper model for speed.
Integration tests with real audio are in tests/integration/voice/
"""

from unittest.mock import MagicMock, patch

import pytest

from app.services.voice.transcription import (
    AudioProcessingError,
    TranscriptionResult,
    TranscriptionService,
)


class TestTranscriptionService:
    """Test audio transcription using Faster-Whisper."""

    @patch("app.services.voice.transcription.WhisperModel")
    def test_transcribe_clear_audio(self, mock_whisper_model):
        """
        Test transcribing clear audio.
        
        Behavior: Given clear audio input, the service should return
        accurate transcription with high confidence.
        """
        # Arrange - Mock the Whisper model response
        mock_model_instance = MagicMock()
        mock_whisper_model.return_value = mock_model_instance
        
        # Mock segment with transcribed text
        mock_segment = MagicMock()
        mock_segment.text = "hello world"
        
        # Mock transcription info
        mock_info = MagicMock()
        mock_info.language = "en"
        mock_info.language_probability = 0.95
        mock_info.duration = 1.5
        
        # Configure the mock to return our test data
        mock_model_instance.transcribe.return_value = ([mock_segment], mock_info)
        
        # Create service and test audio
        service = TranscriptionService()
        audio_data = self._create_test_audio()
        
        # Act
        result = service.transcribe(audio_data)
        
        # Assert
        assert isinstance(result, TranscriptionResult)
        assert result.text == "hello world"
        assert result.confidence == 0.95
        assert result.language == "en"
        assert result.duration == 1.5
    
    def _create_test_audio(self) -> bytes:
        """
        Helper to create minimal test audio data.
        
        Returns a minimal valid WAV file header.
        The actual audio content doesn't matter for unit tests
        since we mock the Whisper model.
        """
        # Minimal WAV header (44 bytes)
        wav_header = (
            b'RIFF'
            b'\x24\x00\x00\x00'  # File size - 8
            b'WAVE'
            b'fmt '
            b'\x10\x00\x00\x00'  # fmt chunk size
            b'\x01\x00'          # Audio format (PCM)
            b'\x01\x00'          # Channels (mono)
            b'\x80\x3e\x00\x00'  # Sample rate (16000 Hz)
            b'\x00\x7d\x00\x00'  # Byte rate
            b'\x02\x00'          # Block align
            b'\x10\x00'          # Bits per sample (16)
            b'data'
            b'\x00\x00\x00\x00'  # Data size
        )
        return wav_header
