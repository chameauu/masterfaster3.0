"""
Unit tests for TranscriptionProcessor.

Following TDD approach:
1. RED: Write failing test
2. GREEN: Implement minimal code to pass
3. REFACTOR: Improve code quality
"""

from unittest.mock import patch

import pytest
from pipecat.frames.frames import (
    AudioRawFrame,
    ErrorFrame,
    TextFrame,
)

from app.services.voice.transcription_processor import (
    AudioConversionError,
    TranscriptionProcessor,
)


class TestTranscriptionProcessor:
    """Test suite for TranscriptionProcessor."""

    @pytest.mark.asyncio
    async def test_processor_initializes(self):
        """Test that TranscriptionProcessor can be initialized."""
        processor = TranscriptionProcessor()
        assert processor is not None
        assert processor.transcription_service is not None

    @pytest.mark.asyncio
    async def test_non_audio_frames_pass_through(self):
        """Test that non-AudioRawFrame frames pass through unchanged."""
        processor = TranscriptionProcessor()
        text_frame = TextFrame(text="test")

        frames = []
        async for frame in processor.process_frame(text_frame, None):
            frames.append(frame)

        assert len(frames) == 1
        assert frames[0] == text_frame

    @pytest.mark.asyncio
    async def test_audio_conversion_validation_empty_data(self):
        """Test that empty audio data raises AudioConversionError."""
        processor = TranscriptionProcessor()

        with pytest.raises(AudioConversionError, match="Audio data is empty"):
            processor._convert_to_wav(b"", 16000, 1)

    @pytest.mark.asyncio
    async def test_audio_conversion_validation_invalid_sample_rate(self):
        """Test that invalid sample rate raises AudioConversionError."""
        processor = TranscriptionProcessor()

        with pytest.raises(AudioConversionError, match="Invalid sample rate"):
            processor._convert_to_wav(b"test", 0, 1)

    @pytest.mark.asyncio
    async def test_audio_conversion_validation_invalid_channels(self):
        """Test that invalid channel count raises AudioConversionError."""
        processor = TranscriptionProcessor()

        with pytest.raises(AudioConversionError, match="Invalid number of channels"):
            processor._convert_to_wav(b"test", 16000, 3)

    @pytest.mark.asyncio
    async def test_audio_conversion_error_yields_error_frame(self):
        """Test that audio conversion errors yield ErrorFrame."""
        processor = TranscriptionProcessor()

        # Create invalid audio frame (empty data)
        audio_frame = AudioRawFrame(
            audio=b"",  # Empty audio
            sample_rate=16000,
            num_channels=1,
        )

        frames = []
        async for frame in processor.process_frame(audio_frame, None):
            frames.append(frame)

        assert len(frames) == 1
        assert isinstance(frames[0], ErrorFrame)
        assert "Audio data is empty" in frames[0].error

    @pytest.mark.asyncio
    async def test_transcription_error_yields_error_frame(self):
        """Test that transcription errors yield ErrorFrame."""
        processor = TranscriptionProcessor()

        # Mock transcription service to raise error
        with patch.object(
            processor.transcription_service,
            "transcribe",
            side_effect=Exception("Transcription failed"),
        ):
            # Create valid audio frame
            audio_frame = AudioRawFrame(
                audio=b"\x00\x01" * 1000,  # Valid PCM data
                sample_rate=16000,
                num_channels=1,
            )

            frames = []
            async for frame in processor.process_frame(audio_frame, None):
                frames.append(frame)

            assert len(frames) == 1
            assert isinstance(frames[0], ErrorFrame)
            assert "Transcription" in frames[0].error
