"""
Voice search tool that integrates with SurfSense search API.

This tool handles voice search requests by calling the existing
SurfSense hybrid search and formatting results for voice output.
"""

from uuid import UUID

from pydantic import BaseModel


class SearchResult(BaseModel):
    """Result of a voice search operation."""

    documents: list[dict]
    voice_response: str
    total_results: int = 0


class SearchTool:
    """
    Tool for searching documents via voice commands.

    Integrates with SurfSense's existing hybrid search (vector + keyword)
    and formats results for natural voice output.
    """

    async def handle_search(
        self,
        query: str,
        filters: dict | None = None,
        user_id: UUID = None,
        search_space_id: int = 1,
        limit: int = 5,
    ) -> SearchResult:
        """
        Search user's documents and format for voice output.

        Args:
            query: Search query string
            filters: Optional filters (document type, date range, etc.)
            user_id: User ID for access control
            search_space_id: Search space ID (default: 1)
            limit: Maximum number of results to return

        Returns:
            SearchResult with documents and voice-formatted response
        """
        # Import here to avoid circular dependencies
        from app.db import get_async_session
        from app.retriever.chunks_hybrid_search import ChucksHybridSearchRetriever

        # Get database session
        async for session in get_async_session():
            # Create retriever
            retriever = ChucksHybridSearchRetriever(session)

            # Call hybrid search
            documents = await retriever.hybrid_search(
                query_text=query,
                top_k=limit,
                search_space_id=search_space_id,
                document_type=filters.get("type") if filters else None,
            )

            # Format for voice
            voice_response = self._format_for_voice(documents, query)

            return SearchResult(
                documents=documents,
                voice_response=voice_response,
                total_results=len(documents),
            )

    def _format_for_voice(self, documents: list[dict], query: str) -> str:
        """
        Format search results for natural voice output.

        Args:
            documents: List of document-grouped search results
            query: Original search query

        Returns:
            Natural language response suitable for TTS
        """
        if not documents:
            return f"I didn't find any documents matching '{query}'. Try rephrasing your search or checking if the documents have been indexed."

        # Build natural language response
        count = len(documents)
        response_parts = []

        # Opening
        if count == 1:
            response_parts.append("I found 1 result.")
        else:
            response_parts.append(f"I found {count} results.")

        # Top 3 results with citations
        for i, doc in enumerate(documents[:3], 1):
            # Extract metadata
            doc_info = doc.get("document", {})
            title = doc_info.get("title", "Unknown document")

            # Get first matched chunk content
            chunks = doc.get("chunks", [])
            if chunks:
                content = chunks[0].get("content", "")[:200]
                if len(chunks[0].get("content", "")) > 200:
                    content += "..."
            else:
                content = "No content available"

            # Format result
            if i == 1:
                response_parts.append(f"From your {title}: {content}")
            else:
                response_parts.append(f"Result {i} from {title}: {content}")

        # Closing hint if more results
        if count > 3:
            response_parts.append(
                f"There are {count - 3} more results. Say 'show more' to continue."
            )

        return " ".join(response_parts)
