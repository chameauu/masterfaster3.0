"""
Intent understanding service for voice commands.

This service uses the existing LLM router to understand user intent
from transcribed voice commands.
"""

import json
import logging
from enum import Enum

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class IntentType(str, Enum):
    """Types of intents the voice assistant can handle."""

    SEARCH = "search"
    SUMMARIZE = "summarize"
    QUIZ = "quiz"
    FOLLOW_UP = "follow_up"
    HELP = "help"
    UNKNOWN = "unknown"


class Intent(BaseModel):
    """Parsed intent from user voice command."""

    intent_type: IntentType
    parameters: dict
    confidence: float
    raw_text: str | None = None


class IntentService:
    """
    Service for understanding user intent from voice commands.

    Uses the existing SurfSense LLM router for intent classification
    and parameter extraction.
    """

    def __init__(self):
        """Initialize the intent service with LLM router."""
        from app.services.llm_service import get_auto_mode_llm

        self.llm = get_auto_mode_llm()

        # If LLM is not available, we'll use a simple rule-based fallback
        if self.llm is None:
            logger.warning(
                "LLM not available for intent understanding, using rule-based fallback"
            )

    def understand(self, text: str, context: dict | None = None) -> Intent:
        """
        Understand user intent from transcribed text.

        Args:
            text: Transcribed voice command
            context: Optional conversation context

        Returns:
            Intent with type, parameters, and confidence
        """
        # If LLM is not available, use rule-based fallback
        if self.llm is None:
            return self._rule_based_intent(text)

        # Build prompt for LLM
        prompt = self._build_prompt(text, context)

        # Get LLM response using invoke (LangChain API)
        from langchain_core.messages import HumanMessage

        response = self.llm.invoke([HumanMessage(content=prompt)])

        # Parse JSON response from the content
        try:
            data = json.loads(response.content)
            return Intent(
                intent_type=IntentType(data["intent"]),
                parameters=data.get("parameters", {}),
                confidence=data.get("confidence", 0.0),
                raw_text=text,
            )
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # If parsing fails, return unknown intent
            return Intent(
                intent_type=IntentType.UNKNOWN,
                parameters={"error": str(e)},
                confidence=0.0,
                raw_text=text,
            )

    def _rule_based_intent(self, text: str) -> Intent:
        """
        Simple rule-based intent classification as fallback.

        Args:
            text: User's voice command

        Returns:
            Intent based on keyword matching
        """
        text_lower = text.lower()

        # Search intent keywords
        search_keywords = ["search", "find", "look for", "show me", "get me"]
        if any(keyword in text_lower for keyword in search_keywords):
            # Extract query (everything after the keyword)
            query = text
            for keyword in search_keywords:
                if keyword in text_lower:
                    parts = text_lower.split(keyword, 1)
                    if len(parts) > 1:
                        query = parts[1].strip()
                    break

            return Intent(
                intent_type=IntentType.SEARCH,
                parameters={"query": query, "filters": {}},
                confidence=0.7,
                raw_text=text,
            )

        # Summarize intent keywords
        summarize_keywords = ["summarize", "summary", "sum up", "brief"]
        if any(keyword in text_lower for keyword in summarize_keywords):
            return Intent(
                intent_type=IntentType.SUMMARIZE,
                parameters={"document": text},
                confidence=0.7,
                raw_text=text,
            )

        # Quiz intent keywords
        quiz_keywords = ["quiz", "test me", "ask me"]
        if any(keyword in text_lower for keyword in quiz_keywords):
            return Intent(
                intent_type=IntentType.QUIZ,
                parameters={"topic": text},
                confidence=0.7,
                raw_text=text,
            )

        # Help intent keywords
        help_keywords = ["help", "what can you do", "how do i"]
        if any(keyword in text_lower for keyword in help_keywords):
            return Intent(
                intent_type=IntentType.HELP,
                parameters={},
                confidence=0.8,
                raw_text=text,
            )

        # Default to search with the full text as query
        return Intent(
            intent_type=IntentType.SEARCH,
            parameters={"query": text, "filters": {}},
            confidence=0.5,
            raw_text=text,
        )

    def _build_prompt(self, text: str, context: dict | None = None) -> str:
        """
        Build prompt for LLM to understand intent.

        Args:
            text: User's voice command
            context: Optional conversation context

        Returns:
            Formatted prompt string
        """
        prompt = f"""You are a voice assistant intent classifier. Analyze the user's voice command and extract the intent and parameters.

User command: "{text}"

Available intents:
- search: User wants to search their documents
- summarize: User wants a summary of a document or section
- quiz: User wants to be quizzed on a topic
- follow_up: User is asking a follow-up question (e.g., "repeat that", "more detail")
- help: User needs help or wants to know what you can do
- unknown: Intent is unclear

Return ONLY a JSON object with this structure:
{{
  "intent": "search|summarize|quiz|follow_up|help|unknown",
  "parameters": {{}},
  "confidence": 0.0-1.0
}}

Examples:

Input: "search my notes for photosynthesis"
Output: {{"intent": "search", "parameters": {{"query": "photosynthesis", "filters": {{"type": "notes"}}}}, "confidence": 0.95}}

Input: "summarize chapter 3 of my biology book"
Output: {{"intent": "summarize", "parameters": {{"document": "biology book", "section": "chapter 3"}}, "confidence": 0.90}}

Input: "quiz me on cellular respiration"
Output: {{"intent": "quiz", "parameters": {{"topic": "cellular respiration"}}, "confidence": 0.92}}

Input: "repeat that"
Output: {{"intent": "follow_up", "parameters": {{"action": "repeat"}}, "confidence": 0.88}}

Now analyze the user's command and return ONLY the JSON object:"""

        if context:
            prompt += f"\n\nConversation context: {json.dumps(context)}"

        return prompt
