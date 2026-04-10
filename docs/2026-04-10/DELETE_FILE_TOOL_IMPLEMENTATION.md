# Delete File Tool Implementation

## Summary
Successfully implemented a `delete_file` agent tool that allows the SurfSense AI agent to delete documents from the user's knowledge base with proper permission checks and user confirmation.

## Date
April 10, 2026

## Implementation Details

### 1. Tool Implementation (`backend/app/agents/new_chat/tools/delete_file.py`)

Created a new tool with the following features:

- **Input Schema**: `DeleteFileInput` with `document_id` parameter
- **Factory Function**: `create_delete_file_tool(db_session, user)` 
- **Permission Checks**: Uses `check_permission()` to verify DOCUMENTS_DELETE permission
- **Status Validation**: Prevents deletion of documents that are:
  - Pending
  - Processing
  - Already being deleted
- **Background Processing**: Dispatches deletion via Celery task (`delete_document_task`)
- **Error Handling**: Comprehensive error messages with emojis for user feedback
- **Rollback Support**: Reverts document status if Celery dispatch fails

### 2. Tool Registration (`backend/app/agents/new_chat/tools/registry.py`)

Added the tool to the registry:

```python
ToolDefinition(
    name="delete_file",
    description="Delete a document from the user's knowledge base with proper permission checks",
    factory=lambda deps: create_delete_file_tool(
        db_session=deps["db_session"],
        user=deps["user"],
    ),
    requires=["db_session", "user"],
    enabled_by_default=True,
)
```

### 3. System Prompt Instructions (`backend/app/agents/new_chat/system_prompt.py`)

Added comprehensive instructions and examples:

**Tool Instructions**:
- Clear trigger phrases: "delete this file", "remove the document", "trash this"
- CRITICAL requirement: Always confirm with user before deleting
- Permission requirements documented
- Status restrictions explained

**Tool Examples**:
- Example 1: Delete by document ID with confirmation
- Example 2: Search for document first, then delete
- Example 3: Delete file mentioned earlier in conversation

**Ordered List**: Added `delete_file` to `_ALL_TOOL_NAMES_ORDERED` (position 4, after agent_browser)

### 4. User Object Dependency Fix (`backend/app/agents/new_chat/chat_deepagent.py`)

**Problem**: The `delete_file` tool requires a `User` object (not just `user_id`) for permission checks via `check_permission()`.

**Solution**: Modified `create_surfsense_deep_agent()` to fetch the User object from the database when `user_id` is provided:

```python
# Fetch user object if user_id is provided (needed for permission checks)
user: User | None = None
if user_id:
    from app.db import User
    from sqlalchemy import select
    
    result = await db_session.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()

dependencies = {
    # ... other dependencies ...
    "user_id": user_id,
    "user": user,  # Added user object
    # ... other dependencies ...
}
```

## Tool Behavior

### Confirmation Flow
1. User: "Delete document ID 42"
2. Agent: "Are you sure you want to delete document ID 42?"
3. User: "Yes, delete it"
4. Agent calls `delete_file(document_id=42)`
5. Agent: "Document has been deleted successfully."

### Permission Checks
- Verifies user has `DOCUMENTS_DELETE` permission in the document's search space
- Returns clear error message if permission denied

### Status Validation
- Cannot delete documents with status: `pending`, `processing`, or `deleting`
- Returns appropriate error messages for each case

### Background Processing
- Marks document status as `deleting` immediately
- Dispatches Celery task for actual deletion
- Reverts status if task dispatch fails

## Files Modified

1. **Created**: `backend/app/agents/new_chat/tools/delete_file.py` (117 lines)
2. **Modified**: `backend/app/agents/new_chat/tools/registry.py` (added tool definition)
3. **Modified**: `backend/app/agents/new_chat/system_prompt.py` (added instructions and examples)
4. **Modified**: `backend/app/agents/new_chat/chat_deepagent.py` (added user object fetching)

## Testing

Created test script: `demo/test_delete_file_tool.py` to verify:
- Tool can be imported successfully
- Tool is registered in BUILTIN_TOOLS
- System prompt includes instructions and examples

## Usage Example

```python
# User asks to delete a file
"Delete the research paper about quantum computing"

# Agent searches for the document
# Agent finds: "Quantum Computing Research Paper" (ID: 123)

# Agent asks for confirmation
"I found 'Quantum Computing Research Paper' (ID: 123). Are you sure you want to delete it?"

# User confirms
"Yes"

# Agent calls delete_file tool
delete_file(document_id=123)

# Agent confirms deletion
"The file has been removed from your knowledge base."
```

## Security Considerations

1. **Permission Checks**: Always verifies DOCUMENTS_DELETE permission
2. **User Confirmation**: Requires explicit user confirmation before deletion
3. **Status Validation**: Prevents deletion of documents in transitional states
4. **Error Handling**: Graceful error messages without exposing internal details
5. **Rollback Support**: Reverts status if background task dispatch fails

## Integration Points

- **Database**: Uses SQLAlchemy async session for queries
- **RBAC**: Integrates with `app.utils.rbac.check_permission()`
- **Celery**: Dispatches `delete_document_task` for background processing
- **LangChain**: Uses `StructuredTool` for agent integration
- **Pydantic**: Uses `BaseModel` for input validation

## Next Steps

1. ✅ Tool implementation complete
2. ✅ Tool registered in registry
3. ✅ System prompt instructions added
4. ✅ User object dependency resolved
5. 🔄 Ready for testing with live agent
6. ⏳ Consider adding bulk delete functionality in future
7. ⏳ Consider adding undo/restore functionality

## Notes

- The tool follows the same pattern as other connector tools (Linear, Notion, Jira, etc.)
- Error messages use emojis (✅, ❌, ⚠️) for better UX
- Tool is enabled by default for all users
- Deletion is permanent and cannot be undone (by design)
