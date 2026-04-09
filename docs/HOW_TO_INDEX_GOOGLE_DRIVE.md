# How to Index Google Drive Files - Step by Step

## The Issue

You connected Google Drive successfully and can see your files, but they're not being indexed. This is because **you need to explicitly select which folders/files to index**.

## The Solution (3 Steps)

### Step 1: Go to Your Connector

1. Open `http://localhost:3000`
2. Navigate to **Connectors** page
3. Find your **Google Drive (Composio)** connector
4. Click on it to open

### Step 2: Select Files/Folders to Index

You should see your Google Drive folder structure. Now you need to **check the boxes** next to items you want to index:

**Option A: Select Individual Files**
- ☑️ Check boxes next to specific files
- Example: ☑️ `Project Proposal.pdf`
- Example: ☑️ `Meeting Notes.docx`

**Option B: Select Entire Folders**
- ☑️ Check boxes next to folders
- All files inside will be indexed
- Example: ☑️ `Work Documents` folder
- Example: ☑️ `Study Notes` folder

**Option C: Mix Both**
- ☑️ Check some folders
- ☑️ Check some individual files
- Whatever you check will be indexed

### Step 3: Start Indexing

After selecting files/folders:

1. Look for a button like:
   - **"Index Selected"**
   - **"Start Indexing"**
   - **"Sync Now"**
   - **"Index"**

2. Click it

3. You should see:
   - Progress indicator
   - Status message: "Composio Google Drive indexing started in the background"

4. Wait for indexing to complete
   - Small folder (10 files): 1-2 minutes
   - Medium folder (100 files): 5-10 minutes
   - Large folder (1000 files): 30-60 minutes

## How to Verify It's Working

### Check 1: Backend Logs

In your backend terminal, you should see:

```
Triggering Composio Google Drive indexing for connector X
Task started: index_google_drive_files
Processing file: filename.pdf
Extracted 1234 words
Created 15 chunks
Indexed successfully
```

### Check 2: Celery Logs

In your Celery worker terminal, you should see:

```
[2026-04-09 21:30:00] Task index_google_drive_files[xxx] received
[2026-04-09 21:30:05] Downloading file from Google Drive
[2026-04-09 21:30:10] Extracting text
[2026-04-09 21:30:15] Generating embeddings
[2026-04-09 21:30:20] Task index_google_drive_files[xxx] succeeded
```

### Check 3: UI Status

In the connector page, you should see:
- ✅ Green checkmarks next to indexed files
- Progress bar showing completion
- Status: "Indexed" or "Completed"

### Check 4: Test Search

Go to chat and ask:
```
"What files do I have indexed?"
"Search my documents for [topic]"
```

The LLM should be able to find and use your files.

## Common Issues

### Issue 1: "No files selected" error

**Problem:** You clicked "Index" without selecting any files/folders.

**Solution:** Go back and check the boxes next to files/folders you want to index.

### Issue 2: Nothing happens when I click "Index"

**Problem:** 
- Backend not running
- Celery worker not running
- Network error

**Solution:**
1. Check backend terminal (should be running)
2. Check Celery terminal (should be running)
3. Check browser console for errors (F12)
4. Check backend logs for error messages

### Issue 3: Indexing stuck at 0%

**Problem:** Celery worker not processing tasks.

**Solution:**
```bash
# Check if Celery is running
ps aux | grep celery

# If not running, start it
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info --pool=solo
```

### Issue 4: "Failed to download file" errors

**Problem:** OAuth token expired or file permissions changed.

**Solution:**
1. Reconnect Google Drive connector
2. Try indexing again

## Tips for Better Results

### Start Small

For your first test:
1. Select just 1-2 files
2. Click "Index"
3. Wait for completion
4. Verify they're searchable
5. Then index more files

### Organize Your Selection

- **Work files**: Select work-related folders
- **Study materials**: Select course folders
- **Personal docs**: Select personal folders

### Use Folders When Possible

Instead of selecting 100 individual files:
- ☑️ Check the parent folder
- All files inside will be indexed automatically

### Monitor Progress

Keep these terminals open while indexing:
- **Terminal 1**: Backend logs
- **Terminal 2**: Celery worker logs

Watch for any errors.

## What Gets Indexed?

When you select a folder, SurfSense will index:
- ✅ All files directly in that folder
- ✅ All files in subfolders (if "include subfolders" is enabled)
- ✅ Supported file types (PDF, DOCX, TXT, etc.)
- ❌ Skips unsupported file types (images, videos, etc.)

## Indexing Options

You may see options like:

**Max files per folder**: Limit how many files to index from each folder
- Default: 100
- Increase if you have large folders

**Incremental sync**: Only index new/changed files
- Default: Enabled
- Keeps index up to date

**Include subfolders**: Index files in nested folders
- Default: Enabled
- Disable to only index top-level files

## After Indexing

Once indexing completes:

1. ✅ Files are searchable
2. ✅ LLM can use them to answer questions
3. ✅ You can ask questions about your documents
4. ✅ Auto-sync keeps them updated (if enabled)

## Example Workflow

```
1. Connect Google Drive ✅
   └─> Status: Connected

2. Browse folders ✅
   └─> Can see: My Drive > Work > Projects

3. Select files to index ⬅️ YOU ARE HERE
   └─> Check: ☑️ Projects folder
   └─> Check: ☑️ Important.pdf

4. Click "Index Selected"
   └─> Status: Indexing...

5. Wait for completion
   └─> Status: Indexed ✅

6. Ask questions
   └─> "What's in my project files?"
   └─> LLM: "Your project files contain..."
```

## Quick Checklist

Before indexing, verify:
- [ ] Backend is running
- [ ] Celery worker is running
- [ ] Redis is running (Docker)
- [ ] PostgreSQL is running
- [ ] Google Drive is connected
- [ ] You can see your files in the UI
- [ ] You have selected files/folders (checked boxes)
- [ ] You clicked "Index" or "Start Indexing"

If all checked, indexing should work!

## Still Not Working?

See detailed debugging guide: `docs/DEBUG_INDEXING.md`

---

**Last Updated:** 2026-04-09  
**Key Point:** You MUST select files/folders before indexing!
