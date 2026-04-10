"""
Pipecat Configuration.

Centralized configuration for Pipecat voice service.
"""

from dataclasses import dataclass
from typing import Optional


# Default system prompt for voice assistant
DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful voice assistant for visually impaired users. "
    "Provide clear, concise responses optimized for audio output. "
    "Keep responses brief and conversational. "
    "Avoid using visual descriptions or references to UI elements."
)


@dataclass
class PipecatWebSocketConfig:
    """Configuration for FastAPI WebSocket transport."""
    
    audio_in_enabled: bool = True
    audio_out_enabled: bool = True
    add_wav_header: bool = False
    
    def __post_init__(self):
        """Validate configuration."""
        if not self.audio_in_enabled and not self.audio_out_enabled:
            raise ValueError("At least one of audio_in or audio_out must be enabled")


@dataclass
class PipecatPipelineConfig:
    """Configuration for Pipecat pipeline."""
    
    enable_metrics: bool = True
    enable_usage_metrics: bool = False
    
    # VAD configuration
    vad_confidence: float = 0.7
    vad_start_secs: float = 0.2
    vad_stop_secs: float = 0.2
    vad_min_volume: float = 0.6
    
    # LLM context configuration
    system_prompt: str = DEFAULT_SYSTEM_PROMPT
    
    # TTS configuration (Day 10)
    tts_voice: str = "en_US-ryan-high"
    
    def __post_init__(self):
        """Validate configuration."""
        if not 0.0 <= self.vad_confidence <= 1.0:
            raise ValueError("vad_confidence must be between 0.0 and 1.0")
        if self.vad_start_secs < 0:
            raise ValueError("vad_start_secs must be non-negative")
        if self.vad_stop_secs < 0:
            raise ValueError("vad_stop_secs must be non-negative")
        if not 0.0 <= self.vad_min_volume <= 1.0:
            raise ValueError("vad_min_volume must be between 0.0 and 1.0")
        if not self.system_prompt or not self.system_prompt.strip():
            raise ValueError("system_prompt must not be empty")
        if not self.tts_voice or not self.tts_voice.strip():
            raise ValueError("tts_voice must not be empty")


@dataclass
class PipecatServiceConfig:
    """Main configuration for Pipecat service."""
    
    websocket: PipecatWebSocketConfig
    pipeline: PipecatPipelineConfig
    
    @classmethod
    def default(cls) -> "PipecatServiceConfig":
        """Create default configuration."""
        return cls(
            websocket=PipecatWebSocketConfig(),
            pipeline=PipecatPipelineConfig(),
        )
    
    @classmethod
    def for_testing(cls) -> "PipecatServiceConfig":
        """Create configuration optimized for testing."""
        return cls(
            websocket=PipecatWebSocketConfig(
                audio_in_enabled=True,
                audio_out_enabled=True,
                add_wav_header=False,
            ),
            pipeline=PipecatPipelineConfig(
                enable_metrics=False,  # Disable metrics in tests
                enable_usage_metrics=False,
            ),
        )
