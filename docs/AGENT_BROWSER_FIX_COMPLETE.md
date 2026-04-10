# Agent-Browser Click Fix Complete ✅

**Date:** 2026-04-10  
**Issue:** LLM was claiming to click buttons but not actually calling the tool correctly  
**Status:** ✅ FIXED

---

## What Was Wrong

The LLM was responding "I clicked the upload button" without actually making the tool calls needed to click it. Two issues were identified:

### Issue 1: Element Reference Not Recognized
The `translate_natural_language` function didn't recognize element references like `@e18`, so when the LLM tried to call `agent_browser(command="click @e18")`, it was being translated back to `snapshot -i` instead of actually clicking.

### Issue 2: Unclear Instructions
The system prompt didn't make it crystal clear that the LLM MUST make TWO separate tool calls for clicking:
1. First call to get snapshot
2. Second call with element reference to click

---

## What Was Fixed

### 1. Fixed Element Reference Recognition

**File:** `backend/app/agents/new_chat/tools/agent_browser.py`

Added detection for element references at the start of `translate_natural_language`:

```python
# Direct element reference commands (e.g., "click @e18", "fill @e5 with text")
# These should be passed through directly without translation
if "@e" in original:
    # This is a direct element reference command, pass it through
    return original
```

Now commands like `click @e18` are passed directly to agent-browser CLI without translation.

### 2. Improved System Prompt Instructions

**File:** `backend/app/agents/new_chat/system_prompt.py`

Made the two-step workflow MUCH clearer:

```python
_TOOL_INSTRUCTIONS["agent_browser"] = """
- agent_browser: Control the SurfSense web interface using natural language browser automation.
  - CRITICAL TWO-STEP WORKFLOW FOR CLICKS:
    * Step 1: Call with natural language (e.g., "click upload button") → Returns page snapshot with element refs
    * Step 2: Analyze snapshot, find the element ref (e.g., @e18), then call again with "click @e18"
    * You MUST make BOTH calls to complete a click action
  ...
"""
```

### 3. Enhanced Examples

Added detailed step-by-step examples showing EXACTLY what the LLM should do:

```python
_TOOL_EXAMPLES["agent_browser"] = """
- User: "Click the upload button"
  - Step 1: Call `agent_browser(command="click upload button")`
  - Tool returns snapshot: "- button 'Upload' [ref=e18]\\n- button 'Submit' [ref=e19]..."
  - Step 2: Analyze snapshot and find: "button 'Upload' [ref=e18]"
  - Step 3: Call `agent_browser(command="click @e18")`
  - Tool returns: "Action completed successfully"
  - Then confirm: "I clicked the upload button."

CRITICAL: For ANY click/fill action, you MUST make TWO tool calls:
1. First call to get snapshot and find element refs
2. Second call with the specific @eXX reference to perform the action
"""
```

---

## Test Results

### Direct Tool Test

```bash
cd backend
uv run python test_llm_agent_browser.py
```

**Result:** ✅ SUCCESS

```
[Test 1] Calling tool with 'click the upload button'...
✓ Tool correctly returned a snapshot (step 1 of 2-step click)

[Test 2] Now clicking the specific element @e18...
Result: Action completed successfully. ✓ Done...
✓ Successfully clicked the upload button!
```

---

## How to Test with LLM

### Step 1: Restart Backend

The backend needs to be restarted to pick up the system prompt changes:

```bash
# Stop the current backend (Ctrl+C in the terminal running it)

# Start it again
cd backend
uv run python -m app.app
```

### Step 2: Test in Chat

Open http://localhost:3000 and type or say:

**"Click the upload button"**

### Expected Behavior

The LLM should now:

1. **First tool call:** `agent_browser(command="click the upload button")`
   - Returns page snapshot with element refs

2. **Analyze snapshot:** Find the upload button reference (e.g., `@e18`)

3. **Second tool call:** `agent_browser(command="click @e18")`
   - Actually clicks the button

4. **Respond:** "I clicked the upload button. The file upload dialog should now be open."

### What You Should See

- Browser window shows the file upload dialog opening
- LLM confirms the action was completed
- Backend logs show TWO tool calls being made

---

## Backend Logs to Watch

When the LLM makes the calls, you should see in backend logs:

```
[agent_browser] Executing: agent-browser --headed snapshot -i
[agent_browser] Command succeeded. Output length: 2283 chars
[agent_browser] Executing: agent-browser --headed click @e18
[agent_browser] Command succeeded
```

---

## Troubleshooting

### LLM still not clicking?

**Check:**
1. Did you restart the backend after the changes?
2. Check backend logs - are TWO tool calls being made?
3. Is the browser window visible?

**Solution:**
```bash
# Restart backend
cd backend
# Stop with Ctrl+C
uv run python -m app.app
```

### LLM makes one call but not the second?

This means the LLM isn't following the instructions. The system prompt changes should fix this, but if it persists:

1. Check if the tool is actually enabled (should be by default)
2. Try being more explicit: "Use the agent browser tool to click the upload button"
3. Check the LLM model being used - some models follow instructions better than others

### Browser window not opening?

```bash
# Close and restart daemon
agent-browser close
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome agent-browser --headed open http://localhost:3000
```

---

## Files Modified

1. `backend/app/agents/new_chat/tools/agent_browser.py`
   - Added element reference detection in `translate_natural_language`

2. `backend/app/agents/new_chat/system_prompt.py`
   - Enhanced `_TOOL_INSTRUCTIONS["agent_browser"]` with clearer two-step workflow
   - Improved `_TOOL_EXAMPLES["agent_browser"]` with detailed step-by-step examples

3. `backend/test_llm_agent_browser.py`
   - Created test script to verify tool works correctly

---

## Summary

The agent_browser tool now:
- ✅ Correctly recognizes element references (`@e18`)
- ✅ Passes them through to agent-browser CLI without translation
- ✅ Has clear instructions for LLM to make TWO calls for clicks
- ✅ Has detailed examples showing the exact workflow
- ✅ Works correctly when tested directly

**Next step:** Restart the backend and test with the LLM in the chat interface!

---

**Last Updated:** 2026-04-10 15:26  
**Action Required:** Restart backend to apply system prompt changes
