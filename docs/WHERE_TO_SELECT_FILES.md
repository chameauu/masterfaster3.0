# Where to Select Google Drive Files for Indexing

## The UI Exists! Here's How to Access It

The file selection UI is built into SurfSense. You just need to know where to click.

## Step-by-Step Instructions

### Step 1: Open Connectors Dialog

**Option A: From Chat**
1. Go to `http://localhost:3000`
2. Navigate to a chat (any search space)
3. Look for the **Unplug icon** (🔌) in the top toolbar
4. Click it

**Option B: From Sidebar**
1. Go to `http://localhost:3000`
2. Look in the left sidebar
3. Find **"Connectors"** or **"Data Sources"** section
4. Click **"Manage Connectors"** or similar button

### Step 2: Find Your Google Drive Connector

In the Connectors dialog:
1. Look for the **"Active"** or **"Connected"** tab
2. Find your **"Google Drive (Composio)"** connector
3. It should show as "Connected" with a green indicator

### Step 3: Open Connector Configuration

1. Click on your **Google Drive (Composio)** connector
2. OR click the **"Edit"** or **"Configure"** button next to it
3. OR click the **three dots menu** (⋮) and select "Configure"

### Step 4: Select Files/Folders

You should now see:

```
┌─────────────────────────────────────────────────────┐
│  Folder & File Selection                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Select specific folders and/or individual files   │
│  to index from your Google Drive.                  │
│                                                     │
│  📁 My Drive                                        │
│    ☐ 📁 Work Documents                             │
│    ☐ 📁 Personal                                    │
│    ☐ 📁 Projects                                    │
│    ☐ 📄 Important.pdf                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Now:**
1. **Check the boxes** (☑️) next to folders/files you want to index
2. You can expand folders by clicking the arrow (▶️)
3. You can select individual files or entire folders
4. Selected items will show in a summary box above

### Step 5: Configure Indexing Options (Optional)

Below the file selection, you'll see:

```
┌─────────────────────────────────────────────────────┐
│  Indexing Options                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Max files per folder:  [100 files ▼]              │
│  Include subfolders:    [ON]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Adjust if needed:
- **Max files per folder**: How many files to index from each folder
- **Include subfolders**: Whether to index nested folders

### Step 6: Save and Start Indexing

1. Look for a **"Save"** or **"Save & Index"** button at the bottom
2. Click it
3. You should see a message: "Composio Google Drive indexing started in the background"

### Step 7: Monitor Progress

**In the UI:**
- Progress indicator should appear
- Status will change from "Indexing..." to "Indexed"
- Check marks (✅) will appear next to indexed files

**In Backend Terminal:**
```
Triggering Composio Google Drive indexing for connector X
Task started: index_google_drive_files
Processing file: filename.pdf
Indexed successfully
```

**In Celery Terminal:**
```
Task index_google_drive_files[xxx] received
Downloading file from Google Drive
Extracting text
Task succeeded
```

## Visual Guide

```
Homepage/Chat
     │
     ├─> Click Unplug Icon (🔌) in toolbar
     │
     ▼
Connectors Dialog
     │
     ├─> Click "Active" tab
     │
     ├─> Find "Google Drive (Composio)"
     │
     ├─> Click on it OR click "Edit"
     │
     ▼
Connector Configuration
     │
     ├─> See "Folder & File Selection" section
     │
     ├─> See folder tree with checkboxes
     │
     ├─> Check boxes next to items ☑️
     │
     ├─> Adjust "Indexing Options" if needed
     │
     ├─> Click "Save & Index" button
     │
     ▼
Indexing Started!
```

## Troubleshooting

### "I don't see the Unplug icon"

**Solution:** Look for:
- "Connectors" in sidebar
- "Data Sources" menu
- "Manage Integrations" button
- Three-line menu (☰) → Connectors

### "I don't see my Google Drive connector"

**Possible causes:**
1. Not connected yet → Connect first
2. Wrong tab → Click "Active" or "Connected" tab
3. Search filter active → Clear search box

**Solution:** Make sure you completed the connection step first.

### "I see the connector but can't click it"

**Solution:** Try:
- Click directly on the connector name
- Click the "Edit" button (pencil icon)
- Click the three dots menu (⋮) → Configure
- Right-click → Configure

### "I don't see any folders/files"

**Possible causes:**
1. OAuth token expired
2. Network error
3. Empty Drive
4. Permission issues

**Solution:**
1. Check if it says "Authentication expired" → Reconnect
2. Check backend logs for errors
3. Verify you have files in Google Drive
4. Check file permissions in Drive

### "I see folders but no checkboxes"

**This shouldn't happen!** The UI component has checkboxes built-in.

**If you really don't see checkboxes:**
1. Try refreshing the page (F5)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try a different browser
4. Check browser console for errors (F12)
5. Check if JavaScript is enabled

### "I selected files but nothing happens when I click Save"

**Check:**
1. Backend is running
2. Celery worker is running
3. Browser console for errors (F12)
4. Backend logs for error messages

## What the UI Looks Like

The `DriveFolderTree` component shows:

**Folders:**
- 📁 Folder icon
- ☐ Checkbox (unchecked)
- ☑️ Checkbox (checked)
- ▶️ Arrow to expand
- ▼ Arrow when expanded

**Files:**
- 📄 File icon (varies by type)
- ☐ Checkbox (unchecked)
- ☑️ Checkbox (checked)
- File name

**Selected Items Summary:**
```
Selected 3 items: (2 folders, 1 file)
  📁 Work Documents [X]
  📁 Projects [X]
  📄 Important.pdf [X]
```

## After Selecting Files

Once you've selected files and clicked "Save & Index":

1. ✅ Configuration is saved to database
2. ✅ Celery task is created
3. ✅ Worker starts processing
4. ✅ Files are downloaded from Drive
5. ✅ Text is extracted
6. ✅ Embeddings are generated
7. ✅ Data is stored in database
8. ✅ UI shows "Indexed" status

## Next Steps

After indexing completes:
1. Go to chat
2. Ask questions about your files
3. LLM will search and use them

Example:
```
You: "What's in my work documents?"
LLM: "Your work documents contain..."
```

---

**Last Updated:** 2026-04-09  
**Key Point:** The UI exists! You just need to open the connector configuration.
