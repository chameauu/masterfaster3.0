# Quick Start - Run SurfSense from Source

## Prerequisites

Before starting, make sure you have:
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- Redis 7+
- pnpm (for frontend)
- uv (Python package manager)

---

## Step 1: Install System Dependencies

### Ubuntu/Debian
```bash
# PostgreSQL with pgvector
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo apt-get install -y postgresql-14-pgvector

# Redis
sudo apt-get install -y redis-server

# Python build dependencies
sudo apt-get install -y python3.12 python3.12-dev build-essential

# Node.js and pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# UV (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### macOS
```bash
# PostgreSQL with pgvector
brew install postgresql@14
brew install pgvector

# Redis
brew install redis

# Node.js and pnpm
brew install node@18
npm install -g pnpm

# UV
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Step 2: Start Required Services

### Start PostgreSQL
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew services start postgresql@14
```

### Start Redis
```bash
# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server

# macOS
brew services start redis
```

---

## Step 3: Setup Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE USER surfsense WITH PASSWORD 'surfsense';
CREATE DATABASE surfsense OWNER surfsense;
\c surfsense
CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL PRIVILEGES ON DATABASE surfsense TO surfsense;
EOF
```

---

## Step 4: Setup Backend

```bash
cd SurfSense-main/backend

# Create .env file
cp .env.example .env

# Edit .env with your settings (minimum required):
# DATABASE_URL=postgresql+asyncpg://surfsense:surfsense@localhost:5432/surfsense
# CELERY_BROKER_URL=redis://localhost:6379/0
# CELERY_RESULT_BACKEND=redis://localhost:6379/0
# REDIS_APP_URL=redis://localhost:6379/0
# SECRET_KEY=your-secret-key-here
# AUTH_TYPE=LOCAL
# REGISTRATION_ENABLED=TRUE
# NEXT_FRONTEND_URL=http://localhost:3000
# ETL_SERVICE=DOCLING
# EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Install dependencies with UV
uv sync

# Run database migrations
uv run alembic upgrade head

# Install Playwright browsers (for web scraping)
uv run playwright install chromium
```

---

## Step 5: Setup Frontend

```bash
cd SurfSense-main/frontend

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your settings:
# NEXT_PUBLIC_FASTAPI_BACKEND_URL=http://localhost:8000
# NEXT_PUBLIC_FASTAPI_BACKEND_AUTH_TYPE=LOCAL
# NEXT_PUBLIC_ETL_SERVICE=DOCLING
# NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted

# Install dependencies
pnpm install
```

---

## Step 6: Run the Application

You'll need 3 terminal windows:

### Terminal 1: Backend API
```bash
cd SurfSense-main/backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Celery Worker
```bash
cd SurfSense-main/backend
uv run celery -A app.celery_app worker --loglevel=info
```

### Terminal 3: Frontend
```bash
cd SurfSense-main/frontend
pnpm dev
```

---

## Step 7: Access the Application

Open your browser and go to:
- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://localhost:8000/docs
- **Backend Health:** http://localhost:8000/health

---

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep surfsense

# Test connection
psql postgresql://surfsense:surfsense@localhost:5432/surfsense
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Check Redis service
sudo systemctl status redis-server
```

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### UV Not Found
```bash
# Add UV to PATH
export PATH="$HOME/.local/bin:$PATH"

# Or reinstall
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Playwright Installation Issues
```bash
# Install system dependencies for Playwright
sudo apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2
```

---

## Quick Commands Reference

### Backend
```bash
# Start backend
cd backend && uv run uvicorn app.main:app --reload

# Start Celery worker
cd backend && uv run celery -A app.celery_app worker --loglevel=info

# Run migrations
cd backend && uv run alembic upgrade head

# Create new migration
cd backend && uv run alembic revision --autogenerate -m "description"

# Run tests
cd backend && uv run pytest
```

### Frontend
```bash
# Start frontend
cd frontend && pnpm dev

# Build for production
cd frontend && pnpm build

# Start production server
cd frontend && pnpm start

# Run linter
cd frontend && pnpm lint
```

---

## Next Steps

1. Create your first user account at http://localhost:3000
2. Connect data sources (Gmail, Drive, Notion, etc.)
3. Upload documents
4. Start searching!

---

## For Hackathon: Minimal Setup

If you're in a hackathon and want the fastest setup:

```bash
# 1. Start services
sudo systemctl start postgresql redis-server

# 2. Create database
sudo -u postgres psql -c "CREATE DATABASE surfsense;"
sudo -u postgres psql -d surfsense -c "CREATE EXTENSION vector;"

# 3. Backend
cd backend
cp .env.example .env
# Edit .env: Set DATABASE_URL, REDIS_URL, SECRET_KEY, AUTH_TYPE=LOCAL
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload &

# 4. Celery
uv run celery -A app.celery_app worker --loglevel=info &

# 5. Frontend
cd ../frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

Done! Access at http://localhost:3000

---

**Last Updated:** 2026-04-09
