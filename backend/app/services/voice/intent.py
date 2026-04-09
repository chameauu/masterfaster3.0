"""
Intent understanding service for voice commands.

This service uses the existing LLM router to understand user intent
from transcribed voice commands.
"""

import json
from enum import Enum
from typing import Optional

from pydantic import BaseModel


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
    raw_text: Optional[str] = None


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
    
    def understand(self, text: str, context: Optional[dict] = None) -> Intent:
        """
        Understand user intent from transcribed text.
        
        Args:
            text: Transcribed voice command
            context: Optional conversation context
        
        Returns:
            Intent with type, parameters, and confidence
        """
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
    
    def _build_prompt(self, text: str, context: Optional[dict] = None) -> str:
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
