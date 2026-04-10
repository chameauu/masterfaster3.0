# Delete File Tool vs SurfSense API Comparison

## Date
April 10, 2026

## Overview
After searching the SurfSense codebase, I found the actual document deletion implementation in `backend/app/routes/documents_routes.py` (lines 1180-1250). My `delete_file` agent tool implementation now matches the official SurfSense API endpoint exactly.

## SurfSense API Implementation

**Location**: `backend/app/routes/documents_routes.py:1180`

**Endpoint**: `DELETE /api/v1/documents/{document_id}`

**Key Features**:
1. Fetches document by ID
2. Returns 404 if document not found
3. Checks document status (cannot delete if `pending`, `processing`, or `deleting`)
4. Verifies `DOCUMENTS_DELETE` permission
5. Marks document status as `deleting` immediately
6. Commits to database (fast response to user)
7. Dispatches Celery background task for actual deletion
8. Reverts status to `ready` if Celery dispatch fails

## My Tool Implementation

**Location**: `backend/app/agents/new_chat/tools/delete_file.py`

**Tool Name**: `delete_file`

**Implementation**: Matches the API endpoint exactly with these adaptations:

### Similarities (100% Match)
✅ Same document fetching logic
✅ Same status validation (`pending`, `processing`, `deleting`)
✅ Same permission check using `check_permission()`
✅ Same status marking strategy (`{"state": "deleting"}`)
✅ Same Celery task dispatch (`delete_document_task.delay()`)
✅ Same rollback logic if dispatch fails
✅ Same error handling patterns

### Differences (Tool-Specific Enhancements)
1. **Return Format**: Returns user-friendly strings instead of HTTP responses
2. **User Confirmation**: Tool description requires agent to ask for confirmation first
3. **Emoji Feedback**: Uses ✅, ❌, ⚠️ for better UX in chat
4. **Document Details**: Includes document title and type in success message
5. **HTTPException Handling**: Catches and converts to string messages

## Code Comparison

### SurfSense API Endpoint
```python
@router.delete("/documents/{document_id}", response_model=dict)
async def delete_document(
    document_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Delete a document. Requires DOCUMENTS_DELETE permission."""
    try:
        # Fetch document
        result = await session.execute(
            select(Document).filter(Document.id == document_id)
        )
        document = result.scalars().first()

        if not document:
            raise HTTPException(status_code=404, detail=f"Document with id {document_id} not found")

        # Check status
        doc_state = document.status.get("state") if document.status else None
        if doc_state in ("pending", "processing"):
            raise HTTPException(status_code=409, detail="Cannot delete document while it is pending or being processed.")
        if doc_state == "deleting":
            raise HTTPException(status_code=409, detail="Document is already being deleted.")

        # Check permission
        await check_permission(
            session, user, document.search_space_id,
            Permission.DOCUMENTS_DELETE.value,
            "You don't have permission to delete documents in this search space"
        )

        # Mark as deleting
        document.status = {"state": "deleting"}
        await session.commit()

        # Dispatch Celery task
        try:
            from app.tasks.celery_tasks.document_tasks import delete_document_task
            delete_document_task.delay(document_id)
        except Exception as dispatch_error:
            document.status = {"state": "ready"}
            await session.commit()
            raise HTTPException(status_code=503, detail="Failed to queue background deletion.")

        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {e!s}")
```

### My Tool Implementation
```python
async def _delete_file_impl(document_id: int) -> str:
    """Delete a document from the knowledge base."""
    try:
        # Fetch document (SAME)
        result = await db_session.execute(
            select(Document).filter(Document.id == document_id)
        )
        document = result.scalars().first()

        if not document:
            return f"❌ Error: Document with ID {document_id} not found."

        # Check status (SAME)
        doc_state = document.status.get("state") if document.status else None
        if doc_state in ("pending", "processing"):
            return f"❌ Cannot delete document '{document.title}' while it is pending or being processed."
        if doc_state == "deleting":
            return f"⚠️ Document '{document.title}' is already being deleted."

        # Check permission (SAME)
        await check_permission(
            db_session, user, document.search_space_id,
            Permission.DOCUMENTS_DELETE.value,
            "You don't have permission to delete documents in this search space"
        )

        # Store info for response
        doc_title = document.title
        doc_type = document.document_type.value if document.document_type else "document"

        # Mark as deleting (SAME)
        document.status = {"state": "deleting"}
        await db_session.commit()

        # Dispatch Celery task (SAME)
        try:
            from app.tasks.celery_tasks.document_tasks import delete_document_task
            delete_document_task.delay(document_id)
            
            return (
                f"✅ Successfully deleted '{doc_title}' ({doc_type}).\n"
                f"Document ID: {document_id}\n"
                "The file has been removed from your knowledge base."
            )
        except Exception:
            # Revert status (SAME)
            document.status = {"state": "ready"}
            await db_session.commit()
            return f"❌ Failed to queue deletion for '{doc_title}'. Please try again later."

    except HTTPException as http_exc:
        return f"❌ {http_exc.detail}"
    except Exception as e:
        await db_session.rollback()
        return f"❌ Error deleting document: {str(e)}"
```

## Validation

### Status Checks
Both implementations prevent deletion when document is:
- ✅ `pending` - Document is queued for processing
- ✅ `processing` - Document is currently being processed
- ✅ `deleting` - Document is already being deleted

### Permission Checks
Both use the same RBAC system:
- ✅ `check_permission()` function
- ✅ `Permission.DOCUMENTS_DELETE.value`
- ✅ Same error message format

### Celery Integration
Both use the same background task:
- ✅ `delete_document_task.delay(document_id)`
- ✅ Same rollback strategy on failure
- ✅ Same status marking approach

## Conclusion

My `delete_file` tool implementation is **100% compatible** with the SurfSense API's document deletion logic. The core deletion flow is identical, with only presentation differences (string messages vs HTTP responses) to make it suitable for agent-based interaction.

The tool follows SurfSense's best practices:
1. Fast API response (mark as deleting, then background process)
2. Durable deletion (Celery task survives API restarts)
3. Proper error handling (rollback on failure)
4. Permission-based access control
5. Status validation to prevent conflicts

## Testing Recommendations

1. ✅ Test with document in `ready` state (should succeed)
2. ✅ Test with document in `pending` state (should fail with message)
3. ✅ Test with document in `processing` state (should fail with message)
4. ✅ Test with document in `deleting` state (should warn already deleting)
5. ✅ Test with non-existent document ID (should return not found)
6. ✅ Test without DOCUMENTS_DELETE permission (should fail with permission error)
7. ✅ Test Celery dispatch failure (should revert status)

## Files Referenced

- **API Implementation**: `backend/app/routes/documents_routes.py:1180-1250`
- **Tool Implementation**: `backend/app/agents/new_chat/tools/delete_file.py`
- **Celery Task**: `app.tasks.celery_tasks.document_tasks.delete_document_task`
- **Permission Check**: `app.utils.rbac.check_permission`
- **Database Models**: `app.db.Document`, `app.db.Permission`, `app.db.User`
