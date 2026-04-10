"""
Integration tests for voice assistant API routes.

These tests verify the complete voice search flow end-to-end.
"""

from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import UploadFile

from app.routes.voice_routes import voice_search


class TestVoiceRoutes:
    """Integration tests for voice assistant routes."""

    @pytest.mark.asyncio
    @patch("app.routes.voice_routes.TranscriptionService")
    @patch("app.routes.voice_routes.IntentService")
    @patch("app.routes.voice_routes.SearchTool")
    async def test_voice_search_end_to_end(
        self,
        mock_search_tool_class,
        mock_intent_service_class,
        mock_transcription_service_class,
    ):
        """
        Test complete voice search flow end-to-end.

        Flow: Audio upload → Transcription → Intent → Search → Response
        """
        # Arrange - Mock all services

        # 1. Mock Transcription Service
        mock_transcription_service = MagicMock()
        mock_transcription_service_class.return_value = mock_transcription_service

        from app.services.voice.transcription import TranscriptionResult

        mock_transcription_service.transcribe.return_value = TranscriptionResult(
            text="search my notes for photosynthesis",
            confidence=0.95,
            language="en",
            duration=1.5,
        )

        # 2. Mock Intent Service
        mock_intent_service = MagicMock()
        mock_intent_service_class.return_value = mock_intent_service

        from app.services.voice.intent import Intent, IntentType

        mock_intent_service.understand.return_value = Intent(
            intent_type=IntentType.SEARCH,
            parameters={"query": "photosynthesis", "filters": {"type": "notes"}},
            confidence=0.95,
            raw_text="search my notes for photosynthesis",
        )

        # 3. Mock Search Tool
        mock_search_tool = MagicMock()
        mock_search_tool_class.return_value = mock_search_tool

        from app.services.voice.tools.search import SearchResult

        mock_search_result = SearchResult(
            documents=[
                {
                    "document_id": 1,
                    "content": "Photosynthesis is the process by which plants convert light energy.",
                    "score": 0.95,
                    "chunks": [
                        {
                            "chunk_id": 1,
                            "content": "Photosynthesis is the process by which plants convert light energy.",
                        }
                    ],
                    "document": {
                        "id": 1,
                        "title": "Biology Notes",
                        "document_type": "FILE",
                    },
                }
            ],
            voice_response="I found 1 result. From your Biology Notes: Photosynthesis is the process by which plants convert light energy.",
            total_results=1,
        )
        mock_search_tool.handle_search = AsyncMock(return_value=mock_search_result)

        # Create test audio file
        audio_data = b"fake audio data"
        audio_file = UploadFile(filename="test.wav", file=BytesIO(audio_data))

        # Act - Call the route handler directly
        response = await voice_search(audio=audio_file)

        # Assert
        assert response.transcript == "search my notes for photosynthesis"
        assert response.intent.intent_type == IntentType.SEARCH
        assert len(response.results) == 1
        assert "Biology Notes" in response.voice_response

        # Verify services were called
        mock_transcription_service.transcribe.assert_called_once()
        mock_intent_service.understand.assert_called_once_with(
            "search my notes for photosynthesis"
        )
        mock_search_tool.handle_search.assert_called_once()
