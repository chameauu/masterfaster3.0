# Next Steps: Agent-Browser Integration

**Quick reference for continuing the implementation**

---

## ✅ What's Done

1. **Backend Tool Implementation** (2 hours)
   - ✅ Created `agent_browser.py` tool
   - ✅ Registered in `registry.py`
   - ✅ Added system prompt instructions
   - ✅ Added tool examples for LLM

2. **Documentation** (1 hour)
   - ✅ `AGENT_BROWSER_LLM_INTEGRATION.md` - How LLM uses the tool
   - ✅ `AGENT_BROWSER_FULL_IMPLEMENTATION_PLAN.md` - Complete roadmap
   - ✅ `NEXT_STEPS.md` - This file

---

## ⏳ What's Next (Priority Order)

### 1. Install agent-browser CLI (10 minutes) - HIGH PRIORITY

```bash
# Check Node.js
node --version  # Need 18+

# Install agent-browser
npm install -g @vercel-labs/agent-browser

# Verify
agent-browser --version

# Test
agent-browser open https://example.com
```

**Verify from Python:**
```bash
cd backend
uv run python -c "
from app.agents.new_chat.tools.agent_browser import AgentBrowserService
service = AgentBrowserService()
print('Available:', service.is_available())
"
```

**Expected:** `Available: True`

---

### 2. Enable Tool in Agent (30 minutes) - HIGH PRIORITY

**Option A: Enable Globally**

Edit `backend/app/agents/new_chat/tools/registry.py`:

```python
ToolDefinition(
    name="agent_browser",
    description="...",
    factory=lambda deps: create_agent_browser_tool(),
    requires=[],
    enabled_by_default=True,  # ← Change to True
),
```

**Option B: Enable Per-Chat**

When creating agent, pass `enabled_tools`:

```python
agent = await create_surfsense_deep_agent(
    llm=llm,
    search_space_id=search_space_id,
    db_session=db_session,
    connector_service=connector_service,
    checkpointer=checkpointer,
    enabled_tools=["agent_browser"],  # ← Enable explicitly
)
```

---

### 3. Test Basic Commands (30 minutes) - HIGH PRIORITY

```bash
# Start backend
cd backend
uv run python -m app.app

# Start frontend
cd frontend
pnpm dev

# Open browser: http://localhost:3000
# Enable voice input (microphone icon)
# Say: "Go to dashboard"
# Expected: Should navigate to /dashboard
```

**Test Commands:**
- "Go to dashboard"
- "Navigate to documents"
- "Read this page"
- "Go back"

---

### 4. Frontend Voice Command Detection (2-3 hours) - MEDIUM PRIORITY

Create `frontend/hooks/use-voice-command-detector.ts`:

```typescript
"use client";

import { useCallback, useRef } from "react";

const VOICE_COMMAND_PATTERNS = [
  /go to|navigate to|open/i,
  /click|press|select/i,
  /read|what's on|show me/i,
];

export function useVoiceCommandDetector() {
  const isVoiceCommand = useCallback((text: string): boolean => {
    return VOICE_COMMAND_PATTERNS.some(pattern => pattern.test(text));
  }, []);

  return { isVoiceCommand };
}
```

Integrate in chat component:

```typescript
const { isVoiceCommand } = useVoiceCommandDetector();

const handleTranscript = useCallback((text: string) => {
  if (isVoiceCommand(text)) {
    console.log("Voice command detected:", text);
    // Add metadata to message
  }
  sendMessage(text);
}, [isVoiceCommand, sendMessage]);
```

---

### 5. Add Voice Command Indicator (1 hour) - LOW PRIORITY

Create `frontend/components/voice/voice-command-indicator.tsx`:

```typescript
"use client";

import { memo } from "react";
import { Mic, Navigation } from "lucide-react";

export const VoiceCommandIndicator = memo(function VoiceCommandIndicator({
  isProcessing,
}: {
  isProcessing: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md">
      <Mic className="size-4 animate-pulse" />
      <Navigation className="size-4" />
      <span className="text-sm">
        {isProcessing ? "Processing command..." : "Voice command detected"}
      </span>
    </div>
  );
});
```

---

### 6. Testing (2-3 hours) - HIGH PRIORITY

**Unit Tests:**

```bash
cd backend
uv run pytest tests/test_agent_browser.py -v
```

**Integration Tests:**

```bash
uv run pytest tests/test_agent_browser_integration.py -v
```

**Manual Testing Checklist:**

- [ ] Navigation commands work
- [ ] Reading commands work
- [ ] Interaction commands work
- [ ] Error handling works
- [ ] TTS feedback works
- [ ] Multiple commands in sequence work

---

### 7. Performance Optimization (2-3 hours) - OPTIONAL

**Add Command Caching:**

```python
from functools import lru_cache

class AgentBrowserService:
    @lru_cache(maxsize=100)
    def _translate_cached(self, nl_command: str) -> str:
        return self._translate_rule_based(nl_command)
```

**Add Parallel Execution:**

```python
async def execute_multiple_commands(commands: list[str]) -> list[dict]:
    tasks = [service.execute_command(cmd) for cmd in commands]
    return await asyncio.gather(*tasks)
```

---

### 8. Production Deployment (1-2 hours) - MEDIUM PRIORITY

**Update Dockerfile:**

```dockerfile
# Install Node.js and agent-browser
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g @vercel-labs/agent-browser
```

**Add Health Check:**

```python
@router.get("/health/agent-browser")
async def agent_browser_health():
    from app.agents.new_chat.tools.agent_browser import AgentBrowserService
    service = AgentBrowserService()
    return {
        "status": "ok" if service.is_available() else "unavailable",
        "agent_browser_installed": service.is_available(),
    }
```

---

## 📊 Progress Tracker

| Phase | Time | Priority | Status |
|-------|------|----------|--------|
| Backend Foundation | 2 hours | HIGH | ✅ DONE |
| Install CLI | 10 min | HIGH | ⏳ TODO |
| Enable Tool | 30 min | HIGH | ⏳ TODO |
| Test Basic Commands | 30 min | HIGH | ⏳ TODO |
| Frontend Detection | 2-3 hours | MEDIUM | ⏳ TODO |
| Voice Indicator | 1 hour | LOW | ⏳ TODO |
| Testing | 2-3 hours | HIGH | ⏳ TODO |
| Optimization | 2-3 hours | OPTIONAL | ⏳ TODO |
| Deployment | 1-2 hours | MEDIUM | ⏳ TODO |
| **Total** | **10-14 hours** | | **20% Complete** |

---

## 🎯 Immediate Action Items

**Today:**
1. Install agent-browser CLI
2. Verify installation from Python
3. Enable tool in agent (choose Option A or B)
4. Test one basic command

**This Week:**
1. Test all basic commands
2. Add frontend voice command detection
3. Write unit tests
4. Document any issues

**Next Week:**
1. Integration testing
2. Performance optimization
3. Production deployment prep
4. User testing

---

## 📚 Reference Documents

- **Implementation Details:** `AGENT_BROWSER_LLM_INTEGRATION.md`
- **Full Roadmap:** `AGENT_BROWSER_FULL_IMPLEMENTATION_PLAN.md`
- **Voice Interface Plan:** `SURFSENSE_VOICE_INTERFACE_PLAN.md`
- **Vercel agent-browser:** `VERCEL_AGENT_BROWSER_INTEGRATION.md`

---

## 🐛 Troubleshooting

### Issue: "agent-browser not found"

```bash
# Install Node.js first
node --version  # Check if installed

# Install agent-browser
npm install -g @vercel-labs/agent-browser

# Verify
which agent-browser
```

### Issue: "Tool not available to LLM"

Check:
1. Is tool registered in `registry.py`?
2. Is `enabled_by_default=True` or passed in `enabled_tools`?
3. Are system prompt instructions included?

### Issue: "Commands not working"

Check:
1. Is agent-browser CLI working? Test: `agent-browser open https://example.com`
2. Check backend logs for errors
3. Verify command translation in `translate_natural_language()`

---

## 💡 Tips

1. **Start Simple:** Test with basic commands first ("go to dashboard")
2. **Check Logs:** Backend logs show command translation and execution
3. **Use Browser DevTools:** Check network tab for API calls
4. **Test Incrementally:** One command type at a time (navigation, then reading, then interaction)
5. **Document Issues:** Keep notes on what works and what doesn't

---

**Last Updated:** 2026-04-10  
**Status:** Ready to continue implementation  
**Next Action:** Install agent-browser CLI
