# Agent-Browser + SurfSense LLM Integration

**Date:** 2026-04-10  
**Purpose:** How the SurfSense LLM agent uses agent-browser for voice-controlled interface  
**Status:** Implementation Complete

---

## 🎯 Overview

The SurfSense LLM agent now has a built-in `agent_browser` tool that allows it to control the SurfSense web interface using natural language commands. This enables **voice-controlled navigation** where users can speak commands like "go to dashboard" or "read this page" and the LLM translates them into browser automation actions.

---

## 🏗️ Architecture

### How It Works

```
User Voice Input
    ↓
Web Speech API (STT)
    ↓
Natural Language Command → Chat Message
    ↓
SurfSense LLM Agent
    ↓
Decides to use agent_browser tool
    ↓
agent_browser Tool (backend/app/agents/new_chat/tools/agent_browser.py)
    ↓
Translates NL → agent-browser CLI command
    ↓
Executes: agent-browser <command>
    ↓
Returns result to LLM
    ↓
LLM formats response
    ↓
Web Speech API (TTS) reads response
    ↓
User hears result
```

### Key Components

1. **LangChain Tool** (`agent_browser.py`)
   - Registered in the tools registry
   - Available to the LLM agent
   - Translates natural language to CLI commands
   - Executes agent-browser CLI
   - Returns formatted results

2. **System Prompt Instructions** (`system_prompt.py`)
   - Tells the LLM when to use the tool
   - Provides examples of usage
   - Explains expected behavior

3. **Tool Registry** (`registry.py`)
   - Registers the tool with the agent
   - Disabled by default (enable via voice interface)
   - No dependencies required

---

## 🔧 Implementation Details

### 1. Tool Definition

**File:** `backend/app/agents/new_chat/tools/agent_browser.py`

The tool provides:
- `AgentBrowserService`: Executes agent-browser CLI commands
- `translate_natural_language()`: Converts NL to CLI commands
- `create_agent_browser_tool()`: Factory function for LangChain

**Key Methods:**

```python
# Check if agent-browser is installed
service.is_available() -> bool

# Execute CLI command
await service.execute_command("open /dashboard") -> dict

# Translate natural language
await service.translate_natural_language("go to dashboard") -> str
```

### 2. Natural Language Translation

The tool includes a rule-based translator that maps common voice commands to agent-browser CLI:

| Voice Command | agent-browser CLI |
|---------------|-------------------|
| "go to dashboard" | `open /dashboard` |
| "go to documents" | `open /dashboard/documents` |
| "go back" | `back` |
| "refresh page" | `reload` |
| "read the page" | `snapshot -i` |
| "read the title" | `get text h1` |
| "click first button" | `find role button click` |
| "click submit" | `find role button click --name Submit` |
| "screenshot" | `screenshot` |

**Future Enhancement:** Replace rule-based translator with LLM-based translation for more sophisticated command understanding.

### 3. Tool Registration

**File:** `backend/app/agents/new_chat/tools/registry.py`

```python
ToolDefinition(
    name="agent_browser",
    description="Control the SurfSense web interface using natural language browser automation commands",
    factory=lambda deps: create_agent_browser_tool(),
    requires=[],  # No dependencies needed
    enabled_by_default=False,  # Disabled by default
),
```

**Why disabled by default?**
- Requires agent-browser CLI to be installed
- Primarily for voice interface use case
- Users can enable it when needed

### 4. System Prompt Instructions

**File:** `backend/app/agents/new_chat/system_prompt.py`

The LLM receives these instructions:

```
- agent_browser: Control the SurfSense web interface using natural language browser automation.
  - Use this when the user wants to control the SurfSense interface via voice commands.
  - Trigger scenarios:
    * "Go to dashboard" / "Navigate to documents" / "Open settings"
    * "Click the first button" / "Click submit"
    * "Read the page" / "What's on this page" / "Read the title"
    * "Search for quantum computing"
    * "Take a screenshot"
  - Args:
    - command: Natural language command describing what to do in the browser
    - context: Optional context about the current page or previous actions
  - Returns: Result of the browser action
```

**Examples provided to LLM:**

```
- User: "Go to the dashboard"
  → Call: agent_browser(command="go to dashboard")
  → Confirm: "Navigated to the dashboard."

- User: "Read what's on this page"
  → Call: agent_browser(command="read the page")
  → Present the page content in a structured format.
```

---

## 🎤 Voice Interface Flow

### Example 1: Navigation

```
User (voice): "Go to my documents"
    ↓
STT: "Go to my documents"
    ↓
LLM receives: "Go to my documents"
    ↓
LLM decides: Use agent_browser tool
    ↓
Tool call: agent_browser(command="go to my documents")
    ↓
Translation: "open /dashboard/documents"
    ↓
Execute: agent-browser open /dashboard/documents
    ↓
Result: "Navigation completed. Page loaded."
    ↓
LLM response: "I've navigated to your documents page."
    ↓
TTS: "I've navigated to your documents page."
```

### Example 2: Reading Content

```
User (voice): "What's on this page?"
    ↓
STT: "What's on this page?"
    ↓
LLM receives: "What's on this page?"
    ↓
LLM decides: Use agent_browser tool
    ↓
Tool call: agent_browser(command="read the page")
    ↓
Translation: "snapshot -i"
    ↓
Execute: agent-browser snapshot -i
    ↓
Result: "@e1 [button] 'New Chat'\n@e2 [link] 'Documents'\n..."
    ↓
LLM response: "This page shows:\n- A 'New Chat' button\n- A 'Documents' link\n..."
    ↓
TTS: "This page shows: A 'New Chat' button, A 'Documents' link..."
```

### Example 3: Interaction

```
User (voice): "Click the first button"
    ↓
STT: "Click the first button"
    ↓
LLM receives: "Click the first button"
    ↓
LLM decides: Use agent_browser tool
    ↓
Tool call: agent_browser(command="click the first button")
    ↓
Translation: "find role button click"
    ↓
Execute: agent-browser find role button click
    ↓
Result: "Action completed successfully."
    ↓
LLM response: "I've clicked the first button on the page."
    ↓
TTS: "I've clicked the first button on the page."
```

---

## 🚀 Enabling the Tool

### Option 1: Enable for Specific Chat

When creating a chat agent, enable the tool:

```python
agent = await create_surfsense_deep_agent(
    llm=llm,
    search_space_id=search_space_id,
    db_session=db_session,
    connector_service=connector_service,
    checkpointer=checkpointer,
    enabled_tools=["agent_browser"],  # Enable explicitly
)
```

### Option 2: Enable Globally

Modify the tool definition in `registry.py`:

```python
ToolDefinition(
    name="agent_browser",
    description="...",
    factory=lambda deps: create_agent_browser_tool(),
    requires=[],
    enabled_by_default=True,  # Change to True
),
```

### Option 3: Enable via Voice Interface

The voice interface can dynamically enable the tool when voice commands are detected:

```python
# In voice command handler
if is_voice_command(message):
    enabled_tools = ["agent_browser"]
    agent = await create_surfsense_deep_agent(
        ...,
        enabled_tools=enabled_tools,
    )
```

---

## 📋 Installation Requirements

### 1. Install agent-browser CLI

The tool requires the agent-browser CLI to be installed:

```bash
# Install agent-browser (requires Node.js)
npm install -g @vercel-labs/agent-browser

# Verify installation
agent-browser --version
```

### 2. Check Availability

The tool automatically checks if agent-browser is available:

```python
from app.agents.new_chat.tools.agent_browser import AgentBrowserService

service = AgentBrowserService()
if service.is_available():
    print("agent-browser is ready!")
else:
    print("agent-browser is not installed")
```

If not available, the tool returns a helpful error message to the user.

---

## 🎯 Use Cases

### 1. Voice-Controlled Navigation

**User:** "Go to settings"  
**LLM:** Uses agent_browser → Navigates to /settings  
**Response:** "I've opened the settings page."

### 2. Accessibility for Visually Impaired

**User:** "Read the main content"  
**LLM:** Uses agent_browser → Gets text from main element  
**Response:** Reads the content aloud via TTS

### 3. Hands-Free Operation

**User:** "Search for quantum computing"  
**LLM:** Uses agent_browser → Fills search field  
**Response:** "I've searched for quantum computing."

### 4. Page Exploration

**User:** "What buttons are on this page?"  
**LLM:** Uses agent_browser → Gets snapshot  
**Response:** Lists all buttons with their labels

---

## 🔄 Comparison: Direct Tool vs LLM-Mediated

### Option A: Direct Tool (Previous Plan)

```
Voice → API Route → agent-browser CLI → Result → TTS
```

**Pros:**
- Faster (no LLM inference)
- More predictable
- Lower cost

**Cons:**
- Requires separate API routes
- No context awareness
- Limited to predefined commands
- No integration with chat history

### Option B: LLM-Mediated (Current Implementation)

```
Voice → LLM Agent → agent_browser tool → CLI → Result → LLM → TTS
```

**Pros:**
- Context-aware (knows chat history)
- Flexible command understanding
- Natural language responses
- Integrated with existing agent
- Can combine with other tools
- Learns from conversation

**Cons:**
- Slower (LLM inference)
- Higher cost (LLM tokens)
- Less predictable

**Decision:** We chose Option B (LLM-mediated) because:
1. Better user experience (natural language understanding)
2. Context awareness (knows what user is working on)
3. Integration with existing tools (can combine browser control with search, reports, etc.)
4. Flexibility (handles variations in commands)

---

## 🎓 Advanced Patterns

### 1. Multi-Step Actions

The LLM can chain multiple agent_browser calls:

```
User: "Go to documents and open the first one"

LLM:
1. agent_browser(command="go to documents")
2. agent_browser(command="read the page")  # Get list of documents
3. agent_browser(command="click first document")
```

### 2. Context-Aware Commands

The LLM uses conversation context:

```
User: "Search for quantum computing"
LLM: [Uses knowledge base search tool]

User: "Now open the first result"
LLM: [Uses agent_browser to click first result]
     [Knows "first result" refers to previous search]
```

### 3. Combined Tool Usage

The LLM can combine agent_browser with other tools:

```
User: "Go to the article page and summarize it"

LLM:
1. agent_browser(command="go to article page")
2. agent_browser(command="read the content")
3. [Generates summary from content]
```

### 4. Error Recovery

The LLM can handle errors gracefully:

```
agent_browser returns: "Element not found"

LLM:
1. agent_browser(command="read the page")  # Get current state
2. Analyzes available elements
3. Suggests alternative action to user
```

---

## 🐛 Troubleshooting

### Issue 1: "agent-browser is not installed"

**Solution:**
```bash
npm install -g @vercel-labs/agent-browser
```

### Issue 2: Tool not available to LLM

**Check:**
1. Is the tool registered in `registry.py`?
2. Is it enabled? (Check `enabled_by_default` or `enabled_tools`)
3. Are system prompt instructions included?

**Debug:**
```python
from app.agents.new_chat.tools.registry import get_all_tool_names
print(get_all_tool_names())  # Should include 'agent_browser'
```

### Issue 3: Commands not working

**Check:**
1. Is agent-browser CLI working? Test manually:
   ```bash
   agent-browser open https://example.com
   ```
2. Check logs for translation errors
3. Verify command syntax in `translate_natural_language()`

### Issue 4: LLM not using the tool

**Possible causes:**
1. Command doesn't match trigger scenarios in system prompt
2. Tool is disabled
3. LLM doesn't recognize it as a browser control request

**Solution:**
- Add more examples to system prompt
- Make trigger scenarios more explicit
- Test with clear commands like "use agent_browser to go to dashboard"

---

## 📊 Performance Considerations

### Latency Breakdown

```
Voice Command → Result:
├─ STT: ~500ms
├─ LLM Inference: ~1-3s
├─ agent-browser CLI: ~500ms-2s
├─ LLM Response: ~500ms
└─ TTS: ~1-2s
Total: ~4-9 seconds
```

### Optimization Strategies

1. **Streaming LLM Responses**
   - Start TTS before full LLM response completes
   - Reduces perceived latency

2. **Caching**
   - Cache common command translations
   - Skip LLM for simple commands

3. **Parallel Execution**
   - Run agent-browser and LLM response formatting in parallel

4. **Faster Models**
   - Use smaller, faster LLMs for simple commands
   - Reserve large models for complex reasoning

---

## 🎉 Summary

### What We Built

A **LangChain tool** that allows the SurfSense LLM agent to control the browser using natural language commands via agent-browser CLI.

### Key Benefits

✅ **Natural Language Understanding** - Flexible command interpretation  
✅ **Context Awareness** - Knows chat history and user intent  
✅ **Tool Integration** - Combines with other agent tools  
✅ **Voice-Friendly** - Perfect for voice interface  
✅ **Accessibility** - Enables hands-free, eyes-free operation  

### How It Works

1. User speaks command
2. STT converts to text
3. LLM receives command as chat message
4. LLM decides to use `agent_browser` tool
5. Tool translates NL → CLI command
6. Executes agent-browser CLI
7. Returns result to LLM
8. LLM formats response
9. TTS reads response to user

### Next Steps

1. **Install agent-browser CLI**
   ```bash
   npm install -g @vercel-labs/agent-browser
   ```

2. **Enable the tool** (choose one):
   - Per-chat: `enabled_tools=["agent_browser"]`
   - Globally: `enabled_by_default=True` in registry
   - Dynamically: Enable when voice commands detected

3. **Test with voice commands**:
   - "Go to dashboard"
   - "Read this page"
   - "Click the first button"

4. **Enhance translation** (optional):
   - Replace rule-based translator with LLM
   - Add more command patterns
   - Improve error handling

---

**Status:** ✅ Implementation Complete  
**Ready for:** Testing and integration with voice interface  
**Last Updated:** 2026-04-10
