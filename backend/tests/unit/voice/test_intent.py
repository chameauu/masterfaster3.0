"""
Unit tests for intent understanding service.

Following TDD principles:
- Test behavior through public interface
- One test at a time (vertical slicing)
- Tests describe what the system does, not how
"""

from unittest.mock import MagicMock, patch

from app.services.voice.intent import Intent, IntentService, IntentType


class TestIntentService:
    """Test intent understanding using LLM."""

    @patch("app.services.llm_service.get_auto_mode_llm")
    def test_recognize_search_intent(self, mock_get_llm):
        """
        Test recognizing search intent from text.

        Behavior: Given "search my notes for photosynthesis", the service
        should identify SEARCH intent with query="photosynthesis" and
        filters={"type": "notes"}.
        """
        # Arrange - Mock the LLM
        mock_llm = MagicMock()
        mock_get_llm.return_value = mock_llm

        # Mock LLM response (AIMessage with JSON content)
        mock_response = MagicMock()
        mock_response.content = """
        {
            "intent": "search",
            "parameters": {
                "query": "photosynthesis",
                "filters": {"type": "notes"}
            },
            "confidence": 0.95
        }
        """
        mock_llm.invoke.return_value = mock_response

        service = IntentService()
        text = "search my notes for photosynthesis"

        # Act
        result = service.understand(text)

        # Assert
        assert isinstance(result, Intent)
        assert result.intent_type == IntentType.SEARCH
        assert result.parameters["query"] == "photosynthesis"
        assert result.parameters["filters"]["type"] == "notes"
        assert result.confidence == 0.95

    @patch("app.services.llm_service.get_auto_mode_llm")
    def test_recognize_summarize_intent(self, mock_get_llm):
        """
        Test recognizing summarize intent.

        Behavior: Given "summarize chapter 3", should identify SUMMARIZE
        intent with document and section parameters.
        """
        # Arrange
        mock_llm = MagicMock()
        mock_get_llm.return_value = mock_llm

        mock_response = MagicMock()
        mock_response.content = """
        {
            "intent": "summarize",
            "parameters": {
                "document": "biology book",
                "section": "chapter 3"
            },
            "confidence": 0.90
        }
        """
        mock_llm.invoke.return_value = mock_response

        service = IntentService()
        text = "summarize chapter 3 of my biology book"

        # Act
        result = service.understand(text)

        # Assert
        assert result.intent_type == IntentType.SUMMARIZE
        assert result.parameters["document"] == "biology book"
        assert result.parameters["section"] == "chapter 3"
        assert result.confidence == 0.90

    @patch("app.services.llm_service.get_auto_mode_llm")
    def test_recognize_quiz_intent(self, mock_get_llm):
        """
        Test recognizing quiz intent.

        Behavior: Given "quiz me on cellular respiration", should identify
        QUIZ intent with topic parameter.
        """
        # Arrange
        mock_llm = MagicMock()
        mock_get_llm.return_value = mock_llm

        mock_response = MagicMock()
        mock_response.content = """
        {
            "intent": "quiz",
            "parameters": {
                "topic": "cellular respiration"
            },
            "confidence": 0.92
        }
        """
        mock_llm.invoke.return_value = mock_response

        service = IntentService()
        text = "quiz me on cellular respiration"

        # Act
        result = service.understand(text)

        # Assert
        assert result.intent_type == IntentType.QUIZ
        assert result.parameters["topic"] == "cellular respiration"
        assert result.confidence == 0.92

    @patch("app.services.llm_service.get_auto_mode_llm")
    def test_handle_unknown_intent(self, mock_get_llm):
        """
        Test handling unparseable or invalid responses.

        Behavior: If LLM returns invalid JSON or the service can't parse it,
        should return UNKNOWN intent gracefully.
        """
        # Arrange
        mock_llm = MagicMock()
        mock_get_llm.return_value = mock_llm

        # Mock invalid JSON response
        mock_response = MagicMock()
        mock_response.content = "This is not valid JSON"
        mock_llm.invoke.return_value = mock_response

        service = IntentService()
        text = "some unclear command"

        # Act
        result = service.understand(text)

        # Assert
        assert result.intent_type == IntentType.UNKNOWN
        assert result.confidence == 0.0
        assert "error" in result.parameters
