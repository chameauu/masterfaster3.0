#!/usr/bin/env python
"""Manually trigger Google Drive indexing for testing."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.db import SearchSourceConnector, get_async_session
from app.tasks.celery_tasks.connector_tasks import index_google_drive_files_task


async def trigger_indexing():
    """Manually trigger indexing for the Composio Google Drive connector."""
    
    print("\n" + "="*60)
    print("MANUAL INDEXING TRIGGER")
    print("="*60 + "\n")
    
    async for session in get_async_session():
        # Find the Composio Google Drive connector
        result = await session.execute(
            select(SearchSourceConnector).where(
                SearchSourceConnector.connector_type == 'COMPOSIO_GOOGLE_DRIVE_CONNECTOR'
            )
        )
        connector = result.scalars().first()
        
        if not connector:
            print("❌ No Composio Google Drive connector found!")
            return
        
        print(f"Found connector:")
        print(f"  ID: {connector.id}")
        print(f"  Name: {connector.name}")
        print(f"  Search Space ID: {connector.search_space_id}")
        
        # Get config
        config = connector.config or {}
        selected_folders = config.get('selected_folders', [])
        selected_files = config.get('selected_files', [])
        indexing_options = config.get('indexing_options', {
            'max_files_per_folder': 100,
            'incremental_sync': True,
            'include_subfolders': True,
        })
        
        print(f"\nConfiguration:")
        print(f"  Selected folders: {len(selected_folders)}")
        for folder in selected_folders:
            print(f"    - {folder.get('name', 'Unknown')} (ID: {folder.get('id')})")
        
        print(f"  Selected files: {len(selected_files)}")
        for file in selected_files:
            print(f"    - {file.get('name', 'Unknown')} (ID: {file.get('id')})")
        
        if not selected_folders and not selected_files:
            print("\n❌ No files or folders selected!")
            print("   Please select files/folders in the UI first.")
            return
        
        # Build items_dict
        items_dict = {
            'folders': selected_folders,
            'files': selected_files,
            'indexing_options': indexing_options,
        }
        
        print(f"\nTriggering indexing task...")
        print(f"  Connector ID: {connector.id}")
        print(f"  Search Space ID: {connector.search_space_id}")
        print(f"  User ID: {connector.user_id}")
        print(f"  Items: {items_dict}")
        
        # Trigger the Celery task
        task = index_google_drive_files_task.delay(
            connector.id,
            connector.search_space_id,
            str(connector.user_id),
            items_dict
        )
        
        print(f"\n✅ Task created!")
        print(f"   Task ID: {task.id}")
        print(f"   Task name: index_google_drive_files")
        print(f"\nCheck Celery worker terminal for progress.")
        print(f"Run 'uv run python check_indexing_status.py' to check results.")


if __name__ == "__main__":
    asyncio.run(trigger_indexing())
