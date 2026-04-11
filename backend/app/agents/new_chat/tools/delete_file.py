"""
Delete file tool for the SurfSense agent.

Allows the agent to delete documents from the knowledge base by filename.
No permission checks - deletes immediately when requested.
"""

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Document


class DeleteFileInput(BaseModel):
    """Input schema for the delete_file tool."""

    filename: str = Field(
        description="Name of the file to delete (e.g., 'file.md', 'pngegg.png', 'report.pdf')"
    )


def create_delete_file_tool(
    db_session: AsyncSession,
    search_space_id: int,
) -> StructuredTool:
    """
    Factory function to create the delete_file tool.

    Args:
        db_session: Database session for executing queries
        search_space_id: The search space ID to search in

    Returns:
        A configured tool for deleting documents
    """

    async def _delete_file_impl(filename: str) -> str:
        """
        Delete a document from the knowledge base by filename.

        Args:
            filename: The name of the file to delete

        Returns:
            Success or error message
        """
        try:
            # Clean up the filename - remove .xml extension if present in search
            # This handles cases where documents are stored as "file.md.xml" but user says "file.md"
            search_filename = filename.replace('.xml', '')
            
            # Search for document by filename (case-insensitive, partial match)
            result = await db_session.execute(
                select(Document).filter(
                    Document.search_space_id == search_space_id,
                    Document.title.ilike(f"%{search_filename}%"),
                )
            )
            documents = result.scalars().all()

            # Handle not found
            if not documents:
                return f"❌ No document found with name '{filename}' in your knowledge base."

            # Handle multiple matches
            if len(documents) > 1:
                doc_list = "\n".join(
                    [f"  - ID {doc.id}: {doc.title}" for doc in documents[:5]]
                )
                return (
                    f"❌ Found {len(documents)} documents matching '{filename}':\n{doc_list}\n\n"
                    f"Please be more specific with the filename."
                )

            # Found exactly one document
            document = documents[0]
            doc_title = document.title
            doc_id = document.id

            # Check if already deleting
            doc_state = document.status.get("state") if document.status else None
            if doc_state == "deleting":
                return f"⚠️ Document '{doc_title}' is already being deleted."

            # Mark as deleting
            document.status = {"state": "deleting"}
            await db_session.commit()

            # Dispatch Celery background task
            try:
                from app.tasks.celery_tasks.document_tasks import delete_document_task

                delete_document_task.delay(doc_id)

                return f"✅ Deleted '{doc_title}' (ID: {doc_id})"

            except Exception as e:
                # Revert status if Celery dispatch fails
                document.status = {"state": "ready"}
                await db_session.commit()
                return f"❌ Failed to delete '{doc_title}': {str(e)}"

        except Exception as e:
            await db_session.rollback()
            return f"❌ Error deleting document: {str(e)}"

    return StructuredTool(
        name="delete_file",
        description=(
            "Delete a document from the user's knowledge base by filename. "
            "Use this when the user asks to delete, remove, or trash a file. "
            "\n\n"
            "Provide the filename (e.g., 'report.pdf', 'file.md', 'pngegg.png'). "
            "The tool will search for the file by name and delete it immediately. "
            "\n\n"
            "The document will be permanently removed from the knowledge base."
        ),
        coroutine=_delete_file_impl,
        args_schema=DeleteFileInput,
    )
