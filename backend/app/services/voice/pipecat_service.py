"""
Pipecat Voice Service - Main integration point for Pipecat audio pipeline.

This service manages the WebRTC connection, audio pipeline, and integration
with existing SurfSense services (transcription, chat, TTS).

Architecture:
    User Browser (WebRTC)
        ↓
    Pipecat Transport (WebRTC)
        ↓
    Silero VAD (speech detection)
        ↓
    Audio Buffer (collect speech)
        ↓
    Faster-Whisper (transcription) ← EXISTING
        ↓
    Chat Agent (existing) ← EXISTING
        ↓
    Piper TTS (text-to-speech)
        ↓
    Pipecat Transport (WebRTC)
        ↓
    User Browser (audio playback)

Example:
    >>> service = PipecatService()
    >>> await service.start(websocket)
    >>> # ... service handles audio streaming ...
    >>> await service.stop()
"""

import logging

from fastapi import WebSocket

# VAD and Aggregators
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.serializers.protobuf import ProtobufFrameSerializer

# TTS
from pipecat.services.piper.tts import PiperTTSService

# Pipecat imports
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

from .pipecat_config import PipecatServiceConfig
from .transcription_processor import TranscriptionProcessor

logger = logging.getLogger(__name__)


class PipecatServiceError(Exception):
    """Base exception for PipecatService errors."""

    pass


class PipecatConnectionError(PipecatServiceError):
    """Raised when WebSocket connection fails."""

    pass


class PipecatPipelineError(PipecatServiceError):
    """Raised when pipeline initialization or execution fails."""

    pass


class PipecatService:
    """
    Main service for managing Pipecat voice pipeline.

    Responsibilities:
    - Initialize Pipecat pipeline
    - Manage WebRTC connections
    - Coordinate VAD, STT, LLM, and TTS
    - Handle session lifecycle

    Attributes:
        config: Service configuration
        transport: FastAPI WebSocket transport
        pipeline: Pipecat pipeline
        task: Pipeline task
        runner: Pipeline runner
        is_running: Whether service is currently running
    """

    def __init__(self, config: PipecatServiceConfig | None = None):
        """
        Initialize Pipecat service.

        Args:
            config: Service configuration. If None, uses default config.
        """
        self.config = config or PipecatServiceConfig.default()
        self.transport: FastAPIWebsocketTransport | None = None
        self.pipeline: Pipeline | None = None
        self.task: PipelineTask | None = None
        self.runner: PipelineRunner | None = None
        self.is_running: bool = False

        # VAD and Aggregators (Day 5)
        self.vad_analyzer: SileroVADAnalyzer | None = None
        self.context: LLMContext | None = None
        self.user_aggregator = None
        self.assistant_aggregator = None

        # Transcription (Day 7)
        self.transcription_processor: TranscriptionProcessor | None = None

        # TTS (Day 9)
        self.tts: PiperTTSService | None = None

        logger.info(
            "Initialized PipecatService with config: "
            f"audio_in={self.config.websocket.audio_in_enabled}, "
            f"audio_out={self.config.websocket.audio_out_enabled}, "
            f"metrics={self.config.pipeline.enable_metrics}"
        )

    async def start(self, websocket: WebSocket) -> None:
        """
        Start the Pipecat service with WebSocket connection.

        This method:
        1. Creates FastAPI WebSocket transport
        2. Builds the audio processing pipeline
        3. Initializes pipeline task and runner
        4. Marks service as running

        Args:
            websocket: FastAPI WebSocket connection

        Raises:
            PipecatConnectionError: If WebSocket connection fails
            PipecatPipelineError: If pipeline initialization fails

        Example:
            >>> service = PipecatService()
            >>> await service.start(websocket)
        """
        if self.is_running:
            logger.warning("Service already running, ignoring start request")
            return

        logger.info("Starting PipecatService with WebSocket")

        try:
            # Create transport
            self.transport = self._create_transport(websocket)
            logger.debug("WebSocket transport created")

            # Create VAD and aggregators (Day 5)
            self.vad_analyzer = self._create_vad_analyzer()
            logger.debug("VAD analyzer created")

            self.context = self._create_context()
            logger.debug("LLM context created")

            self.user_aggregator, self.assistant_aggregator = self._create_aggregators()
            logger.debug("User and assistant aggregators created")

            # Create transcription processor (Day 7)
            self.transcription_processor = self._create_transcription_processor()
            logger.debug("Transcription processor created")

            # Create TTS (Day 9)
            self.tts = self._create_tts()
            logger.debug("TTS created")

            # Create pipeline
            self.pipeline = self._create_pipeline()
            logger.debug("Pipeline created")

            # Create task
            self.task = self._create_task()
            logger.debug("Pipeline task created")

            # Create runner
            self.runner = PipelineRunner()
            logger.debug("Pipeline runner created")

            # Mark as running
            self.is_running = True

            logger.info("PipecatService started successfully")

        except Exception as e:
            logger.error(f"Error starting PipecatService: {e}", exc_info=True)
            self.is_running = False

            # Clean up partial initialization
            await self._cleanup()

            # Re-raise with appropriate exception type
            if "websocket" in str(e).lower() or "connection" in str(e).lower():
                raise PipecatConnectionError(
                    f"Failed to establish WebSocket connection: {e}"
                ) from e
            else:
                raise PipecatPipelineError(f"Failed to initialize pipeline: {e}") from e

    async def stop(self) -> None:
        """
        Stop the Pipecat service.

        This method:
        1. Marks service as not running
        2. Cleans up all resources (runner, task, pipeline, transport)
        3. Logs completion

        Example:
            >>> await service.stop()
        """
        if not self.is_running:
            logger.debug("Service not running, ignoring stop request")
            return

        logger.info("Stopping PipecatService")

        try:
            self.is_running = False
            await self._cleanup()
            logger.info("PipecatService stopped successfully")

        except Exception as e:
            logger.error(f"Error stopping PipecatService: {e}", exc_info=True)
            raise PipecatServiceError(f"Failed to stop service cleanly: {e}") from e

    def _create_transport(self, websocket: WebSocket) -> FastAPIWebsocketTransport:
        """
        Create FastAPI WebSocket transport.

        Args:
            websocket: FastAPI WebSocket connection

        Returns:
            Configured FastAPIWebsocketTransport
        """
        return FastAPIWebsocketTransport(
            websocket=websocket,
            params=FastAPIWebsocketParams(
                audio_in_enabled=self.config.websocket.audio_in_enabled,
                audio_out_enabled=self.config.websocket.audio_out_enabled,
                add_wav_header=self.config.websocket.add_wav_header,
                serializer=ProtobufFrameSerializer(),
            ),
        )

    def _create_vad_analyzer(self) -> SileroVADAnalyzer:
        """
        Create Silero VAD analyzer with configuration.

        Silero VAD uses machine learning to detect voice activity with high accuracy.
        It's more robust than threshold-based VAD, especially in noisy environments.

        Returns:
            Configured SileroVADAnalyzer

        Example:
            >>> service = PipecatService()
            >>> vad = service._create_vad_analyzer()
            >>> # VAD will detect speech with 70% confidence threshold
        """
        try:
            vad = SileroVADAnalyzer(
                params=VADParams(
                    confidence=self.config.pipeline.vad_confidence,
                    start_secs=self.config.pipeline.vad_start_secs,
                    stop_secs=self.config.pipeline.vad_stop_secs,
                    min_volume=self.config.pipeline.vad_min_volume,
                )
            )
            logger.debug(
                f"Created Silero VAD with confidence={self.config.pipeline.vad_confidence}, "
                f"start={self.config.pipeline.vad_start_secs}s, "
                f"stop={self.config.pipeline.vad_stop_secs}s"
            )
            return vad
        except Exception as e:
            logger.error(f"Failed to create VAD analyzer: {e}", exc_info=True)
            raise PipecatPipelineError(f"VAD initialization failed: {e}") from e

    def _create_context(self) -> LLMContext:
        """
        Create LLM context for conversation management.

        The context maintains conversation history and system instructions.
        System prompt is optimized for voice interaction with visually impaired users.

        Returns:
            Configured LLMContext

        Example:
            >>> service = PipecatService()
            >>> context = service._create_context()
            >>> # Context includes accessibility-focused system prompt
        """
        try:
            context = LLMContext(
                messages=[
                    {"role": "system", "content": self.config.pipeline.system_prompt}
                ]
            )
            logger.debug(
                f"Created LLM context with system prompt: {self.config.pipeline.system_prompt[:50]}..."
            )
            return context
        except Exception as e:
            logger.error(f"Failed to create LLM context: {e}", exc_info=True)
            raise PipecatPipelineError(f"Context initialization failed: {e}") from e

    def _create_aggregators(self):
        """
        Create user and assistant aggregators with VAD integration.

        Aggregators manage the flow of conversation:
        - User aggregator: Collects user speech, integrates VAD for speech detection
        - Assistant aggregator: Collects assistant responses for context

        VAD is integrated into the user aggregator (not a separate processor).
        This is the recommended Pipecat pattern.

        Returns:
            Tuple of (user_aggregator, assistant_aggregator)

        Raises:
            PipecatPipelineError: If VAD analyzer or context not initialized

        Example:
            >>> service = PipecatService()
            >>> service.vad_analyzer = service._create_vad_analyzer()
            >>> service.context = service._create_context()
            >>> user_agg, asst_agg = service._create_aggregators()
            >>> # Aggregators ready for pipeline integration
        """
        if not self.vad_analyzer:
            raise PipecatPipelineError(
                "VAD analyzer must be initialized before creating aggregators"
            )
        if not self.context:
            raise PipecatPipelineError(
                "Context must be initialized before creating aggregators"
            )

        try:
            user_agg, asst_agg = LLMContextAggregatorPair(
                self.context,
                user_params=LLMUserAggregatorParams(
                    vad_analyzer=self.vad_analyzer,
                ),
            )
            logger.debug("Created user and assistant aggregators with VAD integration")
            return user_agg, asst_agg
        except Exception as e:
            logger.error(f"Failed to create aggregators: {e}", exc_info=True)
            raise PipecatPipelineError(f"Aggregator initialization failed: {e}") from e

    def _create_transcription_processor(self) -> TranscriptionProcessor:
        """
        Create transcription processor wrapping Faster-Whisper.

        The transcription processor converts speech to text using the existing
        TranscriptionService (Faster-Whisper).

        Returns:
            Configured TranscriptionProcessor

        Example:
            >>> service = PipecatService()
            >>> processor = service._create_transcription_processor()
            >>> # Processor ready to transcribe audio frames
        """
        try:
            processor = TranscriptionProcessor()
            logger.debug("Created transcription processor with Faster-Whisper")
            return processor
        except Exception as e:
            logger.error(
                f"Failed to create transcription processor: {e}", exc_info=True
            )
            raise PipecatPipelineError(
                f"Transcription processor initialization failed: {e}"
            ) from e

    def _create_tts(self) -> PiperTTSService:
        """
        Create Piper TTS service for text-to-speech.

        Piper TTS provides high-quality, local text-to-speech synthesis.
        Voice model is configured via PipecatPipelineConfig.

        Available voices:
        - en_US-ryan-high: High-quality male voice (default)
        - en_US-lessac-medium: Medium-quality male voice
        - en_GB-*: British English voices
        - Many more at: https://huggingface.co/rhasspy/piper-voices

        Returns:
            Configured PiperTTSService

        Raises:
            PipecatPipelineError: If TTS initialization fails

        Example:
            >>> service = PipecatService()
            >>> tts = service._create_tts()
            >>> # TTS ready to convert text to speech
        """
        try:
            tts = PiperTTSService(
                settings=PiperTTSService.Settings(
                    voice=self.config.pipeline.tts_voice,
                ),
            )
            logger.debug(
                f"Created Piper TTS with voice={self.config.pipeline.tts_voice}"
            )
            return tts
        except Exception as e:
            logger.error(f"Failed to create TTS: {e}", exc_info=True)
            raise PipecatPipelineError(f"TTS initialization failed: {e}") from e

    def _create_pipeline(self) -> Pipeline:
        """
        Create Pipecat audio processing pipeline.

        Current implementation (Day 9): Pipeline with VAD, Transcription, and TTS
        - Receives audio from WebSocket
        - User aggregator with VAD detects speech
        - Transcription processor converts speech to text
        - TTS converts text to speech
        - Sends audio back to WebSocket
        - Assistant aggregator manages responses

        Future iterations will add:
        - LLM (existing chat agent) - Day 9-10

        Returns:
            Configured Pipeline

        Raises:
            PipecatPipelineError: If components not initialized
        """
        if not self.transport:
            raise PipecatPipelineError(
                "Transport must be initialized before creating pipeline"
            )
        if not self.user_aggregator or not self.assistant_aggregator:
            raise PipecatPipelineError(
                "Aggregators must be initialized before creating pipeline"
            )
        if not self.transcription_processor:
            raise PipecatPipelineError(
                "Transcription processor must be initialized before creating pipeline"
            )
        if not self.tts:
            raise PipecatPipelineError(
                "TTS must be initialized before creating pipeline"
            )

        # Pipeline with VAD, Transcription, and TTS (Day 9)
        return Pipeline(
            [
                self.transport.input(),  # Receive audio from WebSocket
                self.user_aggregator,  # Aggregate user speech with VAD
                self.transcription_processor,  # Convert speech to text
                self.tts,  # ← NEW: Convert text to speech
                self.transport.output(),  # Send audio back
                self.assistant_aggregator,  # Aggregate assistant responses
            ]
        )

    def _create_task(self) -> PipelineTask:
        """
        Create pipeline task with configuration.

        Returns:
            Configured PipelineTask

        Raises:
            PipecatPipelineError: If pipeline not initialized
        """
        if not self.pipeline:
            raise PipecatPipelineError(
                "Pipeline must be initialized before creating task"
            )

        return PipelineTask(
            self.pipeline,
            params=PipelineParams(
                enable_metrics=self.config.pipeline.enable_metrics,
                enable_usage_metrics=self.config.pipeline.enable_usage_metrics,
            ),
        )

    async def _cleanup(self) -> None:
        """
        Clean up all resources.

        This method is idempotent - safe to call multiple times.
        """
        # Clean up in reverse order of creation
        if self.runner:
            logger.debug("Cleaning up pipeline runner")
            # TODO: Implement proper runner cleanup when Pipecat provides API
            self.runner = None

        if self.task:
            logger.debug("Cleaning up pipeline task")
            self.task = None

        if self.pipeline:
            logger.debug("Cleaning up pipeline")
            self.pipeline = None

        if self.assistant_aggregator:
            logger.debug("Cleaning up assistant aggregator")
            self.assistant_aggregator = None

        if self.user_aggregator:
            logger.debug("Cleaning up user aggregator")
            self.user_aggregator = None

        if self.tts:
            logger.debug("Cleaning up TTS")
            self.tts = None

        if self.transcription_processor:
            logger.debug("Cleaning up transcription processor")
            self.transcription_processor = None

        if self.context:
            logger.debug("Cleaning up LLM context")
            self.context = None

        if self.vad_analyzer:
            logger.debug("Cleaning up VAD analyzer")
            self.vad_analyzer = None

        if self.transport:
            logger.debug("Cleaning up transport")
            self.transport = None
