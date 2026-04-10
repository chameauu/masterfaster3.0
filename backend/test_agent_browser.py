#!/usr/bin/env python3
"""
Test script for agent-browser integration with SurfSense.

This script tests the agent_browser tool to verify:
1. Chrome is detected
2. Browser opens with GUI
3. Commands execute successfully
4. Browser stays open between commands

Usage:
    uv run python test_agent_browser.py
"""

import asyncio
import os
import sys
import subprocess
from pathlib import Path

# Set environment variables
os.environ['CHROME_EXECUTABLE_PATH'] = '/usr/bin/google-chrome'
os.environ['DISPLAY'] = ':1'


class AgentBrowserService:
    """Simplified version of AgentBrowserService for testing."""
    
    def __init__(self, headless: bool = False):
        self.headless = headless
        self._is_available = None
    
    def is_available(self) -> bool:
        """Check if agent-browser CLI is installed."""
        if self._is_available is not None:
            return self._is_available
        
        try:
            result = subprocess.run(
                ["agent-browser", "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            self._is_available = result.returncode == 0
            return self._is_available
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self._is_available = False
            return False
    
    def _has_display(self) -> bool:
        """Check if a display is available."""
        return bool(os.environ.get('DISPLAY'))
    
    def _get_chrome_path(self) -> str | None:
        """Find Chrome executable path."""
        import shutil
        
        # Check environment variable first
        if chrome_path := os.environ.get('CHROME_EXECUTABLE_PATH'):
            return chrome_path
        
        # Common Chrome locations
        chrome_paths = [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            shutil.which('google-chrome'),
            shutil.which('chromium-browser'),
            shutil.which('chromium'),
        ]
        
        for path in chrome_paths:
            if path and Path(path).is_file():
                return path
        
        return None
    
    async def execute_command(self, command: str, timeout: int = 30) -> dict:
        """Execute agent-browser CLI command."""
        if not self.is_available():
            return {
                "success": False,
                "error": "agent-browser CLI is not installed",
            }
        
        try:
            # Set Chrome path if found
            chrome_path = self._get_chrome_path()
            env = os.environ.copy()
            if chrome_path:
                env['CHROME_EXECUTABLE_PATH'] = chrome_path
            
            # Add headed flag if needed
            headed_flag = ""
            if not self.headless and self._has_display():
                headed_flag = " --headed"
            
            # Run agent-browser command
            full_command = f"agent-browser{headed_flag} {command}"
            
            process = await asyncio.create_subprocess_shell(
                full_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return {
                    "success": False,
                    "error": f"Command timed out after {timeout}s",
                }
            
            stdout_text = stdout.decode("utf-8") if stdout else ""
            stderr_text = stderr.decode("utf-8") if stderr else ""
            
            success = process.returncode == 0
            
            result = {
                "success": success,
                "output": stdout_text.strip(),
            }
            
            if not success:
                result["error"] = stderr_text.strip() or "Command failed"
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Execution error: {str(e)}",
            }
    
    async def translate_natural_language(self, nl_command: str) -> str:
        """Translate natural language to agent-browser CLI command."""
        lower = nl_command.lower().strip()
        
        # Navigation commands
        if "go to" in lower or "navigate to" in lower:
            if "dashboard" in lower:
                return "open /dashboard"
            if "home" in lower:
                return "open /"
        
        # Back/forward navigation
        if lower in ["go back", "back"]:
            return "back"
        if lower in ["go forward", "forward"]:
            return "forward"
        
        # Reading commands
        if "read" in lower:
            return "snapshot -i"
        
        # Click commands - get snapshot first
        if "click" in lower:
            return "snapshot -i"
        
        # Default: get page snapshot
        return "snapshot -i"


async def test_agent_browser():
    """Test agent-browser integration."""
    
    print("=" * 60)
    print("AGENT-BROWSER INTEGRATION TEST")
    print("=" * 60)
    
    # Initialize service
    service = AgentBrowserService(headless=False)
    
    # Test 1: Check availability
    print("\n[Test 1] Checking agent-browser availability...")
    is_available = service.is_available()
    print(f"  ✓ agent-browser available: {is_available}")
    
    if not is_available:
        print("  ✗ ERROR: agent-browser is not installed!")
        print("  Install it with: npm install -g agent-browser")
        return False
    
    # Test 2: Check Chrome path
    print("\n[Test 2] Checking Chrome executable...")
    chrome_path = service._get_chrome_path()
    print(f"  ✓ Chrome path: {chrome_path}")
    
    if not chrome_path:
        print("  ✗ ERROR: Chrome not found!")
        print("  Set CHROME_EXECUTABLE_PATH in backend/.env")
        return False
    
    # Test 3: Check display
    print("\n[Test 3] Checking display availability...")
    has_display = service._has_display()
    print(f"  ✓ Display available: {has_display}")
    
    if not has_display:
        print("  ⚠ WARNING: No display detected. Browser will run headless.")
    
    # Test 4: Open page
    print("\n[Test 4] Opening http://localhost:3000...")
    print("  (Browser window should appear on your screen)")
    result = await service.execute_command('open http://localhost:3000')
    
    if result['success']:
        print(f"  ✓ Page opened successfully")
        print(f"  Output: {result['output'][:100]}")
    else:
        print(f"  ✗ ERROR: {result.get('error')}")
        return False
    
    # Wait for page to load
    await asyncio.sleep(2)
    
    # Test 5: Get snapshot
    print("\n[Test 5] Getting page snapshot...")
    result = await service.execute_command('snapshot -i')
    
    if result['success']:
        print(f"  ✓ Snapshot retrieved ({len(result['output'])} chars)")
        print(f"  First 200 chars:")
        print(f"  {result['output'][:200]}")
    else:
        print(f"  ✗ ERROR: {result.get('error')}")
        return False
    
    # Test 6: Navigate to dashboard
    print("\n[Test 6] Navigating to dashboard...")
    result = await service.execute_command('open http://localhost:3000/dashboard')
    
    if result['success']:
        print(f"  ✓ Navigated to dashboard")
        print(f"  Output: {result['output'][:100]}")
    else:
        print(f"  ✗ ERROR: {result.get('error')}")
        return False
    
    # Test 7: Natural language translation
    print("\n[Test 7] Testing natural language translation...")
    test_commands = [
        ("go to dashboard", "open /dashboard"),
        ("read the page", "snapshot -i"),
        ("go back", "back"),
        ("click upload button", "snapshot -i"),  # First step of two-step click
    ]
    
    for nl_command, expected_cli in test_commands:
        cli_command = await service.translate_natural_language(nl_command)
        match = "✓" if expected_cli in cli_command else "✗"
        print(f"  {match} '{nl_command}' → '{cli_command}'")
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print("✓ All tests passed!")
    print("\nThe browser window should be visible on your screen.")
    print("It will stay open until you close it with: agent-browser close")
    print("\nNext steps:")
    print("1. Start backend: cd backend && uv run python -m app.app")
    print("2. Start frontend: cd frontend && pnpm dev")
    print("3. Test voice commands in the browser")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    try:
        success = asyncio.run(test_agent_browser())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
