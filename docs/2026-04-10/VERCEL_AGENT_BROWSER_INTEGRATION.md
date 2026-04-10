# Vercel Agent-Browser Integration for SurfSense

**Date:** 2026-04-10  
**Purpose:** Using Vercel's agent-browser for voice-controlled SurfSense interface  
**Technology:** @vercel-labs/agent-browser + Web Speech API  
**Target:** Visually impaired users controlling SurfSense via voice

---

## 🎯 What is Agent-Browser?

**Agent-Browser** is a headless browser automation CLI designed specifically for AI agents, created by Vercel Labs.

### Key Features

✅ **Agent-First Output** - Compact text format (not JSON) reduces tokens  
✅ **Ref-Based Selection** - Uses accessibility tree with unique refs (@e1, @e2)  
✅ **Fast** - Native Rust CLI for quick command parsing  
✅ **Complete** - 50+ commands for navigation, forms, screenshots  
✅ **Semantic Locators** - Find elements by role, label, text, placeholder  
✅ **Accessibility Tree** - Built-in support for screen reader compatibility  
✅ **Cross-Platform** - macOS, Linux, Windows support  

---

## 📊 Comparison: Agent-Browser vs Manual DOM Manipulation

| Feature | **Manual DOM** | **Agent-Browser** |
|---------|---------------|-------------------|
| **Element Selection** | CSS selectors | Semantic refs (@e1) |
| **Accessibility** | Manual | Built-in |
| **AI Integration** | Complex | Native |
| **Token Usage** | High (JSON) | Low (text) |
| **Reliability** | Brittle | Robust |
| **Speed** | Slow | Fast (Rust) |
| **Voice Control** | Custom code | Natural language |
| **Maintenance** | High | Low |

---

## 🏗️ Architecture with Agent-Browser

### High-Level Design

```
User Voice Input
    ↓
Web Speech API (STT)
    ↓
Natural Language Command
    ↓
LLM (Parse Intent)
    ↓
Agent-Browser CLI
    ↓
┌─────────────────────────────────┐
│   Agent-Browser Actions         │
├─────────────────────────────────┤
│ • Navigate (open URL)           │
│ • Snapshot (get elements)       │
│ • Click (@e1)                   │
│ • Fill (@e2, "text")            │
│ • Get text (@e3)                │
│ • Screenshot                    │
└─────────────────────────────────┘
    ↓
Extract Result
    ↓
Web Speech API (TTS)
    ↓
User Hears Response
```

### Component Architecture

```
backend/
├── app/services/agent_browser/
│   ├── agent_browser_service.py    # Main service
│   ├── command_executor.py         # Execute CLI commands
│   ├── snapshot_parser.py          # Parse snapshots
│   └── voice_to_command.py         # Voice → CLI commands
└── app/routes/
    └── agent_browser_routes.py     # API endpoints

frontend/
├── components/agent-browser/
│   ├── agent-browser-viewer.tsx    # Show browser state
│   └── agent-browser-status.tsx    # Status indicator
└── hooks/
    └── use-agent-browser.ts        # React hook
```

---

## 🎤 Voice Commands → Agent-Browser Commands

### Navigation Commands

| Voice Command | Agent-Browser CLI |
|---------------|-------------------|
| "Go to dashboard" | `agent-browser open /dashboard` |
| "Navigate to documents" | `agent-browser open /dashboard/documents` |
| "Go back" | `agent-browser back` |
| "Refresh page" | `agent-browser reload` |

### Reading Commands

| Voice Command | Agent-Browser CLI |
|---------------|-------------------|
| "Read this page" | `agent-browser snapshot` → TTS |
| "Read the title" | `agent-browser get text @e1` → TTS |
| "What's on the page?" | `agent-browser snapshot -i` → TTS |
| "Read main content" | `agent-browser get text main` → TTS |

### Interaction Commands

| Voice Command | Agent-Browser CLI |
|---------------|-------------------|
| "Click the first button" | `agent-browser find role button click` |
| "Search for quantum" | `agent-browser fill @e2 "quantum"` |
| "Submit the form" | `agent-browser click @e5` |
| "Open first document" | `agent-browser click @e3` |

---

## 🔧 Implementation

### 1. Agent-Browser Service (Backend)

**File:** `backend/app/services/agent_browser/agent_browser_service.py`

```python
import asyncio
import json
from typing import Dict, Any, List
import subprocess

class AgentBrowserService:
    """Service for controlling browser via agent-browser CLI"""
    
    def __init__(self):
        self.session_id: str | None = None
        
    async def execute_command(self, command: str) -> Dict[str, Any]:
        """Execute agent-browser CLI command"""
        try:
            # Run agent-browser command
            result = subprocess.run(
                f"agent-browser {command}",
                shell=True,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr if result.returncode != 0 else None
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Command timeout"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def navigate(self, url: str) -> Dict[str, Any]:
        """Navigate to URL"""
        return await self.execute_command(f"open {url}")
    
    async def snapshot(self, interactive: bool = True) -> Dict[str, Any]:
        """Get page snapshot with element refs"""
        flag = "-i" if interactive else ""
        result = await self.execute_command(f"snapshot {flag}")
        
        if result["success"]:
            # Parse snapshot output
            snapshot = self._parse_snapshot(result["output"])
            return {
                "success": True,
                "snapshot": snapshot
            }
        return result
    
    async def click(self, ref: str) -> Dict[str, Any]:
        """Click element by ref"""
        return await self.execute_command(f"click {ref}")
    
    async def fill(self, ref: str, text: str) -> Dict[str, Any]:
        """Fill input field"""
        # Escape text for shell
        escaped_text = text.replace('"', '\\"')
        return await self.execute_command(f'fill {ref} "{escaped_text}"')
    
    async def get_text(self, ref: str) -> Dict[str, Any]:
        """Get text content of element"""
        result = await self.execute_command(f"get text {ref}")
        if result["success"]:
            return {
                "success": True,
                "text": result["output"].strip()
            }
        return result
    
    async def find_and_click(self, selector_type: str, value: str) -> Dict[str, Any]:
        """Find element and click using semantic locator"""
        # Examples:
        # find_and_click("role", "button --name Submit")
        # find_and_click("text", "Sign In")
        # find_and_click("label", "Email")
        return await self.execute_command(f"find {selector_type} {value} click")
    
    async def screenshot(self, path: str = "screenshot.png") -> Dict[str, Any]:
        """Take screenshot"""
        return await self.execute_command(f"screenshot {path}")
    
    def _parse_snapshot(self, output: str) -> List[Dict[str, Any]]:
        """Parse snapshot output into structured data"""
        elements = []
        lines = output.strip().split("\n")
        
        for line in lines:
            # Parse lines like: @e1 [button] "Submit"
            # or: - button "Submit" [ref=e1]
            if "[ref=" in line or "@e" in line:
                element = self._parse_element_line(line)
                if element:
                    elements.append(element)
        
        return elements
    
    def _parse_element_line(self, line: str) -> Dict[str, Any] | None:
        """Parse single element line"""
        # Simple parser - can be enhanced
        import re
        
        # Match @e1 [button] "Submit"
        match = re.match(r'@(e\d+)\s+\[(\w+)\]\s+"([^"]+)"', line)
        if match:
            return {
                "ref": f"@{match.group(1)}",
                "role": match.group(2),
                "text": match.group(3)
            }
        
        # Match - button "Submit" [ref=e1]
        match = re.match(r'-\s+(\w+)\s+"([^"]+)"\s+\[ref=(\w+)\]', line)
        if match:
            return {
                "ref": f"@{match.group(3)}",
                "role": match.group(1),
                "text": match.group(2)
            }
        
        return None
```

### 2. Voice to Command Translator

**File:** `backend/app/services/agent_browser/voice_to_command.py`

```python
from typing import Dict, Any
from app.services.llm_service import get_auto_mode_llm

class VoiceToCommandTranslator:
    """Translate voice commands to agent-browser CLI commands"""
    
    def __init__(self):
        self.llm = get_auto_mode_llm()
    
    async def translate(self, voice_text: str, current_snapshot: str = "") -> Dict[str, Any]:
        """Translate voice command to agent-browser command"""
        
        prompt = f"""
You are a voice command translator for a browser automation system.
Convert the user's voice command into agent-browser CLI commands.

Current page snapshot:
{current_snapshot}

User voice command: "{voice_text}"

Available agent-browser commands:
- open <url> - Navigate to URL
- snapshot -i - Get interactive elements with refs
- click @e1 - Click element by ref
- fill @e2 "text" - Fill input field
- get text @e3 - Get element text
- find role button click --name "Submit" - Find and click by role
- find text "Sign In" click - Find and click by text
- find label "Email" fill "text" - Find and fill by label
- back - Go back
- reload - Refresh page

Return JSON with:
{{
  "command": "agent-browser command",
  "action": "description of action",
  "needs_snapshot": true/false,
  "read_result": true/false
}}

Examples:
Voice: "Go to dashboard"
Output: {{"command": "open /dashboard", "action": "Navigate to dashboard", "needs_snapshot": false, "read_result": false}}

Voice: "Click the submit button"
Output: {{"command": "find role button click --name Submit", "action": "Click submit button", "needs_snapshot": false, "read_result": false}}

Voice: "Read the page title"
Output: {{"command": "get text @e1", "action": "Get title text", "needs_snapshot": true, "read_result": true}}

Voice: "Search for quantum computing"
Output: {{"command": "fill @e2 \\"quantum computing\\"", "action": "Fill search field", "needs_snapshot": true, "read_result": false}}
"""
        
        response = await self.llm.ainvoke(prompt)
        
        try:
            import json
            result = json.loads(response.content)
            return result
        except:
            return {
                "command": None,
                "action": "Could not parse command",
                "needs_snapshot": False,
                "read_result": False,
                "error": "Failed to parse LLM response"
            }
```

### 3. API Routes

**File:** `backend/app/routes/agent_browser_routes.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.agent_browser.agent_browser_service import AgentBrowserService
from app.services.agent_browser.voice_to_command import VoiceToCommandTranslator

router = APIRouter(prefix="/api/v1/agent-browser", tags=["agent-browser"])

# Global service instance (in production, use session management)
browser_service = AgentBrowserService()
voice_translator = VoiceToCommandTranslator()

class VoiceCommandRequest(BaseModel):
    voice_text: str
    current_url: str | None = None

class CommandRequest(BaseModel):
    command: str

@router.post("/voice-command")
async def execute_voice_command(request: VoiceCommandRequest):
    """Execute voice command via agent-browser"""
    
    # Get current snapshot if needed
    snapshot_text = ""
    if request.current_url:
        snapshot_result = await browser_service.snapshot(interactive=True)
        if snapshot_result["success"]:
            snapshot_text = snapshot_result["snapshot"]
    
    # Translate voice to command
    translation = await voice_translator.translate(
        request.voice_text,
        snapshot_text
    )
    
    if not translation.get("command"):
        raise HTTPException(status_code=400, detail="Could not understand command")
    
    # Execute command
    result = await browser_service.execute_command(translation["command"])
    
    # If needs to read result, get text
    response_text = None
    if translation.get("read_result") and result["success"]:
        response_text = result["output"]
    
    return {
        "success": result["success"],
        "action": translation["action"],
        "response_text": response_text,
        "error": result.get("error")
    }

@router.post("/command")
async def execute_command(request: CommandRequest):
    """Execute raw agent-browser command"""
    result = await browser_service.execute_command(request.command)
    return result

@router.get("/snapshot")
async def get_snapshot():
    """Get current page snapshot"""
    result = await browser_service.snapshot(interactive=True)
    return result

@router.post("/navigate")
async def navigate(url: str):
    """Navigate to URL"""
    result = await browser_service.navigate(url)
    return result
```

### 4. Frontend Hook

**File:** `frontend/hooks/use-agent-browser.ts`

```typescript
"use client";

import { useCallback, useState } from "react";
import { useTextToSpeech } from "./use-text-to-speech";

interface AgentBrowserResult {
  success: boolean;
  action: string;
  response_text?: string;
  error?: string;
}

export function useAgentBrowser() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");
  const tts = useTextToSpeech();

  const executeVoiceCommand = useCallback(async (voiceText: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/v1/agent-browser/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice_text: voiceText,
          current_url: window.location.href,
        }),
      });

      const result: AgentBrowserResult = await response.json();
      
      setLastAction(result.action);
      
      if (result.success) {
        // Speak the action
        tts.speak(result.action);
        
        // If there's response text, speak it
        if (result.response_text) {
          setTimeout(() => {
            tts.speak(result.response_text!);
          }, 1000);
        }
      } else {
        tts.speak(`Error: ${result.error || "Command failed"}`);
      }
      
      return result;
    } catch (error) {
      tts.speak("Failed to execute command");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [tts]);

  const getSnapshot = useCallback(async () => {
    const response = await fetch("/api/v1/agent-browser/snapshot");
    return await response.json();
  }, []);

  return {
    executeVoiceCommand,
    getSnapshot,
    isProcessing,
    lastAction,
  };
}
```

---

## 🎯 Use Cases with Agent-Browser

### Use Case 1: Voice-Controlled Navigation

**Voice Command:** "Go to my documents"

**Flow:**
```bash
1. Voice → "Go to my documents"
2. LLM translates → agent-browser open /dashboard/documents
3. Agent-browser executes → Navigates to page
4. TTS speaks → "Navigating to documents"
```

### Use Case 2: Search and Read

**Voice Command:** "Search for quantum computing and read the first result"

**Flow:**
```bash
1. Voice → "Search for quantum computing and read the first result"
2. agent-browser snapshot -i
   Output: @e1 [textbox] "Search", @e2 [button] "Search", @e3 [link] "Quantum Computing Basics"
3. agent-browser fill @e1 "quantum computing"
4. agent-browser click @e2
5. agent-browser wait --load networkidle
6. agent-browser click @e3
7. agent-browser get text main
8. TTS reads → Content of the document
```

### Use Case 3: Form Filling

**Voice Command:** "Create a new chat about AI"

**Flow:**
```bash
1. Voice → "Create a new chat about AI"
2. agent-browser open /dashboard/new-chat
3. agent-browser snapshot -i
   Output: @e1 [textbox] "Message", @e2 [button] "Send"
4. agent-browser fill @e1 "Tell me about AI"
5. agent-browser click @e2
6. TTS speaks → "Chat created and message sent"
```

---

## 📊 Benefits of Agent-Browser

### 1. Accessibility-First

✅ **Built-in Accessibility Tree** - Uses ARIA roles and labels  
✅ **Semantic Locators** - Find by role, label, text (not CSS)  
✅ **Screen Reader Compatible** - Same structure screen readers use  

### 2. AI-Native

✅ **Compact Output** - Text format, not JSON (saves tokens)  
✅ **Deterministic Refs** - @e1, @e2 are stable and predictable  
✅ **Natural Language** - Easy for LLMs to understand  

### 3. Robust

✅ **Semantic Selection** - Doesn't break when CSS changes  
✅ **Fast** - Rust implementation for speed  
✅ **Complete** - 50+ commands for all scenarios  

### 4. Developer-Friendly

✅ **Simple CLI** - Easy to integrate  
✅ **JSON Output** - Optional for programmatic use  
✅ **Cross-Platform** - Works everywhere  

---

## 💰 Cost Analysis

### Infrastructure Costs

| Component | Cost/Month | Notes |
|-----------|------------|-------|
| **Agent-Browser** | $0 | Open source, free |
| **LLM (Command Translation)** | $10-50 | Small prompts, low usage |
| **Storage** | $5-10 | Command logs |
| **Compute** | $20-50 | Backend processing |
| **Total** | **$35-110/month** | Very affordable |

### Development Costs

| Phase | Time | Effort |
|-------|------|--------|
| **Setup & Integration** | 1 week | Install, configure, test |
| **Voice Translation** | 1 week | LLM prompt engineering |
| **API Routes** | 3 days | Backend endpoints |
| **Frontend Integration** | 3 days | React hooks, UI |
| **Testing** | 1 week | QA, user testing |
| **Total** | **3-4 weeks** | Manageable |

---

## 🚀 Implementation Roadmap

### Week 1: Setup & Basic Commands
- [ ] Install agent-browser
- [ ] Create AgentBrowserService
- [ ] Implement basic commands (navigate, snapshot, click)
- [ ] Test CLI integration

### Week 2: Voice Translation
- [ ] Create VoiceToCommandTranslator
- [ ] LLM prompt engineering
- [ ] Test voice → command translation
- [ ] Handle edge cases

### Week 3: API & Frontend
- [ ] Create API routes
- [ ] Build React hooks
- [ ] Integrate with existing voice system
- [ ] UI components

### Week 4: Testing & Launch
- [ ] End-to-end testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Launch

---

## 🎓 Best Practices

### 1. Always Snapshot First

```bash
# ❌ Bad: Click without knowing refs
agent-browser click @e1  # What is @e1?

# ✅ Good: Snapshot first
agent-browser snapshot -i
# Output: @e1 [button] "Submit"
agent-browser click @e1  # Now we know!
```

### 2. Use Semantic Locators

```bash
# ❌ Bad: CSS selectors (brittle)
agent-browser click ".btn-primary"

# ✅ Good: Semantic locators (robust)
agent-browser find role button click --name "Submit"
```

### 3. Wait for Page Load

```bash
# ❌ Bad: Click immediately
agent-browser click @e1
agent-browser snapshot -i  # Page not loaded yet!

# ✅ Good: Wait for load
agent-browser click @e1
agent-browser wait --load networkidle
agent-browser snapshot -i  # Now page is ready
```

### 4. Handle Errors Gracefully

```python
result = await browser_service.click("@e1")
if not result["success"]:
    # Retry with semantic locator
    result = await browser_service.find_and_click("role", "button")
```

---

## 🎉 Summary

### What is Agent-Browser?

A **headless browser automation CLI** designed specifically for AI agents, created by Vercel Labs.

### Why Use It for SurfSense?

✅ **Accessibility-First** - Built on accessibility tree  
✅ **AI-Native** - Designed for LLM integration  
✅ **Voice-Friendly** - Natural language commands  
✅ **Robust** - Semantic locators don't break  
✅ **Fast** - Rust implementation  
✅ **Free** - Open source  

### Integration with SurfSense

1. **Voice Input** → Web Speech API (STT)
2. **Command Translation** → LLM converts to agent-browser CLI
3. **Execution** → Agent-browser controls SurfSense interface
4. **Result Reading** → Web Speech API (TTS) reads results

### Timeline

**3-4 weeks** to full integration:
- Week 1: Setup & basic commands
- Week 2: Voice translation
- Week 3: API & frontend
- Week 4: Testing & launch

### Cost

**$35-110/month** - Very affordable for the capabilities

### Impact

**Life-changing** for visually impaired users - complete voice control of SurfSense interface with robust, accessibility-first automation.

---

**Status:** 📋 Analysis Complete  
**Recommendation:** ✅ Use agent-browser for SurfSense voice interface  
**Next Step:** Begin Week 1 implementation  
**Last Updated:** 2026-04-10
