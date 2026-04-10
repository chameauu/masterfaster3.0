# How to Tell the Agent to Use Tools

**Date:** 2026-04-10  
**Purpose:** Guide on how to make the SurfSense agent use specific tools

---

## 🎯 Quick Answer

**The agent automatically decides which tools to use based on your message.**

You don't need to explicitly say "use the generate_report tool" - just use natural language that matches the tool's trigger phrases.

---

## 🗣️ How It Works

### 1. The Agent Reads Your Message
The agent analyzes your message for:
- **Action verbs** (create, generate, make, write, etc.)
- **Trigger phrases** (specific keywords for each tool)
- **Context** (what you're asking for)

### 2. The Agent Matches to Tools
Based on the system prompt, the agent knows:
- What each tool does
- When to use it
- What arguments it needs

### 3. The Agent Calls the Tool
If your message matches a tool's criteria, the agent automatically calls it.

---

## 📋 Tool Trigger Phrases

### `generate_report` - Summarization & Reports

**Trigger Verbs:**
- **Creation:** write, create, generate, draft, produce, summarize into, turn into, make
- **Modification:** revise, update, expand, add (a section), rewrite, make (shorter/longer/formal)

**Example Messages:**
```
✅ "Generate a report about AI trends"
✅ "Write a document on quantum computing"
✅ "Summarize this conversation into a report"
✅ "Create a report with Q&A section"
✅ "Make a brief report about the meeting"
✅ "Add a section about budget to the report"
✅ "Rewrite the report in formal tone"
```

**What NOT to say (these won't trigger the tool):**
```
❌ "What can we add to the report?" (question, not action)
❌ "Is the data accurate?" (discussion, not creation)
❌ "What else could be covered?" (brainstorming, not action)
```

---

### `generate_podcast` - Audio Summaries

**Trigger Phrases:**
- "give me a podcast about"
- "create a podcast"
- "generate a podcast"
- "make a podcast"
- "turn this into a podcast"

**Example Messages:**
```
✅ "Create a podcast about this conversation"
✅ "Give me a podcast summary of AI trends"
✅ "Make a podcast from this document"
✅ "Turn this discussion into a podcast"
```

---

### `generate_video_presentation` - Video Slides

**Trigger Phrases:**
- "give me a presentation"
- "create slides"
- "generate a video"
- "make a slide deck"
- "turn this into a presentation"

**Example Messages:**
```
✅ "Create a presentation about quantum computing"
✅ "Make slides from this research"
✅ "Generate a video presentation"
✅ "Turn this into a slide deck"
```

---

### `generate_image` - AI Image Generation

**Trigger Phrases:**
- "generate an image of"
- "create a picture of"
- "draw me"
- "make an image"
- "design a logo"
- "create artwork"

**Example Messages:**
```
✅ "Generate an image of a sunset over mountains"
✅ "Create a logo for my startup"
✅ "Draw me a futuristic city"
✅ "Make an image of a cat wearing a hat"
```

---

### `scrape_webpage` - Extract Web Content

**Trigger Phrases:**
- "read this webpage"
- "scrape this URL"
- "get content from"
- "extract from this page"

**Example Messages:**
```
✅ "Read this webpage: https://example.com"
✅ "Scrape the content from this URL"
✅ "Get the main content from this page"
```

---

### `web_search` - Real-time Web Search

**Trigger Phrases:**
- "search the web for"
- "look up online"
- "find information about"
- "what's the latest on"

**Example Messages:**
```
✅ "Search the web for latest AI news"
✅ "Look up current weather in Tokyo"
✅ "Find information about quantum computing"
```

---

### `save_memory` / `recall_memory` - User Memory

**Trigger Phrases:**
- "remember that"
- "save this fact"
- "recall what I told you about"
- "what do you know about me"

**Example Messages:**
```
✅ "Remember that I prefer Python over JavaScript"
✅ "Save this: my favorite color is blue"
✅ "Recall what I told you about my project"
✅ "What do you remember about my preferences?"
```

---

## 🎤 Voice Commands

For voice interaction, use the same trigger phrases:

### Summarize Intent
```
🎤 "Summarize this document"
🎤 "Give me a summary of the meeting"
🎤 "Create a report about AI trends"
```

### Quiz Intent
```
🎤 "Quiz me on quantum computing"
🎤 "Test me on this topic"
🎤 "Ask me questions about biology"
```

### Search Intent
```
🎤 "Search for documents about machine learning"
🎤 "Find information on climate change"
```

---

## 💡 Pro Tips

### 1. Be Specific with Action Verbs

**Good:**
```
✅ "Generate a detailed report about AI trends with Q&A section"
```

**Less Effective:**
```
❌ "Tell me about AI trends" (no action verb)
```

### 2. Include Context

**Good:**
```
✅ "Create a podcast from this conversation about quantum computing"
```

**Less Effective:**
```
❌ "Make a podcast" (no context)
```

### 3. Specify Format/Style

**Good:**
```
✅ "Write a brief report (one page) about the meeting"
✅ "Generate a detailed research report with citations"
```

### 4. For Modifications, Reference the Original

**Good:**
```
✅ "Add a section about budget to the report"
✅ "Rewrite the report in formal tone"
✅ "Expand the conclusion section"
```

---

## 🔧 Advanced: Tool Arguments

The agent automatically fills in tool arguments based on your message:

### Example: `generate_report`

**Your Message:**
```
"Generate a detailed report about AI trends with Q&A section"
```

**Agent Calls:**
```python
generate_report(
    topic="AI Trends Report",
    source_strategy="kb_search",
    search_queries=["AI trends", "artificial intelligence developments"],
    report_style="detailed",
    user_instructions="Include Q&A section"
)
```

### Example: `generate_podcast`

**Your Message:**
```
"Create a casual podcast about this conversation"
```

**Agent Calls:**
```python
generate_podcast(
    source_content="[comprehensive conversation summary]",
    podcast_title="Conversation Summary",
    user_prompt="Make it casual and fun"
)
```

---

## 🎯 Common Scenarios

### Scenario 1: Summarize a Document

**What to Say:**
```
"Summarize this document into a report"
"Create a summary of the research paper"
"Generate a brief report about this content"
```

**What Happens:**
1. Agent recognizes "summarize", "create", "generate" verbs
2. Calls `generate_report` tool
3. Returns structured Markdown report
4. You can export to PDF/DOCX/etc.

---

### Scenario 2: Create Q&A from Content

**What to Say:**
```
"Generate a report with Q&A section about quantum computing"
"Create a document with questions and answers"
"Make a quiz from this content"
```

**What Happens:**
1. Agent recognizes creation verb + "Q&A" or "quiz"
2. Calls `generate_report` with instructions
3. Report includes Q&A section
4. Or agent generates questions directly in chat

---

### Scenario 3: Audio Summary

**What to Say:**
```
"Create a podcast summary of this conversation"
"Turn this into an audio podcast"
"Give me a podcast about AI trends"
```

**What Happens:**
1. Agent recognizes podcast trigger phrases
2. Calls `generate_podcast` tool
3. Background task generates audio
4. Podcast player appears when ready (3-5 min)

---

### Scenario 4: Interactive Quiz (Voice)

**What to Say (via voice):**
```
🎤 "Quiz me on quantum computing"
🎤 "Test me on this topic"
```

**What Happens:**
1. Voice system recognizes QUIZ intent
2. Agent searches knowledge base
3. Generates questions
4. TTS reads questions aloud
5. You answer via voice
6. Agent provides feedback

---

## 🚫 Common Mistakes

### Mistake 1: No Action Verb

**Wrong:**
```
❌ "AI trends" (no verb)
❌ "About quantum computing" (no verb)
```

**Right:**
```
✅ "Generate a report about AI trends"
✅ "Summarize quantum computing"
```

### Mistake 2: Asking Instead of Commanding

**Wrong:**
```
❌ "Can you make a report?" (question)
❌ "Would you create a summary?" (question)
```

**Right:**
```
✅ "Make a report about AI trends"
✅ "Create a summary of this document"
```

### Mistake 3: Too Vague

**Wrong:**
```
❌ "Do something with this" (unclear)
❌ "Help me" (no specific action)
```

**Right:**
```
✅ "Summarize this document into a report"
✅ "Create a podcast from this content"
```

---

## 📊 Tool Selection Logic

The agent follows this decision tree:

```
User Message
    ↓
Contains action verb? (create, generate, make, etc.)
    ↓ YES
Contains tool trigger phrase?
    ↓ YES
Match to specific tool:
    - "report" → generate_report
    - "podcast" → generate_podcast
    - "presentation" → generate_video_presentation
    - "image" → generate_image
    - "webpage" → scrape_webpage
    ↓
Call tool with appropriate arguments
    ↓
Return result to user
```

---

## 🎓 Learning Examples

### Example 1: From Vague to Specific

**Vague:**
```
User: "AI stuff"
Agent: "I'd be happy to help with AI-related topics. What would you like to know?"
```

**Specific:**
```
User: "Generate a report about AI trends"
Agent: [Calls generate_report tool]
Agent: "I've generated your report on AI Trends. You can view it now."
```

### Example 2: Question vs Command

**Question (no tool):**
```
User: "What can we add to the report?"
Agent: "Here are some suggestions: [lists ideas in chat]"
```

**Command (uses tool):**
```
User: "Add a section about budget to the report"
Agent: [Calls generate_report with parent_report_id]
Agent: "I've updated the report with a budget section."
```

---

## 🔍 Debugging: Why Didn't the Tool Run?

If the agent doesn't use a tool when you expected:

### Check 1: Did you use an action verb?
- ✅ "Generate", "Create", "Make", "Write"
- ❌ "Tell me", "What about", "Can you"

### Check 2: Did you include trigger phrases?
- ✅ "report", "podcast", "presentation", "image"
- ❌ Generic terms without context

### Check 3: Is the tool enabled?
- Check the tools panel in the UI
- Some tools are disabled by default
- Connector tools require connector setup

### Check 4: Is your message clear?
- ✅ "Create a report about AI trends"
- ❌ "AI" (too vague)

---

## 🎉 Summary

**To make the agent use tools:**

1. **Use action verbs** - create, generate, make, write, etc.
2. **Include trigger phrases** - report, podcast, presentation, etc.
3. **Be specific** - include context and details
4. **Command, don't ask** - "Create a report" not "Can you create a report?"
5. **Trust the agent** - it knows when to use tools

**The agent is smart!** You don't need to say "use the generate_report tool" - just say what you want in natural language, and the agent will figure out which tool to use.

---

**Last Updated:** 2026-04-10  
**Status:** ✅ Complete Guide
