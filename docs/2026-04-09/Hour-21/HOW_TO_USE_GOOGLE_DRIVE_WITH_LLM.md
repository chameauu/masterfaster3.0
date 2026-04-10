# How to Make LLM Use Google Drive Files

## Overview

SurfSense uses a RAG (Retrieval-Augmented Generation) approach to let the LLM access your Google Drive files:

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CONNECT                                                 │
│     └─> Link your Google Drive account                     │
│                                                             │
│  2. INDEX                                                   │
│     └─> Select files/folders to index                      │
│     └─> SurfSense downloads and processes files            │
│     └─> Creates vector embeddings                          │
│     └─> Stores in database                                 │
│                                                             │
│  3. SEARCH                                                  │
│     └─> You ask a question                                 │
│     └─> SurfSense searches indexed content                 │
│     └─> Finds relevant chunks                              │
│                                                             │
│  4. LLM RESPONSE                                            │
│     └─> Relevant content sent to LLM as context            │
│     └─> LLM generates answer using your files              │
│     └─> You get answer with sources                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Guide

### Step 1: Connect Google Drive

1. Go to `http://localhost:3000`
2. Navigate to **Connectors** page (usually in sidebar)
3. Find **Google Drive (Composio)** connector
4. Click **"Connect"**
5. Grant permissions when Google asks
6. You'll be redirected back

✅ **Status:** Connected

### Step 2: Select Files/Folders to Index

After connecting, you need to tell SurfSense which files to index:

1. Click on your **Google Drive connector** (the one you just connected)
2. You'll see your Google Drive folder structure
3. **Select files or folders** you want to index:
   - ✅ Check individual files
   - ✅ Check entire folders (will index all files inside)
   - ✅ You can select multiple items

**What to index:**
- 📄 Documents (Google Docs, Word, PDF)
- 📊 Spreadsheets (Google Sheets, Excel)
- 📝 Presentations (Google Slides, PowerPoint)
- 📋 Text files
- 📚 Research papers
- 📖 Notes and study materials

**Tips:**
- Start with a small folder (10-20 files) to test
- You can always add more later
- Indexing large folders takes time

### Step 3: Start Indexing

1. After selecting files/folders, click **"Index Selected"** or **"Start Indexing"**
2. SurfSense will:
   - Download the files
   - Extract text content
   - Split into chunks
   - Create vector embeddings
   - Store in database

**Progress:**
- You'll see a progress indicator
- Check backend logs for detailed progress
- Indexing time depends on:
  - Number of files
  - File sizes
  - File types (PDFs take longer)

**Example backend logs:**
```
Processing file: Biology Notes.pdf
Extracted 1234 words
Created 15 chunks
Indexed successfully
```

✅ **Status:** Files are now indexed and searchable

### Step 4: Ask Questions

Now the LLM can use your Google Drive files!

**In the chat interface:**

```
You: "What are the main topics in my biology notes?"

LLM: "Based on your biology notes, the main topics are:
      1. Cellular respiration
      2. Photosynthesis
      3. DNA replication
      4. Protein synthesis
      
      Source: Biology Notes.pdf (Google Drive)"
```

**How it works:**
1. Your question is converted to a vector embedding
2. SurfSense searches for similar content in indexed files
3. Top relevant chunks are retrieved
4. These chunks are sent to the LLM as context
5. LLM generates answer using this context
6. You get answer with source citations

### Step 5: Advanced Usage

#### Search Specific Files

```
You: "Search my 'Project Proposal.docx' for budget information"

LLM: "According to your Project Proposal.docx, the budget is:
      - Personnel: $50,000
      - Equipment: $20,000
      - Travel: $10,000
      Total: $80,000"
```

#### Summarize Documents

```
You: "Summarize my research paper on climate change"

LLM: "Your research paper discusses three main points:
      1. Rising global temperatures...
      2. Impact on ecosystems...
      3. Mitigation strategies..."
```

#### Compare Documents

```
You: "Compare the proposals in my two project documents"

LLM: "Comparing your two proposals:
      
      Proposal A focuses on...
      Proposal B emphasizes...
      
      Key differences:
      - Budget: A is $80k, B is $120k
      - Timeline: A is 6 months, B is 12 months"
```

#### Extract Information

```
You: "What are all the action items mentioned in my meeting notes?"

LLM: "Action items from your meeting notes:
      1. John to prepare presentation by Friday
      2. Sarah to review budget proposal
      3. Team to schedule follow-up meeting"
```

## Understanding the Search Space

### What is a Search Space?

A "Search Space" is like a collection or workspace where you organize your indexed content.

**Example:**
- **Work Search Space**: Work documents, emails, Slack messages
- **Personal Search Space**: Personal notes, research, books
- **Study Search Space**: Course materials, textbooks, lecture notes

### How to Use Search Spaces

1. Create a new search space (if needed)
2. Add connectors to that search space
3. Index files from those connectors
4. When chatting, select which search space to use
5. LLM will only search within that space

**Benefits:**
- Keep work and personal content separate
- Faster searches (smaller index)
- Better relevance (focused content)

## Configuration Options

### Indexing Settings

You can configure how files are indexed:

**In connector settings:**
- **Auto-sync**: Automatically re-index when files change
- **Sync frequency**: How often to check for updates (hourly, daily, weekly)
- **File types**: Which file types to index
- **Max file size**: Skip files larger than X MB

### Search Settings

**In search space settings:**
- **LLM model**: Which model to use (GPT-4, Claude, etc.)
- **Chunk size**: How to split documents
- **Retrieval count**: How many chunks to send to LLM
- **Reranking**: Use reranker for better results

## Troubleshooting

### LLM Says "I don't have access to that information"

**Possible causes:**
1. Files not indexed yet
2. Wrong search space selected
3. Search query doesn't match content
4. Files failed to index

**Solutions:**
1. Check if indexing completed (look for progress indicator)
2. Verify you're in the correct search space
3. Try rephrasing your question
4. Check backend logs for indexing errors

### LLM Gives Wrong Information

**Possible causes:**
1. Outdated index (files changed but not re-indexed)
2. Poor chunk splitting
3. Irrelevant chunks retrieved

**Solutions:**
1. Re-index the files (delete and re-add)
2. Adjust chunk size in settings
3. Be more specific in your questions

### Indexing Failed

**Possible causes:**
1. File format not supported
2. File too large
3. File corrupted
4. Network error

**Solutions:**
1. Check supported file types
2. Reduce file size or split into smaller files
3. Try re-downloading the file
4. Check internet connection

### Slow Responses

**Possible causes:**
1. Large index (too many files)
2. Complex query
3. Slow LLM model

**Solutions:**
1. Use search spaces to limit scope
2. Simplify your question
3. Use a faster model (e.g., GPT-3.5 instead of GPT-4)

## Best Practices

### 1. Organize Your Files

- Use folders to group related content
- Name files descriptively
- Keep files up to date

### 2. Index Strategically

- Start small (test with a few files)
- Index frequently used documents first
- Use search spaces to separate topics

### 3. Ask Better Questions

**Good questions:**
- "What are the key findings in my research paper?"
- "Summarize the meeting notes from last week"
- "Find all mentions of 'budget' in my project documents"

**Poor questions:**
- "Tell me about stuff" (too vague)
- "What's in my files?" (too broad)
- "Find that thing" (not specific)

### 4. Maintain Your Index

- Re-index when files change
- Remove old/irrelevant files
- Check indexing status regularly

### 5. Use Source Citations

- Always check the sources LLM provides
- Verify important information in original files
- Report incorrect citations

## Example Workflows

### Research Workflow

1. **Index research papers** from Google Drive
2. **Ask:** "What are the common themes across my research papers?"
3. **LLM analyzes** all papers and identifies themes
4. **Ask follow-up:** "Tell me more about theme X"
5. **LLM provides** detailed information with sources

### Study Workflow

1. **Index course materials** (textbooks, lecture notes)
2. **Ask:** "Explain cellular respiration"
3. **LLM uses** your course materials to explain
4. **Ask:** "Quiz me on this topic"
5. **LLM generates** quiz questions from your materials

### Work Workflow

1. **Index work documents** (proposals, reports, emails)
2. **Ask:** "What's the status of Project X?"
3. **LLM searches** all related documents
4. **Provides summary** with latest updates
5. **Ask:** "What are the next steps?"
6. **LLM extracts** action items from documents

## Technical Details

### How Indexing Works

1. **Download**: File downloaded from Google Drive
2. **Extract**: Text extracted (using Docling, Unstructured, etc.)
3. **Chunk**: Text split into smaller chunks (e.g., 512 tokens)
4. **Embed**: Each chunk converted to vector embedding
5. **Store**: Embeddings stored in PostgreSQL with pgvector

### How Search Works

1. **Query**: Your question converted to vector embedding
2. **Search**: Vector similarity search in database
3. **Retrieve**: Top K most similar chunks retrieved
4. **Rerank**: (Optional) Reranker improves relevance
5. **Context**: Chunks sent to LLM as context
6. **Generate**: LLM generates answer using context

### Supported File Types

- **Documents**: PDF, DOCX, DOC, TXT, RTF, ODT
- **Spreadsheets**: XLSX, XLS, CSV, ODS
- **Presentations**: PPTX, PPT, ODP
- **Google Workspace**: Google Docs, Sheets, Slides
- **Code**: PY, JS, TS, JAVA, CPP, etc.
- **Markdown**: MD, MDX
- **Web**: HTML, XML

### Embedding Models

SurfSense uses embedding models to convert text to vectors:

**Default**: `sentence-transformers/all-MiniLM-L6-v2`
- Fast and efficient
- Good for most use cases
- 384 dimensions

**Alternatives** (configure in backend/.env):
- OpenAI embeddings (better quality, costs money)
- Azure OpenAI embeddings
- Custom models

## Next Steps

1. ✅ Connect Google Drive
2. ✅ Index your first folder
3. ✅ Ask a question
4. ✅ Explore advanced features
5. ✅ Add more connectors (Gmail, Calendar, etc.)

## Related Documentation

- `COMPOSIO_QUICK_START.md` - Connect Google Drive
- `TROUBLESHOOTING_COMPOSIO.md` - Fix connection issues
- `VOICE_ASSISTANT_ARCHITECTURE.md` - Voice interface
- `README.md` - Project overview

---

**Last Updated:** 2026-04-09  
**For Voice Assistant Users:** All these features work with voice commands too!
