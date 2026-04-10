#!/usr/bin/env python3
"""
Test the LLM calling the agent_browser tool.

This simulates what happens when you send a chat message asking to click the upload button.
"""

import asyncio
import os
import sys

# Set environment
os.environ['CHROME_EXECUTABLE_PATH'] = '/usr/bin/google-chrome'
os.environ['DISPLAY'] = ':1'

sys.path.insert(0, 'backend')

from app.agents.new_chat.tools.agent_browser import create_agent_browser_tool


async def test_tool_directly():
    """Test calling the agent_browser tool directly."""
    
    print("=" * 60)
    print("TESTING AGENT_BROWSER TOOL DIRECTLY")
    print("=" * 60)
    
    # Create the tool
    tool = create_agent_browser_tool()
    
    print(f"\nTool name: {tool.name}")
    print(f"Tool description: {tool.description[:200]}...")
    
    # Test 1: Click upload button (should get snapshot first)
    print("\n[Test 1] Calling tool with 'click the upload button'...")
    result = await tool.ainvoke({"command": "click the upload button"})
    print(f"Result: {result[:500]}...")
    
    # Check if it returned a snapshot
    if "ref=" in result or "@e" in result:
        print("\n✓ Tool correctly returned a snapshot (step 1 of 2-step click)")
        
        # Extract a button ref from the snapshot
        if "@e18" in result or "Upload" in result:
            print("\n[Test 2] Now clicking the specific element @e18...")
            result2 = await tool.ainvoke({"command": "click @e18"})
            print(f"Result: {result2[:200]}...")
            
            if "Done" in result2 or "success" in result2.lower():
                print("\n✓ Successfully clicked the upload button!")
            else:
                print("\n✗ Click may have failed")
    else:
        print("\n✗ Tool did not return a snapshot as expected")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(test_tool_directly())
    except KeyboardInterrupt:
        print("\n\nTest interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
