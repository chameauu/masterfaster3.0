# VocalAIze Codebase Exploration Summary

## 1. RAG (Retrieval-Augmented Generation) Implementation

### Retriever Services
- **[backend/app/retriever/chunks_hybrid_search.py](backend/app/retriever/chunks_hybrid_search.py)**
  - `ChucksHybridSearchRetriever` class - Performs hybrid search on document chunks
  - Methods:
    - `vector_search()` - Vector similarity search using embeddings stored in PostgreSQL
    - `full_text_search()` - Full-text keyword search on chunks
  - Uses embedding model from config and PostgreSQL vector operations (cosine similarity with `<=>` operator)
  - Supports time-based filtering (start_date/end_date)

- **[backend/app/retriever/documents_hybrid_search.py](backend/app/retriever/documents_hybrid_search.py)**
  - `DocumentHybridSearchRetriever` class - Performs hybrid search at the document level
  - Methods:
    - `vector_search()` - Vector similarity search on full documents
    - `full_text_search()` - Full-text search on documents
  - Similar structure to chunks retriever but operates on entire documents

### Reranking
- **[backend/app/services/reranker_service.py](backend/app/services/reranker_service.py)**
  - `RerankerService` class - Reranks search results using a configured reranker
  - `rerank_documents()` - Accepts documents/chunks and reranks by relevance to query
  - Supports both document-grouped format (with chunks list) and chunk-based legacy format
  - Returns reranked results with preserved structure for citation handling

### Web Search Integration
- **[backend/app/services/web_search_service.py](backend/app/services/web_search_service.py)**
  - Web search service backed by SearXNG
  - Features:
    - Redis-based result caching (5-minute TTL)
    - In-process circuit breaker with failure threshold management
    - Graceful degradation if external services unavailable

---

## 2. Indexing Pipeline

### Core Indexing Service
- **[backend/app/indexing_pipeline/indexing_pipeline_service.py](backend/app/indexing_pipeline/indexing_pipeline_service.py)**
  - `IndexingPipelineService` - Single unified pipeline for all connectors
  - Key methods:
    - `create_placeholder_documents()` - Create placeholder rows for instant UI feedback (pending status)
    - `prepare_for_indexing()` - Pre-process documents before indexing
    - `index()` - Main indexing operation
  - Handles:
    - Document hashing for duplicate detection
    - Content chunking
    - Embedding generation
    - Document summarization
    - Error handling with retry logic

### Document Processing
- **[backend/app/indexing_pipeline/document_chunker.py](backend/app/indexing_pipeline/document_chunker.py)**
  - `chunk_text()` - Uses configured `RecursiveChunker` or `CodeChunker`
  - Splits documents into manageable chunks for embedding and storage
  - Configuration-based chunking strategy selection

- **[backend/app/indexing_pipeline/document_embedder.py](backend/app/indexing_pipeline/document_embedder.py)**
  - `embed_text()` and `embed_texts()` - Generate embeddings for chunks
  - Uses `AutoEmbeddings` from chonkie library configured in app config
  - Embeddings stored as vectors in PostgreSQL

- **[backend/app/indexing_pipeline/document_summarizer.py](backend/app/indexing_pipeline/document_summarizer.py)**
  - `summarize_document()` - Generate document summaries using LLM
  - Optimizes content for context window before summarization
  - Appends metadata to summary for better context

- **[backend/app/indexing_pipeline/document_hashing.py](backend/app/indexing_pipeline/document_hashing.py)**
  - Hash computation for:
    - Content hash - Detect content changes
    - Identifier hash - Unique document identification
    - Prevents duplicate indexing

- **[backend/app/indexing_pipeline/document_persistence.py](backend/app/indexing_pipeline/document_persistence.py)**
  - `attach_chunks_to_document()` - Associate chunks with documents
  - `rollback_and_persist_failure()` - Error recovery mechanism
  - Maintains database consistency during failures

### Document Upload Pipeline
- **[backend/app/indexing_pipeline/adapters/file_upload_adapter.py](backend/app/indexing_pipeline/adapters/file_upload_adapter.py)**
  - `UploadDocumentAdapter` - Handles file uploads and indexing
  - Methods:
    - `index()` - Initial indexing of uploaded files
    - `reindex()` - Re-index existing documents after content changes
  - Converts files to ConnectorDocument format for processing

### ETL Pipeline (File Extraction)
- **[backend/app/etl_pipeline/etl_pipeline_service.py](backend/app/etl_pipeline/etl_pipeline_service.py)**
  - `EtlPipelineService` - Unified file content extraction
  - File type support:
    - **Plaintext** - Direct text files
    - **Audio** - Transcription via STT service
    - **Documents** - PDF, DOCX, etc. via:
      - **DOCLING** - Advanced document parsing with layout preservation
      - **UNSTRUCTURED** - Alternative document parsing
      - **LLAMACLOUD** - LlamaCloud with Azure Document Intelligence fallback
    - **Direct Convert** - Known file formats

- **[backend/app/services/docling_service.py](backend/app/services/docling_service.py)**
  - `DoclingService` - Advanced PDF/document processing
  - Features:
    - SSL-safe model downloads
    - GPU acceleration support (WSL2/CUDA)
    - PyPdium2 backend for PDF handling
    - OCR capability configuration

---

## 3. Podcast/Audio Generation

### Podcast Creation Agent
- **[backend/app/agents/podcaster/graph.py](backend/app/agents/podcaster/graph.py)**
  - Podcast generation workflow (LangGraph)
  - Node sequence:
    1. `create_podcast_transcript` - Generate podcast script from source content
    2. `create_merged_podcast_audio` - Convert transcript to audio and merge

- **[backend/app/agents/podcaster/nodes.py](backend/app/agents/podcaster/nodes.py)**
  - `create_podcast_transcript()` - LLM-based podcast script generation
    - Uses document summary LLM from search space configuration
    - Generates structured podcast transcript (alternating speakers)
  - `create_merged_podcast_audio()` - Audio synthesis and merging
    - Converts transcript to audio using TTS service
    - Merges individual speaker audio segments

- **[backend/app/agents/podcaster/state.py](backend/app/agents/podcaster/state.py)**
  - `State` - Workflow state management
  - `PodcastTranscripts` - Structured podcast content model
  - `PodcastTranscriptEntry` - Individual podcast segments

- **[backend/app/agents/podcaster/prompts.py](backend/app/agents/podcaster/prompts.py)**
  - `get_podcast_generation_prompt()` - System prompts for podcast generation

- **[backend/app/agents/podcaster/utils.py](backend/app/agents/podcaster/utils.py)**
  - `get_voice_for_provider()` - Voice selection for different TTS providers

- **[backend/app/agents/podcaster/configuration.py](backend/app/agents/podcaster/configuration.py)**
  - `Configuration` - Pipeline configuration for podcast generation

### TTS (Text-to-Speech)
- **[backend/app/services/kokoro_tts_service.py](backend/app/services/kokoro_tts_service.py)**
  - `KokoroTTSService` - Kokoro TTS implementation
  - Supported languages:
    - American English ('a'), British English ('b'), Spanish ('e'), French ('f')
    - Hindi ('h'), Italian ('i'), Japanese ('j'), Portuguese ('p'), Mandarin ('z')
  - Methods:
    - `generate_speech()` - Convert text to speech with voice selection
    - Voice support: af_heart and custom voice tensors
    - Speed control parameter
    - Async execution with thread pool

### Speech-to-Text (STT)
- **[backend/app/services/stt_service.py](backend/app/services/stt_service.py)**
  - Audio transcription service (used in ETL pipeline)

---

## 4. Document Management

### Document Storage & Schema
- **[backend/app/db.py](backend/app/db.py)**
  - Database models including:
    - `Document` - Main document model with embedding column
      - Fields: `id`, `title`, `source_markdown`, `embedding` (Vector), `status`, `created_at`, `updated_at`
    - `Chunk` - Document chunks with individual embeddings
      - Fields: `id`, `document_id`, `content`, `embedding` (Vector)
    - `DocumentVersion` - Version history
    - `Folder` - Document organization
  - Vector indices:
    - `document_vector_index` - HNSW index on documents for fast similarity search
    - `chucks_vector_index` - HNSW index on chunks for fast similarity search
  - Search spaces for grouping documents (multi-tenant support)

### Document Upload Routes
- **[backend/app/routes/documents_routes.py](backend/app/routes/documents_routes.py)**
  - POST `/documents` - Create documents (supports multiple document types):
    - FILE - File uploads
    - EXTENSION - Web extension data
    - YOUTUBE_VIDEO - YouTube URLs
    - WEB_PAGE - Web page URLs
    - CONFLUENCE - Confluence imports
    - GOOGLE_DRIVE - Google Drive files
    - And more connector-specific types
  - Document processing via background tasks (Celery)

---

## 5. Composio Connector Setup

### Composio Service
- **[backend/app/services/composio_service.py](backend/app/services/composio_service.py)**
  - `ComposioService` - Main Composio integration service
  - Configuration:
    - API key from `config.COMPOSIO_API_KEY`
    - File download directory management
  - Methods:
    - `is_enabled()` - Check if Composio is configured
    - `list_available_toolkits()` - Get available integrations
  - Supported toolkits (Phase 1 - indexable):
    - Google Drive (`googledrive`)
    - Gmail (`gmail`)
    - Google Calendar (`googlecalendar`)
    - Slack, Notion, GitHub (listed but non-indexable in Phase 1)

### Composio Connector Base
- **[backend/app/connectors/composio_connector.py](backend/app/connectors/composio_connector.py)**
  - `ComposioConnector` - Base class for toolkit-specific connectors
  - Handles:
    - OAuth connection management
    - Toolkit ID tracking
    - Connected account ID from Composio
    - Entity ID generation (vocalaize_<user_id>)
  - Methods:
    - `get_toolkit_id()` - Get configured toolkit
    - `get_connected_account_id()` - Get OAuth account
    - `is_indexable()` - Check if indexing is supported

### Composio-Specific Connectors
- **Google Drive Connector** - `backend/app/connectors/google_drive/`
- **Gmail Connector** - `backend/app/connectors/gmail/`
- **Google Calendar Connector** - `backend/app/connectors/google_calendar_connector.py`
- And other toolkit-specific implementations

### Composio Routes
- **[backend/app/routes/composio_routes.py](backend/app/routes/composio_routes.py)**
  - OAuth authentication and connection management endpoints
  - Toolkit availability endpoints

---

## 6. LiteLLM Usage

### LLM Router Service
- **[backend/app/services/llm_router_service.py](backend/app/services/llm_router_service.py)**
  - `LLMRouterService` - Singleton service for LiteLLM Router
  - Features:
    - **Auto Mode** (ID: 0) - Load balancing across multiple LLM providers
    - **Rate limit management** - Automatic cooldowns when limits exceeded
    - **Failover** - Automatic retry with alternative models
    - **Usage-based routing** - Distributes requests across providers
  - Provider mapping:
    - OPENAI, ANTHROPIC, GROQ, COHERE, GOOGLE (Gemini)
    - AZURE_OPENAI, OPENROUTER, BEDROCK, VERTEX_AI
    - And 20+ other providers
  - Methods:
    - `invoke()` - Synchronous LLM call
    - `ainvoke()` - Asynchronous LLM call
    - Dynamic model fallback on errors

  - `ChatLiteLLMRouter` - LangChain integration for router
  - `get_auto_mode_llm()` - Get router-backed LLM instance
  - `is_auto_mode()` - Detect auto mode configuration

### LLM Service
- **[backend/app/services/llm_service.py](backend/app/services/llm_service.py)**
  - `get_global_llm_config()` - Retrieve global LLM configurations (negative IDs)
  - Auto mode configuration (ID: 0)
  - `validate_llm_config()` - Test LLM configuration with API call
  - `get_agent_llm()` - Get search space-specific LLM
  - `get_document_summary_llm()` - Get LLM for document summarization
  - Role-based LLM selection:
    - AGENT - Chat/conversation operations
    - DOCUMENT_SUMMARY - Document summarization

### LLM Configuration
- **[backend/app/config/global_llm_config.example.yaml](backend/app/config/global_llm_config.example.yaml)**
  - Global LLM configurations template
  - Router settings for load balancing:
    - `routing_strategy` - usage-based-routing (default), simple-shuffle, least-busy, latency-based-routing
    - `num_retries` - Retry count for failed requests
    - `allowed_fails` - Failure threshold before cooldown
    - `cooldown_time` - Recovery time after threshold
  - Example configurations for:
    - OpenAI GPT-4, GPT-3.5
    - Anthropic Claude 3
    - Azure OpenAI
    - DeepSeek, Mistral, Groq, and others
  - Per-model settings:
    - API keys and base URLs
    - RPM/TPM rate limits
    - LiteLLM parameters (temperature, max_tokens)
    - Custom system instructions
    - Citations enabled/disabled

### Config Initialization
- **[backend/app/config/__init__.py](backend/app/config/__init__.py)**
  - `load_global_llm_configs()` - Load from YAML
  - `load_router_settings()` - Load routing strategy configuration
  - Embedding model initialization:
    - `config.embedding_model_instance` - AutoEmbeddings instance
  - Chunker initialization:
    - `config.chunker_instance` - RecursiveChunker
    - `config.code_chunker_instance` - CodeChunker for code files
  - Reranker initialization:
    - `config.reranker_instance` - Reranker for result reranking

---

## 7. Chat & Agent Routes

### New Chat Routes
- **[backend/app/routes/new_chat_routes.py](backend/app/routes/new_chat_routes.py)**
  - Chat conversation management
  - ThreadHistoryAdapter pattern for assistant-ui:
    - GET `/threads` - List chat threads
    - POST `/threads` - Create new thread
    - GET `/threads/{thread_id}` - Load thread with messages
    - PUT `/threads/{thread_id}` - Update thread
    - DELETE `/threads/{thread_id}` - Delete thread
    - POST `/threads/{thread_id}/messages` - Add message
  - Streaming responses for real-time chat
  - Background sandbox management

---

## 8. Key Database Tables (Vector Support)

- **Document**: Full-text search + vector embedding
- **Chunk**: Individual text chunks with embeddings
- **SearchSpace**: Namespace for document collections
- **DocumentVersion**: Version history
- **NewChatThread**: Chat conversation threads
- **NewChatMessage**: Chat messages with role tracking

All use PostgreSQL with pgvector extension for HNSW indices.

---

## 9. Key Configuration Files

- **[backend/app/config/global_llm_config.example.yaml](backend/app/config/global_llm_config.example.yaml)** - LLM router and model configuration
- **[backend/app/config/model_list_fallback.json](backend/app/config/model_list_fallback.json)** - Fallback model list
- **[backend/pyproject.toml](backend/pyproject.toml)** - Python dependencies and project metadata

---

## 10. Integration Points Summary

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| **RAG** | Search and retrieval | chunks_hybrid_search.py, documents_hybrid_search.py |
| **Indexing** | Document processing pipeline | indexing_pipeline_service.py, document_chunker.py, document_embedder.py |
| **Embeddings** | Vector generation | document_embedder.py, config/embeddings |
| **Reranking** | Result ranking | reranker_service.py |
| **TTS/Audio** | Podcast generation | kokoro_tts_service.py, agents/podcaster/ |
| **ETL** | File extraction | etl_pipeline_service.py, docling_service.py |
| **Connectors** | Data sources | composio_connector.py, various toolkit connectors |
| **LLM Router** | Load balancing | llm_router_service.py, global_llm_config.yaml |
| **Chat** | Conversation management | new_chat_routes.py |

