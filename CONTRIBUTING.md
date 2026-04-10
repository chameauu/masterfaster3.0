# Contributing to Voice-First Research Assistant

Thank you for your interest in contributing! This guide will help you get started with development.

---

## 📚 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Before You Start

Read these essential documents (30 minutes):

1. **Project Overview** (10 min)
   - [`README.md`](README.md) - Project overview and tech stack
   - [`docs/VOICE_ASSISTANT_PROJECT_ROADMAP.md`](docs/VOICE_ASSISTANT_PROJECT_ROADMAP.md) - Current status and roadmap
   - [`docs/VOICE_ASSISTANT_IMPLEMENTATION_PLAN.md`](docs/VOICE_ASSISTANT_IMPLEMENTATION_PLAN.md) - Architecture and design

2. **Development Standards** (10 min)
   - [`.cursor/skills/tdd/SKILL.md`](.cursor/skills/tdd/SKILL.md) - TDD approach (RED → GREEN → REFACTOR)
   - [`.cursor/skills/vercel-react-best-practices/SKILL.md`](.cursor/skills/vercel-react-best-practices/SKILL.md) - React patterns
   - [`.cursor/skills/python-patterns/SKILL.md`](.cursor/skills/python-patterns/SKILL.md) - Python standards

3. **Current Implementation** (10 min)
   - [`docs/PIPECAT_WEEK2_FINAL_STATUS.md`](docs/PIPECAT_WEEK2_FINAL_STATUS.md) - Latest status
   - [`docs/PIPECAT_WEEK1_SUMMARY.md`](docs/PIPECAT_WEEK1_SUMMARY.md) - Backend implementation
   - [`docs/PIPECAT_IMPLEMENTATION_SUMMARY.md`](docs/PIPECAT_IMPLEMENTATION_SUMMARY.md) - Overall summary

### Quick Reference by Area

**Frontend Voice Features:**
- [`docs/PIPECAT_DAY11_12_COMPLETE.md`](docs/PIPECAT_DAY11_12_COMPLETE.md) - WebRTC client
- [`docs/PIPECAT_DAY13_14_COMPLETE.md`](docs/PIPECAT_DAY13_14_COMPLETE.md) - Audio capture
- [`docs/PIPECAT_DAY15_16_COMPLETE.md`](docs/PIPECAT_DAY15_16_COMPLETE.md) - Audio playback
- [`docs/PIPECAT_DAY17_18_COMPLETE.md`](docs/PIPECAT_DAY17_18_COMPLETE.md) - Voice widget

**Backend Voice Features:**
- [`backend/app/services/voice/pipecat_service.py`](backend/app/services/voice/pipecat_service.py) - Main service
- [`backend/app/services/voice/pipecat_config.py`](backend/app/services/voice/pipecat_config.py) - Configuration
- [`backend/tests/unit/voice/`](backend/tests/unit/voice/) - Test examples

---

## 💻 Development Setup

### Prerequisites

- **Python 3.12+** - Backend language
- **Node.js 18+** - Frontend runtime
- **PostgreSQL 14+** - Database
- **Redis 7+** - Caching
- **Ollama** - Local LLM (Gemma 4 E2B)
- **uv** - Python package manager (fast pip replacement)
- **pnpm** - Node.js package manager (fast npm replacement)
- **8-16GB RAM** (16GB recommended)
- **Optional:** GPU with 4-6GB VRAM (10x faster)

### Install Package Managers

#### Install uv (Python)
```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -ExecutionPolicy BypassUser -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify
uv --version
```

#### Install pnpm (Node.js)
```bash
npm install -g pnpm

# Verify
pnpm --version
```

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/chameauu/masterfaster3.0
cd masterfaster3.0

# Install Ollama and Gemma model
curl https://ollama.ai/install.sh | sh
ollama pull gemma4:2b-e2b-q4_0

# Backend setup
cd backend
uv sync                          # Install dependencies + create venv
cp .env.example .env             # Configure environment
# Edit .env with your settings
uv run alembic upgrade head      # Run migrations

# Frontend setup
cd ../frontend
pnpm install                     # Install dependencies

# Start services
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend
cd backend
uv run python -m app.app

# Terminal 3: Celery worker
cd backend
uv run celery -A app.celery_app worker --loglevel=info

# Terminal 4: Frontend
cd frontend
pnpm dev
```

### Verify Setup

```bash
# Test backend
curl http://localhost:8000/health

# Test frontend
open http://localhost:3000

# Test voice demo
open http://localhost:3000/voice-demo

# Run tests
cd frontend && pnpm test --run
cd backend && uv run pytest
```

---

## 📁 Project Structure

```
masterfaster3.0/
├── backend/                    # FastAPI Backend
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── services/          # Business logic
│   │   │   └── voice/         # Voice assistant services
│   │   ├── routes/            # API endpoints
│   │   ├── schemas/           # Pydantic models
│   │   └── tests/             # Test suite
│   ├── pyproject.toml         # Python dependencies (uv)
│   └── .env                   # Environment config (not committed)
│
├── frontend/                  # Next.js Frontend
│   ├── app/                   # Next.js app directory
│   │   ├── dashboard/         # Main dashboard
│   │   └── voice-demo/        # Voice demo page
│   ├── components/            # React components
│   │   └── voice/             # Voice components
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-webrtc-client.ts
│   │   ├── use-audio-capture.ts
│   │   └── use-audio-playback.ts
│   ├── __tests__/             # Test suite
│   ├── package.json           # Node dependencies (pnpm)
│   └── vitest.config.ts       # Test configuration
│
├── docs/                      # Documentation
│   ├── VOICE_ASSISTANT_*.md   # Voice assistant docs
│   ├── PIPECAT_*.md           # Implementation docs
│   └── *.md                   # Other docs
│
├── .cursor/skills/            # Development guidelines
│   ├── tdd/                   # TDD approach
│   ├── vercel-react-best-practices/  # React patterns
│   └── python-patterns/       # Python standards
│
├── README.md                  # Project overview
├── CONTRIBUTING.md            # This file
└── TODO.md                    # Development tasks
```

---

## 🔄 Development Workflow

### 1. Choose a Task

Check these sources for tasks:
- [`TODO.md`](TODO.md) - Development tasks
- [GitHub Issues](https://github.com/yourusername/voice-assistant/issues)
- [`docs/VOICE_ASSISTANT_PROJECT_ROADMAP.md`](docs/VOICE_ASSISTANT_PROJECT_ROADMAP.md) - Roadmap

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `test/` - Test improvements
- `refactor/` - Code refactoring

### 3. Follow TDD (Test-Driven Development)

**RED → GREEN → REFACTOR**

```bash
# 1. RED: Write a failing test
# Write test in __tests__/ or tests/

# 2. GREEN: Make it pass
# Write minimal code to pass test

# 3. REFACTOR: Clean up
# Improve code quality

# 4. REPEAT: Next test
```

**Example (Frontend):**
```typescript
// 1. RED: Write failing test
it("connects to WebSocket endpoint", async () => {
  const { result } = renderHook(() => useWebRTCClient());
  
  act(() => {
    result.current.connect();
  });
  
  expect(result.current.status).toBe("connected"); // FAILS
});

// 2. GREEN: Implement feature
const connect = useCallback(() => {
  setStatus("connected");
}, []);

// 3. REFACTOR: Improve
const connect = useCallback(() => {
  try {
    const ws = new WebSocket(url);
    ws.onopen = () => setStatus("connected");
    wsRef.current = ws;
  } catch (error) {
    setStatus("error");
  }
}, [url]);

// 4. REPEAT: Next test
```

**Example (Backend):**
```python
# 1. RED: Write failing test
def test_transcription_service():
    service = TranscriptionService()
    result = service.transcribe(audio_data)
    assert result.text == "hello world"  # FAILS

# 2. GREEN: Implement feature
def transcribe(self, audio_data):
    return TranscriptionResult(text="hello world")

# 3. REFACTOR: Improve
def transcribe(self, audio_data):
    model = self._load_model()
    result = model.transcribe(audio_data)
    return TranscriptionResult(text=result["text"])

# 4. REPEAT: Next test
```

### 4. Write Code

Follow our coding standards (see [Coding Standards](#coding-standards))

### 5. Test Your Changes

```bash
# Frontend tests
cd frontend
pnpm test --run              # Run all tests
pnpm test use-webrtc         # Run specific test

# Backend tests
cd backend
uv run pytest                # Run all tests
uv run pytest tests/unit/voice/  # Run specific tests

# Manual testing
# Start all services and test in browser
open http://localhost:3000/voice-demo
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add voice button to dashboard"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `style:` - Formatting
- `chore:` - Maintenance

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 📝 Coding Standards

### General Principles

1. **Test-Driven Development (TDD)**
   - Write tests first
   - One test at a time
   - Make it pass, then refactor

2. **Type Safety**
   - Use TypeScript (frontend)
   - Use type hints (backend)
   - No `any` types

3. **Error Handling**
   - Always handle errors gracefully
   - Provide helpful error messages
   - Log errors appropriately

4. **Documentation**
   - Document complex logic
   - Update docs as you code
   - Write clear commit messages

### Frontend (React/TypeScript)

**React Best Practices:**

```typescript
// ✅ GOOD: Use refs for transient values
const wsRef = useRef<WebSocket | null>(null);

// ❌ BAD: Don't store in state
const [ws, setWs] = useState<WebSocket | null>(null);

// ✅ GOOD: Functional setState for stable callbacks
const [count, setCount] = useState(0);
const increment = useCallback(() => {
  setCount(prev => prev + 1);
}, []);

// ❌ BAD: Direct state dependency
const increment = useCallback(() => {
  setCount(count + 1);
}, [count]);

// ✅ GOOD: Cleanup on unmount
useEffect(() => {
  const ws = new WebSocket(url);
  
  return () => {
    ws.close();
  };
}, [url]);

// ❌ BAD: No cleanup
useEffect(() => {
  const ws = new WebSocket(url);
}, [url]);
```

**Component Structure:**

```typescript
"use client";

/**
 * Component description
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 */

import { useCallback, useEffect, useState } from "react";

export interface ComponentProps {
  /** Prop description */
  prop1: string;
  /** Optional prop */
  prop2?: number;
}

export function Component({ prop1, prop2 = 0 }: ComponentProps) {
  // State
  const [state, setState] = useState(0);
  
  // Refs
  const ref = useRef(null);
  
  // Callbacks
  const handleClick = useCallback(() => {
    // ...
  }, []);
  
  // Effects
  useEffect(() => {
    // ...
    return () => {
      // cleanup
    };
  }, []);
  
  // Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

**Hook Structure:**

```typescript
/**
 * Hook description
 * 
 * @param options - Configuration options
 * @returns Hook interface
 */
export function useCustomHook(options: Options) {
  // State
  const [state, setState] = useState();
  
  // Refs
  const ref = useRef();
  
  // Callbacks
  const method = useCallback(() => {
    // ...
  }, []);
  
  // Effects
  useEffect(() => {
    // ...
    return () => {
      // cleanup
    };
  }, []);
  
  // Return interface
  return {
    state,
    method,
    // ...
  };
}
```

### Backend (Python)

**Service Structure:**

```python
"""
Service description

Features:
- Feature 1
- Feature 2
"""

from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ServiceName:
    """Service class description."""
    
    def __init__(self, config: Config):
        """Initialize service.
        
        Args:
            config: Service configuration
        """
        self.config = config
        self._resource = None
    
    async def method(self, param: str) -> Result:
        """Method description.
        
        Args:
            param: Parameter description
            
        Returns:
            Result description
            
        Raises:
            ValueError: When param is invalid
        """
        try:
            # Implementation
            result = await self._process(param)
            return result
        except Exception as e:
            logger.error(f"Failed to process: {e}")
            raise
    
    def _private_method(self) -> None:
        """Private helper method."""
        pass
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, *args):
        """Context manager exit."""
        self.cleanup()
    
    def cleanup(self) -> None:
        """Cleanup resources."""
        if self._resource:
            self._resource.close()
```

**Test Structure:**

```python
"""
Test module description
"""

import pytest
from unittest.mock import Mock, patch


class TestServiceName:
    """Test suite for ServiceName."""
    
    @pytest.fixture
    def service(self):
        """Create service instance for testing."""
        config = Config(param="value")
        return ServiceName(config)
    
    def test_method_success(self, service):
        """Test method with valid input."""
        # Arrange
        param = "test"
        
        # Act
        result = service.method(param)
        
        # Assert
        assert result.success is True
        assert result.value == "expected"
    
    def test_method_error(self, service):
        """Test method with invalid input."""
        # Arrange
        param = "invalid"
        
        # Act & Assert
        with pytest.raises(ValueError):
            service.method(param)
```

---

## 🧪 Testing Guidelines

### Test Coverage Requirements

- **Unit Tests:** 100% coverage for new code
- **Integration Tests:** Cover main user flows
- **E2E Tests:** Cover critical paths

### Frontend Testing

**Unit Tests (Vitest + React Testing Library):**

```typescript
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("useCustomHook", () => {
  it("does something", () => {
    // Arrange
    const { result } = renderHook(() => useCustomHook());
    
    // Act
    act(() => {
      result.current.method();
    });
    
    // Assert
    expect(result.current.state).toBe("expected");
  });
});
```

**Run Tests:**

```bash
cd frontend

# Run all tests
pnpm test --run

# Run specific test file
pnpm test use-webrtc --run

# Run with coverage
pnpm test --coverage

# Watch mode (for development)
pnpm test
```

### Backend Testing

**Unit Tests (Pytest):**

```python
import pytest


class TestService:
    @pytest.fixture
    def service(self):
        return Service()
    
    def test_method(self, service):
        # Arrange
        input_data = "test"
        
        # Act
        result = service.method(input_data)
        
        # Assert
        assert result == "expected"
```

**Run Tests:**

```bash
cd backend

# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/unit/voice/test_transcription.py

# Run with coverage
uv run pytest --cov=app

# Run specific test
uv run pytest tests/unit/voice/test_transcription.py::test_transcribe
```

### Test Best Practices

1. **Arrange-Act-Assert (AAA) Pattern**
   ```typescript
   it("test description", () => {
     // Arrange: Set up test data
     const input = "test";
     
     // Act: Execute the code
     const result = function(input);
     
     // Assert: Verify the result
     expect(result).toBe("expected");
   });
   ```

2. **One Assertion Per Test** (when possible)
   ```typescript
   // ✅ GOOD
   it("returns correct value", () => {
     expect(result.value).toBe(42);
   });
   
   it("sets correct status", () => {
     expect(result.status).toBe("success");
   });
   
   // ❌ BAD (testing multiple things)
   it("works correctly", () => {
     expect(result.value).toBe(42);
     expect(result.status).toBe("success");
     expect(result.error).toBeNull();
   });
   ```

3. **Mock External Dependencies**
   ```typescript
   // Mock WebSocket
   global.WebSocket = vi.fn(() => mockWebSocket);
   
   // Mock getUserMedia
   navigator.mediaDevices.getUserMedia = vi.fn(async () => mockStream);
   ```

4. **Test Error Cases**
   ```typescript
   it("handles errors gracefully", async () => {
     // Arrange: Set up error condition
     mockFunction.mockRejectedValue(new Error("Failed"));
     
     // Act
     await function();
     
     // Assert: Verify error handling
     expect(result.error).toBeTruthy();
   });
   ```

---

## 📤 Submitting Changes

### Pull Request Process

1. **Update Documentation**
   - Update README if needed
   - Add/update relevant docs
   - Update TODO.md

2. **Ensure Tests Pass**
   ```bash
   # Frontend
   cd frontend && pnpm test --run
   
   # Backend
   cd backend && uv run pytest
   ```

3. **Check Code Quality**
   ```bash
   # Frontend linting
   cd frontend && pnpm lint
   
   # Backend linting
   cd backend && uv run ruff check .
   ```

4. **Create Pull Request**
   - Clear title and description
   - Reference related issues
   - Add screenshots if UI changes
   - Request review

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No new warnings
```

---

## 🔧 Common Tasks

### Adding a New Frontend Hook

1. **Create hook file:**
   ```bash
   touch frontend/hooks/use-new-feature.ts
   ```

2. **Write test first (TDD):**
   ```bash
   touch frontend/hooks/__tests__/use-new-feature.test.ts
   ```

3. **Implement hook:**
   ```typescript
   // Follow hook structure from Coding Standards
   ```

4. **Run tests:**
   ```bash
   cd frontend && pnpm test use-new-feature --run
   ```

### Adding a New Backend Service

1. **Create service file:**
   ```bash
   touch backend/app/services/new_service.py
   ```

2. **Write test first (TDD):**
   ```bash
   touch backend/tests/unit/test_new_service.py
   ```

3. **Implement service:**
   ```python
   # Follow service structure from Coding Standards
   ```

4. **Run tests:**
   ```bash
   cd backend && uv run pytest tests/unit/test_new_service.py
   ```

### Adding a New Component

1. **Create component file:**
   ```bash
   touch frontend/components/new-component.tsx
   ```

2. **Implement component:**
   ```typescript
   // Follow component structure from Coding Standards
   ```

3. **Add to demo page for testing:**
   ```typescript
   // frontend/app/voice-demo/page.tsx
   import { NewComponent } from "@/components/new-component";
   ```

### Adding Dependencies

**Frontend (pnpm):**
```bash
cd frontend

# Add dependency
pnpm add package-name

# Add dev dependency
pnpm add -D package-name

# Remove dependency
pnpm remove package-name
```

**Backend (uv):**
```bash
cd backend

# Add dependency
uv add package-name

# Add dev dependency
uv add --group dev package-name

# Remove dependency
uv remove package-name

# Sync dependencies
uv sync
```

### Running Database Migrations

```bash
cd backend

# Create migration
uv run alembic revision --autogenerate -m "description"

# Run migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

---

## 🐛 Troubleshooting

### Common Issues

#### File Watcher Limit (Linux)

**Error:** `ENOSPC: System limit for number of file watchers reached`

**Solution:**
```bash
# Increase limit temporarily
sudo sysctl fs.inotify.max_user_watches=524288

# Increase limit permanently
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### PostCSS Test Failures

**Error:** PostCSS plugin errors in tests

**Solution:** Already fixed in `frontend/postcss.config.mjs` with conditional loading:
```javascript
export default {
  plugins: process.env.VITEST
    ? {}
    : {
        tailwindcss: {},
        autoprefixer: {},
      },
};
```

#### WebSocket Connection Refused

**Error:** `Connection refused` when testing voice

**Solution:**
```bash
# Make sure backend is running
cd backend
uv run python -m app.app

# Check backend is accessible
curl http://localhost:8000/health
```

#### Microphone Permission Denied

**Error:** `NotAllowedError: Permission denied`

**Solution:**
- Grant microphone permission in browser
- Use HTTPS in production (required for getUserMedia)
- Check browser console for specific error

#### ONNX Files in Git

**Error:** Large ONNX files being committed

**Solution:**
```bash
# Already in .gitignore
*.onnx
*.onnx.json

# Remove from git if already added
git rm --cached backend/*.onnx
git rm --cached backend/*.onnx.json
```

### Getting Help

1. **Check Documentation:**
   - [`README.md`](README.md)
   - [`docs/`](docs/) folder
   - This file

2. **Search Issues:**
   - [GitHub Issues](https://github.com/yourusername/voice-assistant/issues)

3. **Ask Questions:**
   - Create a new issue
   - Join Discord community
   - Email: support@voice-assistant.example.com

---

## 📋 Checklist for New Contributors

- [ ] Read README.md
- [ ] Read VOICE_ASSISTANT_PROJECT_ROADMAP.md
- [ ] Read relevant SKILL.md files
- [ ] Set up development environment
- [ ] Install uv and pnpm
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Run tests successfully
- [ ] Try demo page
- [ ] Read this CONTRIBUTING.md
- [ ] Pick a task from TODO.md or issues
- [ ] Create feature branch
- [ ] Follow TDD workflow
- [ ] Submit pull request

---

## 🎯 Areas We Need Help

### High Priority

- 🐛 **Fix Integration Tests** - 6 tests failing due to timing/mock issues
- 🎨 **Dashboard Integration** - Add voice button to chat header
- 📱 **Mobile Support** - Make voice widget responsive
- ♿ **Accessibility Testing** - Test with screen readers and blind users

### Medium Priority

- 📊 **Performance Optimization** - Reduce latency, optimize CPU/memory
- 🔒 **Security Audit** - Review audio encryption and privacy
- 🌐 **Internationalization** - Add multi-language support
- 📝 **Documentation** - User guides, troubleshooting, API docs

### Low Priority

- ✨ **New Features** - Wake word, always-listening mode
- 🧪 **E2E Tests** - Playwright tests for real browser testing
- 🎨 **UI Polish** - Animations, better visual feedback
- 📈 **Analytics** - Usage tracking, performance metrics

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience
- Nationality, personal appearance, race
- Religion, sexual identity and orientation

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team. All complaints will be reviewed and investigated promptly and fairly.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

## 🙏 Thank You

Thank you for contributing to making research and learning accessible to everyone! Your work helps visually impaired users gain independent access to information.

**Questions?** Open an issue or reach out to the maintainers.

**Happy coding!** 🚀
