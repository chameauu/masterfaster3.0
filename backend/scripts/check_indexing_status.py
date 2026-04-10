#!/usr/bin/env python
"""Check Google Drive indexing status."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select

from app.db import Chunk, Document, SearchSourceConnector, get_async_session


async def check_status():
    """Check indexing status."""

    print("\n" + "=" * 60)
    print("GOOGLE DRIVE INDEXING STATUS")
    print("=" * 60 + "\n")

    async for session in get_async_session():
        # Check connectors
        result = await session.execute(
            select(SearchSourceConnector).where(
                SearchSourceConnector.connector_type.in_(
                    ["GOOGLE_DRIVE_CONNECTOR", "COMPOSIO_GOOGLE_DRIVE_CONNECTOR"]
                )
            )
        )
        connectors = result.scalars().all()

        print(f"Found {len(connectors)} Google Drive connector(s):\n")

        for conn in connectors:
            print(f"Connector ID: {conn.id}")
            print(f"  Name: {conn.name}")
            print(f"  Type: {conn.connector_type}")
            print(f"  Created: {conn.created_at}")

            # Check config
            config = conn.config or {}
            selected_folders = config.get("selected_folders", [])
            selected_files = config.get("selected_files", [])

            print(f"  Selected folders: {len(selected_folders)}")
            for folder in selected_folders:
                print(f"    - {folder.get('name', 'Unknown')}")

            print(f"  Selected files: {len(selected_files)}")
            for file in selected_files:
                print(f"    - {file.get('name', 'Unknown')}")

            # Check documents from this connector
            doc_result = await session.execute(
                select(Document).where(Document.connector_id == conn.id)
            )
            documents = doc_result.scalars().all()

            print(f"  Indexed documents: {len(documents)}")
            for doc in documents:
                print(f"    - {doc.title} (ID: {doc.id})")

                # Check chunks
                chunk_result = await session.execute(
                    select(Chunk).where(Chunk.document_id == doc.id)
                )
                chunks = chunk_result.scalars().all()
                print(f"      Chunks: {len(chunks)}")

            print()

        # Check all documents
        all_docs_result = await session.execute(
            select(Document).order_by(Document.created_at.desc()).limit(10)
        )
        all_docs = all_docs_result.scalars().all()

        print("\nRecent documents (last 10):")
        for doc in all_docs:
            connector_info = (
                f"Connector {doc.connector_id}"
                if doc.connector_id
                else "No connector (uploaded)"
            )
            print(f"  - {doc.title} ({connector_info}) - {doc.created_at}")

        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Total Google Drive connectors: {len(connectors)}")
        total_indexed = sum(
            len([d for d in all_docs if d.connector_id == conn.id])
            for conn in connectors
        )
        print(f"Total indexed from Drive: {total_indexed}")

        if total_indexed == 0:
            print("\n⚠️  No documents indexed yet!")
            print("\nPossible reasons:")
            print("1. Indexing task is still running (check Celery logs)")
            print("2. Indexing task failed (check Celery logs for errors)")
            print("3. No files were selected")
            print("4. Files failed to download/process")
            print("\nNext steps:")
            print("- Check Celery worker terminal for task logs")
            print("- Check backend terminal for error messages")
            print("- Try indexing a single small file first")
        else:
            print(f"\n✅ {total_indexed} document(s) indexed successfully!")


if __name__ == "__main__":
    asyncio.run(check_status())
