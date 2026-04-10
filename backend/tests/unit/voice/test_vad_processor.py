"""
Unit tests for VADProcessor.

Tests Silero VAD integration and speech detection.
"""

import pytest
from app.services.voice.vad_processor import VADProcessor


class TestVADProcessor:
    """Test suite for VADProcessor."""
    
    def test_vad_initializes_with_defaults(self):
        """Test that VADProcessor initializes with default parameters."""
        vad = VADProcessor()
        assert vad is not None
        assert vad.confidence == 0.7
        assert vad.start_secs == 0.2
        assert vad.stop_secs == 0.2
        assert vad.min_volume == 0.6
    
    def test_vad_initializes_with_custom_params(self):
        """Test that VADProcessor accepts custom parameters."""
        vad = VADProcessor(
            confidence=0.8,
            start_secs=0.3,
            stop_secs=0.3,
            min_volume=0.7
        )
        assert vad.confidence == 0.8
        assert vad.start_secs == 0.3
        assert vad.stop_secs == 0.3
        assert vad.min_volume == 0.7
    
    # TODO: Add more tests as we implement features
    # - test_vad_detects_speech_start
    # - test_vad_detects_speech_stop
    # - test_vad_ignores_noise
    # - test_vad_handles_silence
