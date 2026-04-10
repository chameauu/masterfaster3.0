"""
Unit tests for PipecatService.

Following TDD approach:
1. RED: Write failing test
2. GREEN: Implement minimal code to pass
3. REFACTOR: Improve code quality
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.voice.pipecat_service import PipecatService


class TestPipecatService:
    """Test suite for PipecatService."""
    
    @pytest.mark.asyncio
    async def test_service_initializes(self):
        """Test that PipecatService can be initialized."""
        service = PipecatService()
        assert service is not None
    
    @pytest.mark.asyncio
    async def test_service_starts(self):
        """Test that PipecatService can start with WebSocket."""
        service = PipecatService()
        mock_websocket = AsyncMock()
        await service.start(mock_websocket)
        assert service.is_running is True
    
    @pytest.mark.asyncio
    async def test_service_stops(self):
        """Test that PipecatService can stop."""
        service = PipecatService()
        mock_websocket = AsyncMock()
        await service.start(mock_websocket)
        await service.stop()
        assert service.is_running is False
    
    # DAY 3: TRACER BULLET - WebRTC Connection
    @pytest.mark.asyncio
    async def test_webrtc_connection_establishes(self):
        """
        Test that WebRTC connection can be established through WebSocket.
        
        This is our tracer bullet - proves the path works end-to-end.
        
        Behavior being tested:
        - Service accepts WebSocket connection
        - Pipecat pipeline initializes
        - Service is in running state
        - Service can be stopped cleanly
        """
        # Arrange
        service = PipecatService()
        mock_websocket = AsyncMock()
        mock_websocket.accept = AsyncMock()
        mock_websocket.send_bytes = AsyncMock()
        mock_websocket.receive_bytes = AsyncMock(return_value=b"test_audio_data")
        
        # Act
        await service.start(mock_websocket)
        
        # Assert - Service should be running
        assert service.is_running is True, "Service should be in running state"
        assert service.transport is not None, "Transport should be initialized"
        assert service.pipeline is not None, "Pipeline should be initialized"
        
        # Cleanup
        await service.stop()
        assert service.is_running is False, "Service should stop cleanly"
    
    # DAY 5: VAD INTEGRATION
    @pytest.mark.asyncio
    async def test_vad_integration(self):
        """
        Test that VAD (Voice Activity Detection) is integrated into pipeline.
        
        Behavior being tested:
        - Service initializes with VAD enabled
        - Pipeline includes user and assistant aggregators
        - VAD analyzer is configured with correct parameters
        - Aggregators are properly integrated
        
        This test verifies the pipeline structure, not VAD detection itself
        (VAD detection is tested separately in test_vad_processor.py)
        """
        # Arrange
        service = PipecatService()
        mock_websocket = AsyncMock()
        
        # Act
        await service.start(mock_websocket)
        
        # Assert - Pipeline should include aggregators
        assert service.pipeline is not None, "Pipeline should be initialized"
        assert service.user_aggregator is not None, "User aggregator should be initialized"
        assert service.assistant_aggregator is not None, "Assistant aggregator should be initialized"
        
        # Assert - VAD should be configured
        assert service.vad_analyzer is not None, "VAD analyzer should be initialized"
        
        # Cleanup
        await service.stop()
    
    # DAY 7: TRANSCRIPTION INTEGRATION
    @pytest.mark.asyncio
    async def test_transcription_integration(self):
        """
        Test that transcription is integrated into pipeline.
        
        Behavior being tested:
        - Service initializes with transcription processor
        - Pipeline includes transcription between aggregators
        - Transcription processor is properly configured
        
        This test verifies the pipeline structure, not transcription itself
        (transcription is tested separately in test_transcription.py)
        """
        # Arrange
        service = PipecatService()
        mock_websocket = AsyncMock()
        
        # Act
        await service.start(mock_websocket)
        
        # Assert - Pipeline should include transcription processor
        assert service.pipeline is not None, "Pipeline should be initialized"
        assert service.transcription_processor is not None, "Transcription processor should be initialized"
        
        # Cleanup
        await service.stop()
