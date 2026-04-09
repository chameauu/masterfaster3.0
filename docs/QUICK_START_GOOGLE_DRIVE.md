# Quick Start: Using Google Drive Files with LLM

## 3-Step Process

### Step 1: Connect (1 minute)

1. Go to `http://localhost:3000`
2. Click **Connectors** in sidebar
3. Find **Google Drive (Composio)**
4. Click **Connect**
5. Grant permissions

✅ **Done!** Your Google Drive is connected.

### Step 2: Index Files (2-5 minutes)

1. Click on your **Google Drive connector**
2. Browse your folders
3. **Check the boxes** next to files/folders you want to index
4. Click **"Index Selected"** or **"Start Indexing"**
5. Wait for indexing to complete

**What to index first:**
- 📚 Study notes
- 📄 Important documents
- 📊 Project files
- 📝 Research papers

✅ **Done!** Your files are now searchable.

### Step 3: Ask Questions (instant)

Go to the chat and ask questions about your files:

**Example 1: Search**
```
You: "What are the main topics in my biology notes?"

LLM: "Based on your biology notes, the main topics are:
      1. Cellular respiration
      2. Photosynthesis  
      3. DNA replication
      
      Source: Biology Notes.pdf"
```

**Example 2: Summarize**
```
You: "Summarize my project proposal"

LLM: "Your project proposal outlines a 6-month initiative
      with a budget of $80,000. Key objectives include..."
```

**Example 3: Extract Info**
```
You: "What's the deadline mentioned in my meeting notes?"

LLM: "According to your meeting notes from March 15th,
      the deadline is April 30th, 2026."
```

✅ **Done!** The LLM is now using your Google Drive files!

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│  BEFORE: LLM has no access to your files                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  You: "What's in my biology notes?"                     │
│  LLM: "I don't have access to your files."             │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓
                    [INDEX FILES]
                         ↓

┌─────────────────────────────────────────────────────────┐
│  AFTER: LLM can search and use your files               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  You: "What's in my biology notes?"                     │
│  LLM: "Your biology notes cover:                        │
│        - Cellular respiration (pages 1-5)               │
│        - Photosynthesis (pages 6-10)                    │
│        - DNA replication (pages 11-15)                  │
│                                                         │
│        Would you like me to explain any of these?"      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## How It Works Behind the Scenes

```
Your Question
     ↓
[Convert to Vector]
     ↓
[Search Indexed Files]
     ↓
[Find Relevant Chunks]
     ↓
[Send to LLM as Context]
     ↓
LLM Response with Sources
```

## What Gets Indexed?

When you index a file, SurfSense:

1. **Downloads** the file from Google Drive
2. **Extracts** all text content
3. **Splits** into smaller chunks (paragraphs)
4. **Creates** vector embeddings for each chunk
5. **Stores** in database for fast searching

**Example:**

```
Original File: "Biology Notes.pdf" (50 pages)
     ↓
Extracted Text: 10,000 words
     ↓
Split into: 100 chunks (100 words each)
     ↓
Stored as: 100 searchable vectors
```

When you ask a question, SurfSense finds the most relevant chunks and sends them to the LLM.

## Common Questions

### Q: Do I need to index all my files?

**A:** No! Only index files you want to search/ask questions about.

Start with:
- ✅ Frequently used documents
- ✅ Important reference materials
- ✅ Study notes
- ❌ Skip: Old files, archives, images

### Q: How long does indexing take?

**A:** Depends on file size and count:
- Small folder (10 files): 1-2 minutes
- Medium folder (100 files): 5-10 minutes
- Large folder (1000 files): 30-60 minutes

### Q: Can I index folders?

**A:** Yes! When you check a folder, all files inside get indexed.

### Q: What file types are supported?

**A:** Most common formats:
- Documents: PDF, Word, Google Docs
- Spreadsheets: Excel, Google Sheets
- Presentations: PowerPoint, Google Slides
- Text: TXT, Markdown
- Code: Python, JavaScript, etc.

### Q: Will the LLM read my entire file?

**A:** No. The LLM only sees relevant chunks (paragraphs) that match your question.

**Example:**
- Your file: 50 pages
- Your question: "What's the budget?"
- LLM sees: Only the 2-3 paragraphs mentioning budget

### Q: Can I update files after indexing?

**A:** Yes! Options:
1. **Manual**: Re-index the file
2. **Auto-sync**: Enable in connector settings (checks for updates automatically)

### Q: How do I know what's indexed?

**A:** Check the connector page:
- ✅ Green checkmark = Indexed
- ⏳ Clock icon = Indexing in progress
- ❌ Red X = Failed to index

## Tips for Better Results

### 1. Be Specific

**Good:** "What's the budget for Project X in my proposal?"  
**Bad:** "Tell me about money"

### 2. Mention File Names

**Good:** "Summarize my 'Q4 Report.pdf'"  
**Bad:** "Summarize that report"

### 3. Use Search Spaces

Create separate spaces for different topics:
- Work Space: Work documents
- Study Space: Course materials
- Personal Space: Personal notes

### 4. Check Sources

Always verify important information in the original file.

### 5. Re-index When Files Change

If you update a file in Google Drive, re-index it in SurfSense.

## Troubleshooting

### "I don't have access to that information"

**Problem:** File not indexed or wrong search space.

**Solution:**
1. Check if file is indexed (green checkmark)
2. Verify you're in the correct search space
3. Try re-indexing the file

### "Indexing failed"

**Problem:** File format not supported or file corrupted.

**Solution:**
1. Check file type (is it supported?)
2. Try opening file in Google Drive (is it corrupted?)
3. Check backend logs for error details

### LLM gives wrong information

**Problem:** Outdated index or poor search results.

**Solution:**
1. Re-index the file
2. Be more specific in your question
3. Check if file content actually contains the answer

## Next Steps

1. ✅ Connect Google Drive
2. ✅ Index your first folder
3. ✅ Ask a question
4. 🎯 Try these:
   - Add more connectors (Gmail, Calendar)
   - Create multiple search spaces
   - Enable auto-sync
   - Try voice commands (if using voice assistant)

## Full Documentation

- **Detailed Guide:** `HOW_TO_USE_GOOGLE_DRIVE_WITH_LLM.md`
- **Connection Setup:** `COMPOSIO_QUICK_START.md`
- **Troubleshooting:** `TROUBLESHOOTING_COMPOSIO.md`

---

**Last Updated:** 2026-04-09  
**Estimated Time:** 5 minutes to get started
