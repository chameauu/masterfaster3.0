# SurfSense Tools - Complete Summary

**Date:** 2026-04-10  
**Purpose:** Document all available tools in SurfSense for summarizing and Q&A generation

---

## 🎯 Answer to Your Question

**Q: Are there tools in SurfSense for summarizing and making Q&A?**

**A: YES!** SurfSense has the following relevant tools:

### 1. **`generate_report`** - ✅ Summarization & Q&A
- **Purpose:** Generate structured Markdown reports with summaries
- **Features:**
  - Automatic summarization of documents
  - Q&A format support
  - Multiple report styles (brief, detailed, deep_research)
  - Internal KB search capability
  - Export to PDF, DOCX, HTML, LaTeX, EPUB, ODT, plain text

### 2. **`generate_podcast`** - ✅ Audio Summarization
- **Purpose:** Generate audio podcasts from content
- **Features:**
  - Converts text summaries to audio
  - Natural conversation format
  - Good for accessibility

### 3. **Document Summarization** (Backend)
- **Function:** `generate_document_summary()`
- **Location:** `backend/app/utils/document_converters.py`
- **Purpose:** Automatic document summarization during indexing
- **Features:**
  - Uses LLM to generate summaries
  - Creates embeddings for semantic search
  - Includes metadata in summaries

---

## 📋 Complete Tools List

SurfSense has **40+ tools** organized into categories:

### Content Generation Tools

1. **`generate_report`** ⭐
   - Generate structured Markdown reports
   - Supports summarization and Q&A
   - Multiple export formats
   - Internal KB search

2. **`generate_podcast`** ⭐
   - Generate audio podcasts from content
   - Audio summarization
   - Accessibility feature

3. **`generate_video_presentation`**
   - Generate video presentations with slides
   - Narration included

4. **`generate_image`**
   - Generate images from text descriptions
   - Uses AI models (DALL-E, etc.)

### Knowledge Base Tools

5. **`search_surfsense_docs`**
   - Search SurfSense documentation
   - Help with using the application

6. **`web_search`**
   - Real-time web search
   - Uses SearXNG + configured engines

7. **`scrape_webpage`**
   - Extract content from webpages
   - Uses Firecrawl API

### Memory Tools

8. **`save_memory`**
   - Store facts/preferences about users
   - Personal or team memory

9. **`recall_memory`**
   - Retrieve relevant memories
   - Context for personalized responses

10. **`save_shared_memory`**
    - Team-wide memory storage

11. **`recall_shared_memory`**
    - Team-wide memory retrieval

### Gmail Tools

12. **`create_gmail_draft`**
13. **`send_gmail_email`**
14. **`trash_gmail_email`**
15. **`update_gmail_draft`**

### Google Calendar Tools

16. **`create_calendar_event`**
17. **`update_calendar_event`**
18. **`delete_calendar_event`**

### Google Drive Tools

19. **`create_google_drive_file`**
20. **`delete_google_drive_file`**

### OneDrive Tools

21. **`create_onedrive_file`**
22. **`delete_onedrive_file`**

### Dropbox Tools

23. **`create_dropbox_file`**
24. **`delete_dropbox_file`**

### Notion Tools

25. **`create_notion_page`**
26. **`update_notion_page`**
27. **`delete_notion_page`**

### Linear Tools

28. **`create_linear_issue`**
29. **`update_linear_issue`**
30. **`delete_linear_issue`**

### Jira Tools

31. **`create_jira_issue`**
32. **`update_jira_issue`**
33. **`delete_jira_issue`**

### Confluence Tools

34. **`create_confluence_page`**
35. **`update_confluence_page`**
36. **`delete_confluence_page`**

### MCP Tools (Dynamic)

37. **Custom MCP tools** loaded from database
    - User-defined API tools
    - Model Context Protocol integration

---

## 🎤 Voice Intent Support

The voice system recognizes these intents:

1. **`SEARCH`** - Search documents
2. **`SUMMARIZE`** ⭐ - Summarize content
3. **`QUIZ`** ⭐ - Generate quiz/Q&A
4. **`FOLLOW_UP`** - Follow-up questions
5. **`HELP`** - Get help

### Voice Commands for Summarization & Q&A

**Summarize:**
- "Summarize this document"
- "Give me a summary of..."
- "What's the main point of..."

**Quiz/Q&A:**
- "Quiz me on cellular respiration"
- "Test me on this topic"
- "Ask me questions about..."

---

## 📊 How to Use for Summarization & Q&A

### Option 1: Generate Report (Recommended)

```typescript
// User says: "Summarize this document and create Q&A"
// Agent calls:
generate_report({
  topic: "Document Summary with Q&A",
  source_strategy: "conversation",
  source_content: "[document content]",
  report_style: "detailed",
  user_instructions: "Include Q&A section at the end"
})
```

**Output:**
- Structured Markdown report
- Executive summary
- Key points
- Q&A section
- Export to PDF/DOCX/etc.

### Option 2: Voice Command

```
User: "Quiz me on this document"
→ Voice system recognizes QUIZ intent
→ Agent generates questions
→ TTS reads questions aloud
→ User answers via voice
→ Agent evaluates answers
```

### Option 3: Direct Summarization

```typescript
// Backend function (during document indexing)
const [summary, embedding] = await generate_document_summary(
  content,
  user_llm
);
```

---

## 🔧 Implementation Details

### Report Generation Tool

**File:** `backend/app/agents/new_chat/tools/report.py`

**Features:**
- Source strategies:
  - `conversation` - Use chat history
  - `kb_search` - Search knowledge base
  - `auto` - Automatic selection
- Report styles:
  - `brief` - Short summary
  - `detailed` - Comprehensive
  - `deep_research` - In-depth analysis
- Export formats:
  - Markdown (default)
  - PDF
  - DOCX
  - HTML
  - LaTeX
  - EPUB
  - ODT
  - Plain text

### Document Summarization

**File:** `backend/app/utils/document_converters.py`

**Function:** `generate_document_summary()`

**Process:**
1. Optimize content for token limits
2. Add metadata context
3. Generate summary using LLM
4. Create embedding for semantic search
5. Store in database

**Prompt Template:**
- Executive summary format
- Key points extraction
- Fact verification
- Logical flow
- Comprehensive coverage

---

## 🎯 Best Practices

### For Summarization

1. **Use `generate_report` for:**
   - Structured summaries
   - Multi-section documents
   - Export requirements
   - Professional reports

2. **Use `generate_podcast` for:**
   - Audio summaries
   - Accessibility needs
   - Conversational format

3. **Use document summarization for:**
   - Automatic indexing
   - Background processing
   - Semantic search

### For Q&A Generation

1. **Use `generate_report` with instructions:**
   ```
   user_instructions: "Include Q&A section with 10 questions"
   ```

2. **Use voice QUIZ intent:**
   - Interactive Q&A
   - Real-time feedback
   - Accessibility

3. **Use agent conversation:**
   - Ask agent to generate questions
   - Agent uses context to create relevant Q&A

---

## 📚 Related Documentation

### System Prompts

**File:** `backend/app/prompts/__init__.py`
- `SUMMARY_PROMPT` - Template for summarization
- Detailed instructions for quality summaries

**File:** `backend/app/agents/new_chat/system_prompt.py`
- Tool instructions for `generate_report`
- Tool instructions for `generate_podcast`
- Examples and best practices

### Voice Intent Recognition

**File:** `backend/app/services/voice/intent.py`
- Intent types: SEARCH, SUMMARIZE, QUIZ
- Keyword detection
- LLM-based intent classification

---

## 🚀 Example Use Cases

### Use Case 1: Document Summary Report

**User:** "Summarize this research paper and create a Q&A section"

**Agent:**
1. Calls `generate_report` with:
   - `source_strategy="conversation"`
   - `source_content="[paper content]"`
   - `user_instructions="Include Q&A section"`
2. Returns structured Markdown report
3. User can export to PDF

### Use Case 2: Voice Quiz

**User:** "Quiz me on quantum computing"

**Agent:**
1. Recognizes QUIZ intent
2. Searches knowledge base for quantum computing
3. Generates 5-10 questions
4. Reads questions via TTS
5. Listens for answers via STT
6. Provides feedback

### Use Case 3: Audio Summary

**User:** "Create a podcast summary of this conversation"

**Agent:**
1. Calls `generate_podcast` with:
   - `source_content="[conversation summary]"`
   - `podcast_title="Conversation Summary"`
2. Generates audio podcast
3. User can listen and download

---

## ✅ Summary

**YES, SurfSense has comprehensive tools for summarization and Q&A:**

1. **`generate_report`** - Primary tool for structured summaries and Q&A
2. **`generate_podcast`** - Audio summarization
3. **Document summarization** - Automatic background processing
4. **Voice intents** - SUMMARIZE and QUIZ for voice interaction
5. **40+ tools total** - Extensive toolkit for various tasks

The system is well-designed for:
- Document summarization
- Q&A generation
- Interactive quizzes
- Audio summaries
- Multi-format export
- Voice-first interaction

---

**Last Updated:** 2026-04-10  
**Status:** ✅ Complete and Production-Ready
