"""
Agent-Browser tool for SurfSense agent.

Provides browser automation capabilities using Vercel's agent-browser CLI.
The LLM can use this tool to control the SurfSense interface via voice commands.

This tool translates natural language commands into agent-browser CLI commands
and executes them to interact with the browser.
"""

import asyncio
import json
import logging
import os
import subprocess
from typing import Any

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class AgentBrowserInput(BaseModel):
    """Input schema for the agent_browser tool."""

    command: str = Field(
        description=(
            "Natural language command to execute in the browser. "
            "Examples: 'go to dashboard', 'click the first button', "
            "'read the page title', 'search for quantum computing', "
            "'fill the form with my name'"
        ),
    )
    context: str | None = Field(
        default=None,
        description=(
            "Optional context about the current page or previous actions. "
            "Helps the tool understand what elements are available."
        ),
    )


class AgentBrowserService:
    """Service for executing agent-browser CLI commands."""

    def __init__(self, headless: bool = False):
        self.session_id: str | None = None
        self._is_available: bool | None = None
        self.headless = headless

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
            if self._is_available:
                logger.info(
                    f"agent-browser is available: {result.stdout.strip()}"
                )
            else:
                logger.warning("agent-browser is not installed")
            return self._is_available
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            logger.warning(f"agent-browser check failed: {e}")
            self._is_available = False
            return False

    def _has_display(self) -> bool:
        """Check if a display is available for showing browser window."""
        import os
        return bool(os.environ.get('DISPLAY'))
    
    def _get_chrome_path(self) -> str | None:
        """Find Chrome executable path."""
        import os
        import shutil
        
        # Check environment variable first
        if chrome_path := os.environ.get('CHROME_EXECUTABLE_PATH'):
            return chrome_path
        
        # Common Chrome locations
        chrome_paths = [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/snap/bin/chromium',
            shutil.which('google-chrome'),
            shutil.which('chromium-browser'),
            shutil.which('chromium'),
            shutil.which('chrome'),
        ]
        
        for path in chrome_paths:
            if path and os.path.isfile(path):
                logger.info(f"[agent_browser] Found Chrome at: {path}")
                return path
        
        logger.warning("[agent_browser] Chrome executable not found")
        return None

    async def execute_command(
        self, command: str, timeout: int = 30
    ) -> dict[str, Any]:
        """Execute agent-browser CLI command.

        Args:
            command: The agent-browser command to execute (without 'agent-browser' prefix)
            timeout: Command timeout in seconds

        Returns:
            Dict with success status, output, and optional error
        """
        if not self.is_available():
            logger.warning("agent-browser CLI is not available")
            return {
                "success": False,
                "error": "agent-browser CLI is not installed. Install it first.",
            }

        try:
            # Set Chrome path if found
            chrome_path = self._get_chrome_path()
            env = os.environ.copy()
            if chrome_path:
                env['CHROME_EXECUTABLE_PATH'] = chrome_path
            
            # Add headed flag if needed
            # Note: agent-browser runs headless by default
            # Only add --headed if explicitly requested AND display is available
            headed_flag = ""
            if not self.headless and self._has_display():
                headed_flag = " --headed"
            
            # Run agent-browser command
            full_command = f"agent-browser{headed_flag} {command}"
            logger.info(f"[agent_browser] Executing: {full_command}")

            process = await asyncio.create_subprocess_shell(
                full_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,  # Pass environment with Chrome path
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
                logger.warning(
                    f"[agent_browser] Command failed: {result['error']}"
                )
            else:
                logger.info(
                    f"[agent_browser] Command succeeded. Output length: {len(stdout_text)} chars"
                )

            return result

        except Exception as e:
            logger.error(f"[agent_browser] Error executing command: {e}", exc_info=True)
            return {
                "success": False,
                "error": f"Execution error: {str(e)}",
            }

    async def translate_natural_language(
        self, nl_command: str, context: str | None = None
    ) -> str:
        """Translate natural language to agent-browser CLI command.

        Args:
            nl_command: Natural language command
            context: Optional context about current page

        Returns:
            agent-browser CLI command string
        """
        lower = nl_command.lower().strip()
        original = nl_command.strip()

        # Direct element reference commands (e.g., "click @e18", "fill @e5 with text")
        # These should be passed through directly without translation
        if "@e" in original:
            # This is a direct element reference command, pass it through
            return original

        # Navigation commands
        if "go to" in lower or "navigate to" in lower:
            if "dashboard" in lower:
                return "open /dashboard"
            if "document" in lower:
                return "open /dashboard/documents"
            if "setting" in lower:
                return "open /settings"
            if "chat" in lower:
                return "open /dashboard/chats"
            if "home" in lower:
                return "open /"

        # Back/forward navigation
        if lower in ["go back", "back", "previous page"]:
            return "back"
        if lower in ["go forward", "forward", "next page"]:
            return "forward"
        if lower in ["refresh", "reload", "reload page"]:
            return "reload"

        # Reading commands
        if "read" in lower or "what" in lower or "show" in lower:
            if "page" in lower or "everything" in lower:
                return "snapshot -i"
            if "title" in lower:
                return "get text h1"
            if "content" in lower or "main" in lower:
                return "get text main"

        # Click commands - IMPORTANT: Get snapshot first to find elements
        if "click" in lower:
            # For click commands, we need to get snapshot first
            # Return snapshot command so we can see available elements
            return "snapshot -i"

        # Search/fill commands
        if "search for" in lower or "find" in lower:
            # Extract search query
            query = lower.replace("search for", "").replace("find", "").strip()
            if query:
                # First get snapshot to find search input
                return "snapshot -i"

        if "fill" in lower or "type" in lower or "enter" in lower:
            # This would need context about which input field
            return "snapshot -i"

        # Screenshot
        if "screenshot" in lower or "capture" in lower:
            return "screenshot"

        # Default: get page snapshot to see what's available
        return "snapshot -i"


# Global service instance (headless=False to show browser GUI)
# Change to True for production/server environments
_browser_service = AgentBrowserService(headless=False)


def create_agent_browser_tool() -> StructuredTool:
    """Factory for the agent_browser tool.

    This tool allows the LLM to control the browser using natural language
    commands that are translated to agent-browser CLI commands.
    """

    description = (
        "Control the SurfSense web interface using natural language commands. "
        "This tool can navigate pages, click buttons, fill forms, and read content. "
        "\n\n"
        "Use this tool when the user wants to:\n"
        "- Navigate to different pages ('go to dashboard', 'open settings')\n"
        "- Click buttons or links ('click the submit button', 'click first result')\n"
        "- Read page content ('read the page', 'what's on this page', 'read the title')\n"
        "- Fill forms ('search for X', 'enter my name')\n"
        "- Take screenshots ('screenshot this page')\n"
        "\n"
        "The tool translates natural language to browser automation commands."
    )

    async def _agent_browser_impl(
        command: str, context: str | None = None
    ) -> str:
        """Execute browser automation command.

        Args:
            command: Natural language command
            context: Optional context about current page

        Returns:
            Result of the browser action as a string
        """
        if not _browser_service.is_available():
            return (
                "Browser automation is not available. "
                "The agent-browser CLI tool is not installed. "
                "Please install it first: https://github.com/vercel-labs/agent-browser"
            )

        # Translate natural language to CLI command
        cli_command = await _browser_service.translate_natural_language(
            command, context
        )

        logger.info(
            f"Translated '{command}' to agent-browser command: '{cli_command}'"
        )

        # Execute the command
        result = await _browser_service.execute_command(cli_command)

        if not result["success"]:
            error_msg = result.get("error", "Unknown error")
            return f"Browser action failed: {error_msg}"

        output = result.get("output", "")

        # Format output for LLM
        if "snapshot" in cli_command:
            # Parse snapshot output
            return f"Page snapshot:\n\n{output}\n\nUse this information to understand what's on the page."

        if "get text" in cli_command:
            return f"Page content:\n\n{output}"

        if "click" in cli_command or "fill" in cli_command:
            return f"Action completed successfully. {output if output else 'No additional output.'}"

        if "open" in cli_command or "back" in cli_command or "forward" in cli_command:
            return f"Navigation completed. {output if output else 'Page loaded.'}"

        # Default response
        return output if output else "Command executed successfully."

    return StructuredTool(
        name="agent_browser",
        description=description,
        coroutine=_agent_browser_impl,
        args_schema=AgentBrowserInput,
    )
