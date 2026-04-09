# SurfSense Backend Architecture Overview

## Project Summary

**SurfSense** is an open-source, self-hosted AI research platform built as an alternative to Google's NotebookLM and Perplexity. The backend is a FastAPI-based Python application that provides:

- Multi-source data consolidation (10+ integrations)
- AI-powered research and chat capabilities
- Document processing and semantic search
- Voice features (TTS/STT)
- Real-time collaboration
- Enterprise-grade security and rate limiting

**Version:** 0.0.14  
**Python:** 3.12+  
**Framework:** FastAPI + SQLAlchemy + PostgreSQL

---

## Technology Stack

### Core Framework
- **FastAPI** (0.115.8+) - Modern async web framework
- **Uvicorn** (0.34.0+) - ASGI server
- **SQLAlchemy** (async) - ORM with PostgreSQL
- **Alembic** - Database migrations

### Data & Search
- **PostgreSQL** - Primary database with pgvector extension
- **Redis** - Caching, rate limiting, Celery broker
- **Elasticsearch** (9.1.1+) - Full-text search
- **Sentence Transformers** (3.4.1+) - Embeddings
- **Rerankers** (0.7.1+) - Document reranking with FlashRank

### AI & LLM
- **LiteLLM** (1.83.0+) - Unified LLM interface
- **LangChain** (1.2.13+) - LLM orchestration
- **LangGraph** (1.1.3+) - Agent workflows
- **DeepAgents** (0.4.12+) - Advanced agent framework
- **MCP** (1.25.0+) - Model Context Protocol support

### Document Processing
- **Docling** (2.15.0+) - Advanced document parsing
- **Unstructured** (0.18.31+) - Multi-format document extraction
- **LlamaCloud** (0.6.25+) - Enhanced parsing service
- **PyPDF** (5.1.0+) - PDF handling
- **Markdownify** (0.14.1+) - HTML to Markdown conversion
- **Trafilatura** (2.0.0+) - Web content extraction

### Voice & Media
- **Kokoro** (0.9.4+) - Local text-to-speech
- **Faster-Whisper** (1.1.0+) - Speech-to-text
- **Python-FFmpeg** (2.0.12+) - Audio/video processing
- **SoundFile** (0.13.1+) - Audio file handling
- **YouTube Transcript API** (1.0.3+) - YouTube integration

### Connectors & Integrations
- **Slack SDK** (3.34.0+)
- **Discord.py** (2.5.2+)
- **Notion Client** (2.3.0+)
- **GitHub3.py** (4.0.1+)
- **Google API Client** (2.156.0+)
- **Playwright** (1.50.0+) - Web automation
- **Firecrawl** (4.9.0+) - Web crawling
- **Composio** (0.10.9+) - Tool integration platform

### Task Processing
- **Celery** (5.5.3+) - Distributed task queue
- **Flower** (2.0.1+) - Celery monitoring
- **Redis** - Message broker

### Security & Auth
- **FastAPI-Users** (15.0.3+) - User management
- **AuthLib** (1.6.9+) - OAuth support
- **PyJWT** (2.12.0+) - JWT tokens
- **SlowAPI** (0.1.9+) - Rate limiting

### Utilities
- **Boto3** (1.35.0+) - AWS S3 support
- **Stripe** (15.0.0+) - Payment processing
- **Validators** (0.34.0+) - Data validation
- **Spacy** (3.8.7+) - NLP
- **Chonkie** (1.5.0+) - Text chunking

---

## Project Structure

```
surfsense_backend/
├── main.py                 # Entry point (Uvicorn server)
├── celery_worker.py        # Celery worker process
├── pyproject.toml          # Dependencies & project config
├── .env.example            # Configuration template
├── Dockerfile              # Container definition
├── alembic/                # Database migrations
│   ├── versions/           # Migration files (107+ versions)
│   ├── env.py              # Migration environment
│   └── alembic.ini         # Migration config
├── app/
│   ├── app.py              # FastAPI application setup
│   ├── db.py               # Database connection & models
│   ├── users.py            # User authentication
│   ├── celery_app.py       # Celery configuration
│   ├── agents/             # AI agents
│   │   ├── new_chat/       # Chat agent (LangGraph-based)
│   │   │   ├── chat_deepagent.py
│   │   │   ├── llm_config.py
│   │   │   ├── context.py
│   │   │   └── checkpointer.py
│   │   └── autocomplete/   # Autocomplete agent
│   ├── connectors/         # Data source integrations
│   │   ├── slack/
│   │   ├── notion/
│   │   ├── github/
│   │   ├── jira/
│   │   ├── gmail/
│   │   ├── google_drive/
│   │   ├── google_calendar/
│   │   ├── discord/
│   │   ├── linear/
│   │   ├── confluence/
│   │   ├── dropbox/
│   │   ├── onedrive/
│   │   └── ... (more connectors)
│   ├── routes/             # API endpoints (40+ route files)
│   │   ├── new_chat_routes.py
│   │   ├── documents_routes.py
│   │   ├── podcasts_routes.py
│   │   ├── video_presentations_routes.py
│   │   ├── auth_routes.py
│   │   ├── search_spaces_routes.py
│   │   ├── *_add_connector_route.py
│   │   └── ... (more routes)
│   ├── services/           # Business logic
│   │   ├── llm_service.py
│   │   ├── stt_service.py
│   │   ├── kokoro_tts_service.py
│   │   ├── connector_service.py
│   │   ├── reranker_service.py
│   │   ├── web_search_service.py
│   │   ├── new_streaming_service.py
│   │   └── ... (more services)
│   ├── etl_pipeline/       # Document processing
│   ├── indexing_pipeline/  # Vector indexing
│   ├── retriever/          # Semantic search
│   ├── tasks/              # Celery background tasks
│   ├── schemas/            # Pydantic models
│   ├── config/             # Configuration management
│   ├── prompts/            # LLM prompts
│   ├── templates/          # Email templates
│   └── utils/              # Utility functions
├── scripts/                # Utility scripts
│   └── seed_surfsense_docs.py
└── tests/                  # Test suite
    ├── unit/
    ├── integration/
    └── fixtures/
```

---

## Key Features & Capabilities

### 1. Multi-Source Data Integration (Connectors)

Supported integrations:
- **Communication:** Slack, Discord, Microsoft Teams, Gmail
- **Project Management:** Jira, Linear, ClickUp, Confluence
- **Knowledge Base:** Notion, Google Drive, OneDrive, Dropbox
- **Development:** GitHub, GitLab
- **Productivity:** Google Calendar, Airtable
- **Web:** YouTube, Web Crawler (Firecrawl)
- **Custom:** Composio (tool integration platform)

Each connector:
- Handles OAuth authentication
- Syncs data periodically
- Transforms data into documents
- Indexes for semantic search

### 2. AI Chat & Research Agent

**Architecture:**
- Built with **LangGraph** for stateful agent workflows
- Uses **DeepAgents** for advanced reasoning
- Supports multiple LLM providers via **LiteLLM**
- Maintains conversation state in PostgreSQL

**Capabilities:**
- Multi-turn conversations
- Document-aware responses
- Real-time streaming
- Autocomplete suggestions
- Context-aware search

### 3. Document Processing (ETL Pipeline)

**Supported Formats:**
- PDFs, Word docs, Excel, PowerPoint
- Images (OCR), HTML, Markdown
- Code files, JSON, CSV
- YouTube transcripts, web pages

**Processing Options:**
- **Docling** - Local, privacy-focused (34+ formats)
- **Unstructured** - API-based (50+ formats)
- **LlamaCloud** - Enhanced parsing with Azure Document Intelligence

**Pipeline:**
1. Extract text/content
2. Chunk into semantic units (Chonkie)
3. Generate embeddings (Sentence Transformers)
4. Store in PostgreSQL + pgvector
5. Index in Elasticsearch

### 4. Voice Features

**Text-to-Speech (TTS):**
- **Local:** Kokoro (privacy-focused)
- **API:** LiteLLM providers (OpenAI, Google, etc.)
- Configuration: `TTS_SERVICE` environment variable

**Speech-to-Text (STT):**
- **Local:** Faster-Whisper (tiny, base, small, medium, large-v3)
- **API:** LiteLLM providers (OpenAI Whisper, etc.)
- Configuration: `STT_SERVICE` environment variable

**Podcast Generation:**
- Convert documents to podcast-style audio
- Dual-voice conversations
- Customizable narration

### 5. Video Presentations

- Generate video presentations from documents
- Configurable slide count (default: 30)
- Frame-based timing (default: 30 FPS)
- Audio synchronization

### 6. Search & Retrieval

**Semantic Search:**
- Vector similarity (pgvector)
- Embedding models: Sentence Transformers, OpenAI, Anthropic, Cohere
- Reranking: FlashRank for relevance

**Full-Text Search:**
- Elasticsearch integration
- Hybrid search (semantic + keyword)

**Retrieval:**
- Context-aware document retrieval
- Multi-source aggregation
- Relevance ranking

### 7. Security & Rate Limiting

**Authentication:**
- Google OAuth or Local email/password
- JWT tokens with configurable lifetimes
- FastAPI-Users integration

**Rate Limiting:**
- Redis-backed global limits (1024/min default)
- Auth-specific stricter limits
- In-memory fallback when Redis unavailable
- Custom 429 error handling

**Authorization:**
- RBAC (Role-Based Access Control)
- User-specific data isolation
- Workspace/team support

### 8. Payment & Monetization

**Stripe Integration:**
- Pay-as-you-go page packs
- Configurable pricing
- Webhook handling
- Reconciliation safety net

---

## API Routes (40+ Endpoints)

### Chat & Conversation
- `POST /api/v1/chat/new` - Start new chat
- `POST /api/v1/chat/message` - Send message
- `GET /api/v1/chat/history` - Get conversation history
- `POST /api/v1/chat/comments` - Add comments

### Documents
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents` - List documents
- `DELETE /api/v1/documents/{id}` - Delete document
- `GET /api/v1/documents/{id}/chunks` - Get document chunks

### Search
- `POST /api/v1/search/spaces` - Search knowledge spaces
- `POST /api/v1/search/connectors` - Search connector sources

### Connectors
- `POST /api/v1/auth/{connector}/callback` - OAuth callbacks
- `GET /api/v1/connectors` - List connected sources
- `DELETE /api/v1/connectors/{id}` - Disconnect source

### Podcasts
- `POST /api/v1/podcasts/generate` - Generate podcast
- `GET /api/v1/podcasts` - List podcasts
- `GET /api/v1/podcasts/{id}/audio` - Download audio

### Video Presentations
- `POST /api/v1/video-presentations/generate` - Generate video
- `GET /api/v1/video-presentations` - List videos

### Models & Configuration
- `GET /api/v1/models` - List available LLM models
- `POST /api/v1/llm-config` - Configure LLM settings
- `GET /api/v1/vision-models` - List vision models

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Admin
- `GET /api/v1/logs` - View logs
- `GET /api/v1/notifications` - Get notifications
- `POST /api/v1/reports` - Generate reports

---

## Configuration (Environment Variables)

### Database
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/surfsense
```

### Redis & Celery
```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
REDIS_APP_URL=redis://localhost:6379/0
```

### Authentication
```env
AUTH_TYPE=GOOGLE or LOCAL
REGISTRATION_ENABLED=TRUE
SECRET_KEY=your-secret-key
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

### LLM & Embeddings
```env
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RERANKERS_ENABLED=TRUE
RERANKERS_MODEL_NAME=ms-marco-MiniLM-L-12-v2
```

### Voice Services
```env
TTS_SERVICE=local/kokoro
STT_SERVICE=local/base
```

### Document Processing
```env
ETL_SERVICE=DOCLING or UNSTRUCTURED or LLAMACLOUD
FIRECRAWL_API_KEY=...
```

### Connectors (OAuth)
```env
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
NOTION_CLIENT_ID=...
DISCORD_CLIENT_ID=...
# ... (more connector configs)
```

### Payment
```env
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID=...
```

---

## Database Schema

**Key Tables:**
- `user` - User accounts
- `documents` - Uploaded/synced documents
- `chunks` - Document chunks with embeddings
- `chat_sessions` - Conversation history
- `connectors` - Connected data sources
- `notifications` - User notifications
- `reports` - Generated reports
- `video_presentations` - Generated videos
- `stripe_purchases` - Payment records

**Extensions:**
- `pgvector` - Vector similarity search
- `uuid-ossp` - UUID generation

---

## Background Tasks (Celery)

**Periodic Tasks:**
- Connector indexing (sync data from sources)
- Stripe reconciliation
- Notification processing
- Document cleanup
- Cache invalidation

**On-Demand Tasks:**
- Document processing
- Podcast generation
- Video generation
- Email sending
- Search indexing

---

## Development & Testing

### Running Locally
```bash
# Install dependencies
pip install -e .

# Run migrations
alembic upgrade head

# Start server
python main.py --reload

# Start Celery worker
celery -A app.celery_app worker -l info
```

### Testing
```bash
# Run all tests
pytest

# Run unit tests only
pytest -m unit

# Run integration tests
pytest -m integration
```

### Code Quality
- **Linter:** Ruff
- **Formatter:** Ruff format
- **Type Checking:** Implicit (Python 3.12+)

---

## Deployment

### Docker
```bash
docker run -d -p 3000:3000 -p 8000:8000 -p 5133:5133 \
  -v surfsense-data:/data \
  --name surfsense \
  --restart unless-stopped \
  ghcr.io/modsetter/surfsense:latest
```

### Docker Compose
```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/MODSetter/SurfSense/main/docker-compose.quickstart.yml
docker compose up -d
```

### Ports
- **3000** - Frontend (Next.js)
- **8000** - Backend API
- **5133** - Electric-SQL (real-time sync)

---

## Key Dependencies Highlights

| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.115.8+ | Web framework |
| SQLAlchemy | async | ORM |
| LiteLLM | 1.83.0+ | LLM abstraction |
| LangChain | 1.2.13+ | LLM orchestration |
| LangGraph | 1.1.3+ | Agent workflows |
| Sentence Transformers | 3.4.1+ | Embeddings |
| Docling | 2.15.0+ | Document parsing |
| Celery | 5.5.3+ | Task queue |
| Kokoro | 0.9.4+ | TTS |
| Faster-Whisper | 1.1.0+ | STT |
| Stripe | 15.0.0+ | Payments |

---

## Performance Optimizations

1. **Async/Await** - Non-blocking I/O throughout
2. **Connection Pooling** - PostgreSQL + Redis
3. **Caching** - Redis for frequently accessed data
4. **Vector Indexing** - pgvector for fast similarity search
5. **Reranking** - FlashRank for relevance
6. **Rate Limiting** - Protect against abuse
7. **Celery** - Offload heavy tasks
8. **Streaming** - Real-time chat responses

---

## Security Features

1. **JWT Authentication** - Stateless token-based auth
2. **OAuth 2.0** - Third-party integrations
3. **Rate Limiting** - Redis-backed with fallback
4. **CORS** - Configurable cross-origin access
5. **Proxy Headers** - Support for reverse proxies
6. **Secret Management** - Environment-based secrets
7. **RBAC** - Role-based access control
8. **Data Isolation** - User-specific data access

---

## Monitoring & Observability

- **LangSmith** - LLM tracing and debugging
- **Flower** - Celery task monitoring
- **Logs** - Structured logging with timestamps
- **Metrics** - Performance tracking
- **Error Handling** - Comprehensive exception handling

---

## Future Extensibility

The architecture supports:
- Custom LLM providers via LiteLLM
- New connectors via plugin system
- Custom ETL services
- Voice provider integration
- Video generation customization
- Payment provider integration
- Custom authentication backends

