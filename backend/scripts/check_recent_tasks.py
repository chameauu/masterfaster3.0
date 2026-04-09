#!/usr/bin/env python
"""Check recent Celery tasks."""

import json
import redis

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

print("\n" + "="*60)
print("RECENT CELERY TASKS")
print("="*60 + "\n")

# Get all task meta keys
keys = r.keys("celery-task-meta-*")
print(f"Found {len(keys)} task(s) in Redis\n")

# Sort by timestamp (get the most recent)
tasks = []
for key in keys:
    data = r.get(key)
    if data:
        try:
            task_data = json.loads(data)
            tasks.append((key, task_data))
        except:
            pass

# Sort by date_done
tasks.sort(key=lambda x: x[1].get('date_done', ''), reverse=True)

# Show last 10 tasks
print("Last 10 tasks:\n")
for i, (key, task_data) in enumerate(tasks[:10], 1):
    task_id = key.replace('celery-task-meta-', '')
    name = task_data.get('name', 'Unknown')
    status = task_data.get('status', 'Unknown')
    date_done = task_data.get('date_done', 'N/A')
    
    print(f"{i}. Task: {name}")
    print(f"   ID: {task_id}")
    print(f"   Status: {status}")
    print(f"   Completed: {date_done}")
    
    # Show kwargs for context
    kwargs = task_data.get('kwargs', {})
    if kwargs:
        print(f"   Args: {json.dumps(kwargs, indent=6)}")
    
    # Show error if failed
    if status == 'FAILURE':
        traceback = task_data.get('traceback', 'No traceback')
        result = task_data.get('result', 'No error message')
        print(f"   Error: {result}")
        print(f"   Traceback: {traceback[:200]}...")
    
    print()

# Check for Google Drive tasks specifically
print("\n" + "="*60)
print("GOOGLE DRIVE TASKS")
print("="*60 + "\n")

drive_tasks = [t for t in tasks if 'google' in t[1].get('name', '').lower() or 'drive' in t[1].get('name', '').lower()]

if drive_tasks:
    print(f"Found {len(drive_tasks)} Google Drive task(s):\n")
    for key, task_data in drive_tasks:
        name = task_data.get('name', 'Unknown')
        status = task_data.get('status', 'Unknown')
        date_done = task_data.get('date_done', 'N/A')
        kwargs = task_data.get('kwargs', {})
        
        print(f"Task: {name}")
        print(f"Status: {status}")
        print(f"Completed: {date_done}")
        print(f"Args: {json.dumps(kwargs, indent=2)}")
        
        if status == 'FAILURE':
            result = task_data.get('result', {})
            print(f"Error: {result}")
        
        print()
else:
    print("❌ No Google Drive indexing tasks found!")
    print("\nThis means:")
    print("1. The indexing task was never created, OR")
    print("2. The task completed and was cleaned up from Redis, OR")
    print("3. The task is using a different queue")
    print("\nCheck:")
    print("- Backend logs for 'Triggering Composio Google Drive indexing'")
    print("- Celery worker terminal for task execution")
    print("- Make sure you clicked 'Save & Index' button")

print("\n" + "="*60)
