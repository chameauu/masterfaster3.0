"""
Unit tests for voice search tool.

Following TDD principles:
- Test behavior through public interface
- One test at a time (vertical slicing)
- Tests describe what the system does, not how
"""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest

from app.services.voice.tools.search import SearchResult, SearchTool


class TestSearchTool:
    """Test voice search tool that integrates with SurfSense search API."""

    @pytest.mark.asyncio
    @patch("app.retriever.chunks_hybrid_search.ChucksHybridSearchRetriever")
    @patch("app.db.get_async_session")
    async def test_search_documents(self, mock_get_session, mock_retriever_class):
        """
        Test searching documents via SurfSense API.

        Behavior: Given a query and user_id, should call SurfSense search
        and return formatted results with voice-friendly response.
        """
        # Arrange - Mock database session
        mock_session = MagicMock()
        mock_get_session.return_value.__aiter__.return_value = [mock_session]

        # Mock retriever and search results
        mock_retriever = MagicMock()
        mock_retriever_class.return_value = mock_retriever

        mock_doc = {
            "document_id": 1,
            "content": "Photosynthesis is the process by which plants convert light energy into chemical energy.",
            "score": 0.95,
            "chunks": [
                {
                    "chunk_id": 1,
                    "content": "Photosynthesis is the process by which plants convert light energy into chemical energy.",
                }
            ],
            "document": {"id": 1, "title": "Biology Notes", "document_type": "FILE"},
        }

        mock_retriever.hybrid_search = AsyncMock(return_value=[mock_doc])

        tool = SearchTool()
        user_id = UUID("00000000-0000-0000-0000-000000000001")

        # Act
        result = await tool.handle_search(
            query="photosynthesis", filters={"type": "notes"}, user_id=user_id
        )

        # Assert
        assert isinstance(result, SearchResult)
        assert len(result.documents) == 1
        assert "photosynthesis" in result.documents[0]["content"].lower()
        assert result.voice_response is not None
        assert "I found" in result.voice_response
        assert "Biology Notes" in result.voice_response

        # Verify search was called correctly
        mock_retriever.hybrid_search.assert_called_once()
        call_kwargs = mock_retriever.hybrid_search.call_args.kwargs
        assert call_kwargs["query_text"] == "photosynthesis"
        assert call_kwargs["top_k"] == 5

    @pytest.mark.asyncio
    @patch("app.retriever.chunks_hybrid_search.ChucksHybridSearchRetriever")
    @patch("app.db.get_async_session")
    async def test_search_no_results(self, mock_get_session, mock_retriever_class):
        """
        Test handling no search results gracefully.

        Behavior: When search returns no results, should return empty
        documents list with helpful voice message.
        """
        # Arrange
        mock_session = MagicMock()
        mock_get_session.return_value.__aiter__.return_value = [mock_session]

        mock_retriever = MagicMock()
        mock_retriever_class.return_value = mock_retriever
        mock_retriever.hybrid_search = AsyncMock(return_value=[])

        tool = SearchTool()
        user_id = UUID("00000000-0000-0000-0000-000000000001")

        # Act
        result = await tool.handle_search(
            query="nonexistent topic", filters={}, user_id=user_id
        )

        # Assert
        assert len(result.documents) == 0
        assert (
            "didn't find" in result.voice_response.lower()
            or "no documents" in result.voice_response.lower()
        )
