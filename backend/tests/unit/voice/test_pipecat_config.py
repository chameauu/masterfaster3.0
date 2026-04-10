"""
Unit tests for Pipecat configuration.

Tests configuration validation and defaults.
"""

import pytest
from app.services.voice.pipecat_config import (
    PipecatWebSocketConfig,
    PipecatPipelineConfig,
    PipecatServiceConfig,
    DEFAULT_SYSTEM_PROMPT,
)


class TestPipecatWebSocketConfig:
    """Test suite for PipecatWebSocketConfig."""
    
    def test_default_config(self):
        """Test default WebSocket configuration."""
        config = PipecatWebSocketConfig()
        assert config.audio_in_enabled is True
        assert config.audio_out_enabled is True
        assert config.add_wav_header is False
    
    def test_custom_config(self):
        """Test custom WebSocket configuration."""
        config = PipecatWebSocketConfig(
            audio_in_enabled=False,
            audio_out_enabled=True,
            add_wav_header=True,
        )
        assert config.audio_in_enabled is False
        assert config.audio_out_enabled is True
        assert config.add_wav_header is True
    
    def test_validation_both_disabled(self):
        """Test that at least one audio direction must be enabled."""
        with pytest.raises(ValueError, match="At least one of audio_in or audio_out"):
            PipecatWebSocketConfig(
                audio_in_enabled=False,
                audio_out_enabled=False,
            )


class TestPipecatPipelineConfig:
    """Test suite for PipecatPipelineConfig."""
    
    def test_default_config(self):
        """Test default pipeline configuration."""
        config = PipecatPipelineConfig()
        assert config.enable_metrics is True
        assert config.enable_usage_metrics is False
        assert config.vad_confidence == 0.7
        assert config.vad_start_secs == 0.2
        assert config.vad_stop_secs == 0.2
        assert config.vad_min_volume == 0.6
        assert config.system_prompt == DEFAULT_SYSTEM_PROMPT
    
    def test_custom_config(self):
        """Test custom pipeline configuration."""
        custom_prompt = "Custom system prompt for testing"
        config = PipecatPipelineConfig(
            enable_metrics=False,
            vad_confidence=0.8,
            vad_start_secs=0.3,
            system_prompt=custom_prompt,
        )
        assert config.enable_metrics is False
        assert config.vad_confidence == 0.8
        assert config.vad_start_secs == 0.3
        assert config.system_prompt == custom_prompt
    
    def test_validation_vad_confidence_range(self):
        """Test VAD confidence must be between 0.0 and 1.0."""
        with pytest.raises(ValueError, match="vad_confidence must be between"):
            PipecatPipelineConfig(vad_confidence=1.5)
        
        with pytest.raises(ValueError, match="vad_confidence must be between"):
            PipecatPipelineConfig(vad_confidence=-0.1)
    
    def test_validation_vad_timing_non_negative(self):
        """Test VAD timing parameters must be non-negative."""
        with pytest.raises(ValueError, match="vad_start_secs must be non-negative"):
            PipecatPipelineConfig(vad_start_secs=-0.1)
        
        with pytest.raises(ValueError, match="vad_stop_secs must be non-negative"):
            PipecatPipelineConfig(vad_stop_secs=-0.1)
    
    def test_validation_vad_volume_range(self):
        """Test VAD volume must be between 0.0 and 1.0."""
        with pytest.raises(ValueError, match="vad_min_volume must be between"):
            PipecatPipelineConfig(vad_min_volume=1.5)
        
        with pytest.raises(ValueError, match="vad_min_volume must be between"):
            PipecatPipelineConfig(vad_min_volume=-0.1)
    
    def test_validation_system_prompt_not_empty(self):
        """Test system prompt must not be empty."""
        with pytest.raises(ValueError, match="system_prompt must not be empty"):
            PipecatPipelineConfig(system_prompt="")
        
        with pytest.raises(ValueError, match="system_prompt must not be empty"):
            PipecatPipelineConfig(system_prompt="   ")


class TestPipecatServiceConfig:
    """Test suite for PipecatServiceConfig."""
    
    def test_default_config(self):
        """Test default service configuration."""
        config = PipecatServiceConfig.default()
        assert config.websocket is not None
        assert config.pipeline is not None
        assert config.websocket.audio_in_enabled is True
        assert config.pipeline.enable_metrics is True
        assert config.pipeline.system_prompt == DEFAULT_SYSTEM_PROMPT
    
    def test_for_testing_config(self):
        """Test testing-optimized configuration."""
        config = PipecatServiceConfig.for_testing()
        assert config.websocket is not None
        assert config.pipeline is not None
        assert config.pipeline.enable_metrics is False  # Disabled for tests
        assert config.pipeline.enable_usage_metrics is False
    
    def test_custom_config(self):
        """Test custom service configuration."""
        websocket_config = PipecatWebSocketConfig(audio_in_enabled=False)
        pipeline_config = PipecatPipelineConfig(enable_metrics=False)
        
        config = PipecatServiceConfig(
            websocket=websocket_config,
            pipeline=pipeline_config,
        )
        
        assert config.websocket.audio_in_enabled is False
        assert config.pipeline.enable_metrics is False
