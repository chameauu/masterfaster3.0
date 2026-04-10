#!/usr/bin/env env python
"""
Diagnostic script to test Composio connection and token retrieval.

Run this to diagnose issues with Composio Google Drive connector.

Usage:
    uv run python test_composio_connection.py
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import config
from app.services.composio_service import ComposioService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_composio():
    """Test Composio connection and token retrieval."""

    print("\n" + "=" * 60)
    print("COMPOSIO CONNECTION DIAGNOSTIC")
    print("=" * 60 + "\n")

    # Check 1: Composio enabled
    print("✓ Check 1: Is Composio enabled?")
    if not ComposioService.is_enabled():
        print("  ❌ FAILED: Composio is not enabled")
        print(f"     COMPOSIO_ENABLED = {config.COMPOSIO_ENABLED}")
        print(
            f"     COMPOSIO_API_KEY = {'SET' if config.COMPOSIO_API_KEY else 'NOT SET'}"
        )
        return
    print("  ✅ PASSED: Composio is enabled")
    print(
        f"     API Key: {config.COMPOSIO_API_KEY[:10]}...{config.COMPOSIO_API_KEY[-4:]}"
    )

    # Check 2: Initialize service
    print("\n✓ Check 2: Can we initialize Composio service?")
    try:
        service = ComposioService()
        print("  ✅ PASSED: Service initialized")
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return

    # Check 3: List available toolkits
    print("\n✓ Check 3: Can we list available toolkits?")
    try:
        toolkits = service.list_available_toolkits()
        print(f"  ✅ PASSED: Found {len(toolkits)} toolkits")
        for toolkit in toolkits:
            print(
                f"     - {toolkit['name']} (id: {toolkit['id']}, indexable: {toolkit['is_indexable']})"
            )
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return

    # Check 4: Check for auth configs
    print("\n✓ Check 4: Do we have auth configs?")
    try:
        auth_configs = service.client.auth_configs.list()
        if not auth_configs.items:
            print("  ⚠️  WARNING: No auth configs found")
            print("     You need to create auth configs in Composio dashboard:")
            print(
                "     https://app.composio.dev/ → Integrations → Google Drive → Add Auth Config"
            )
        else:
            print(f"  ✅ PASSED: Found {len(auth_configs.items)} auth config(s)")
            for auth_config in auth_configs.items:
                toolkit = getattr(auth_config, "toolkit", None)
                toolkit_name = None
                if isinstance(toolkit, str):
                    toolkit_name = toolkit
                elif hasattr(toolkit, "slug"):
                    toolkit_name = toolkit.slug
                elif hasattr(toolkit, "name"):
                    toolkit_name = toolkit.name
                print(f"     - {auth_config.id}: {toolkit_name}")
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return

    # Check 5: List connected accounts
    print("\n✓ Check 5: Do we have any connected accounts?")
    try:
        # Note: This requires entity_id, so we'll just check if the method works
        # In production, you'd pass the actual user's entity_id
        print("  ℹ️  To check connected accounts, we need a user entity_id")
        print(
            "     Connected accounts are created when users click 'Connect' in the UI"
        )
    except Exception as e:
        print(f"  ⚠️  Note: {e}")

    # Check 6: Test token retrieval (if we have a connected account)
    print("\n✓ Check 6: Can we retrieve access tokens?")
    print("  ℹ️  This requires a connected account ID")
    print("     To test this:")
    print("     1. Connect your Google account in the UI")
    print("     2. Check backend logs for 'connected_account_id'")
    print("     3. Run: service.get_access_token('your_connected_account_id')")

    # Check 7: Secret masking warning
    print("\n✓ Check 7: Secret masking configuration")
    print("  ⚠️  IMPORTANT: Make sure 'Mask Connected Account Secrets' is DISABLED")
    print("     Go to: https://app.composio.dev/ → Settings → Project Settings")
    print("     Find: 'Mask Connected Account Secrets'")
    print("     Status: Should be OFF (disabled)")
    print(
        "     If enabled, token retrieval will return masked tokens (too short to use)"
    )

    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60 + "\n")

    # Summary
    print("SUMMARY:")
    print("--------")
    print("✅ Composio is enabled and API key is set")
    print("✅ Service can be initialized")
    print("✅ Toolkits are available")

    if not auth_configs.items:
        print("❌ No auth configs found - CREATE THEM IN COMPOSIO DASHBOARD")
    else:
        print("✅ Auth configs are set up")

    print("\nNEXT STEPS:")
    print("-----------")
    if not auth_configs.items:
        print("1. Go to https://app.composio.dev/")
        print("2. Navigate to Integrations")
        print("3. Search for 'Google Drive'")
        print("4. Click 'Add Auth Config'")
        print("5. Fill in name and select scopes")
        print("6. Click 'Create'")
        print("7. Disable 'Mask Connected Account Secrets' in Settings")
    else:
        print("1. Make sure 'Mask Connected Account Secrets' is DISABLED")
        print("2. Try connecting Google Drive in the UI")
        print("3. Check backend logs for any errors")
        print("4. If token retrieval fails, check token length in logs")
        print("   (Should be >100 chars, not ~20 chars)")


if __name__ == "__main__":
    asyncio.run(test_composio())
