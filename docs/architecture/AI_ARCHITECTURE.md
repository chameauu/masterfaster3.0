# VocalAIze AI Architecture: RAG, Indexing & LLM Integration

> Deep dive into VocalAIze's AI-powered backend: Retrieval-Augmented Generation, document indexing, podcast generation, and LLM orchestration with LiteLLM.

**Last Updated:** April 10, 2026  
**Version:** 0.0.14  
**Focus:** AI/ML Components

---

## 📌 Table of Contents

1. [System Overview](#system-overview)
2. [RAG (Retrieval-Augmented Generation)](#rag-system)
3. [Indexing Pipeline](#indexing-pipeline)
4. [Document Management](#document-management)
5. [Podcast Generation](#podcast-generation)
6. [Composio Connectors](#composio-connectors)
7. [LiteLLM Router](#litellm-router)
8. [Integration Flow](#integration-flow)

---

## System Overview

VocalAIze is a **Retrieval-Augmented Generation (RAG) platform** that combines:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER QUERY (Voice/Text)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │  LiteLLM Router (LLM Selection)  │
         │  • Automatic failover             │
         │  • Load balancing (25+ providers)│
         │  • Rate limit handling            │
         └───────────────┬──────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │   RAG Retriever (Hybrid Search)  │
         │  • Vector search (pgvector)      │
         │  • Keyword search (Elasticsearch)│
         │  • Result reranking               │
         └───────────────┬──────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │  Context Building & Augmentation  │
         │  • Retrieved documents            │
         │  • Document metadata              │
         │  • Search space filtering         │
         └───────────────┬──────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │    LLM Response Generation       │
         │  • Chat completions               │
         │  • Streaming responses            │
         │  • Function calling               │
         └───────────────┬──────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │  Output Processing               │
         │  • Podcast generation (TTS)      │
         │  • Video presentation            │
         │  • Document synthesis             │
         └───────────────┬──────────────────┘
                         │
        ┌────────────────▼─────────────────┐
        │       USER RECEIVES RESPONSE     │
        │   (Text/Audio/Video/PDF)         │
        └────────────────────────────────────┘
```

### **Key Technologies**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Embeddings** | Sentence Transformers | Convert text to vectors (384-1024 dims) |
| **Vector DB** | PostgreSQL + pgvector | Store & search vectors with HNSW |
| **Full-Text Search** | Elasticsearch | Keyword-based document search |
| **Reranking** | FlashRank | Re-score results by relevance |
| **Chunking** | chonkie | Smart document chunking |
| **LLM Orchestration** | LiteLLM | Multi-provider LLM routing |
| **Text-to-Speech** | Kokoro TTS | Generate podcasts in 9 languages |
| **External Integrations** | Composio | Connect to 100+ services |

---

## RAG System

### **Architecture**

The RAG system uses **hybrid search** combining vector and keyword retrieval:

```python
# Hybrid Search Flow
User Query
  ↓
embedding_model.embed(query_text)  # → Dense vector
  ↓
┌─────────────────────────────────┐
│  Parallel Search Execution      │
├─────────────────────────────────┤
│ Vector Search:                  │
│  SELECT * FROM chunks           │
│  WHERE embedding <-> query_vec  │
│  ORDER BY distance              │
│  LIMIT top_k                    │
│                                 │
│ Keyword Search:                 │
│  GET /elasticsearch/chunks      │
│  MATCH query_text               │
│  LIMIT top_k                    │
└─────────────────────────────────┘
  ↓
Combine & Deduplicate Results
  ↓
Reranker.score(query, results)  # FlashRank
  ↓
Return Top-K Most Relevant Chunks
```

### **Retriever Components**

#### **1. ChunksHybridSearchRetriever** (`retriever/chunks_hybrid_search.py`)

Searches at the **chunk level** (detailed segments):

```python
class ChucksHybridSearchRetriever:
    async def vector_search(
        self,
        query_text: str,
        top_k: int,
        search_space_id: int,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list:
        """
        Performs vector similarity search on chunks.
        
        Returns:
            - Chunks with similarity scores
            - Document metadata (title, source, date)
            - Chunk metadata (page number, section)
        """
        # 1. Generate query embedding
        embedding = embedding_model.embed(query_text)
        
        # 2. Vector search via PostgreSQL pgvector
        nearby_chunks = await db.vector_search(
            embedding,
            search_space_id=search_space_id,
            top_k=top_k,
            filters={
                'start_date': start_date,
                'end_date': end_date
            }
        )
        
        return nearby_chunks
    
    async def keyword_search(
        self,
        query_text: str,
        search_space_id: int,
    ) -> list:
        """
        Full-text search using Elasticsearch.
        """
        results = elasticsearch.search(
            index="chunks",
            query={
                "match": {
                    "content": query_text,
                    "boost_phrase": true
                }
            },
            filter={"search_space_id": search_space_id}
        )
        
        return results
    
    async def hybrid_search(
        self,
        query_text: str,
        top_k: int,
        search_space_id: int,
    ) -> list:
        """
        Combine vector + keyword search results.
        """
        # Run both in parallel
        vector_results, keyword_results = await asyncio.gather(
            self.vector_search(query_text, top_k, search_space_id),
            self.keyword_search(query_text, search_space_id)
        )
        
        # Merge & deduplicate
        merged = self._merge_results(vector_results, keyword_results)
        
        # Rerank by relevance
        reranked = reranker_service.rerank(
            query_text,
            merged,
            top_k=top_k
        )
        
        return reranked
```

**Use Case:** Finding specific information within documents (e.g., "Find all mentions of photosynthesis")

#### **2. DocumentHybridSearchRetriever** (`retriever/documents_hybrid_search.py`)

Searches at the **document level** (whole documents):

```python
class DocumentHybridSearchRetriever:
    async def search(
        self,
        query_text: str,
        search_space_id: int,
        top_k: int = 5,
    ) -> list:
        """
        Find relevant documents (not chunks).
        
        Returns:
            - Full documents with relevance scores
            - Document statistics (chunk count, date)
            - Document type (PDF, email, webpage, etc.)
        """
        # Similar to chunk search but returns entire documents
```

**Use Case:** Browsing which documents are relevant (e.g., "Which books discuss biology?")

### **Reranker Service** (`services/reranker_service.py`)

Uses **FlashRank** to re-score search results:

```python
class RerankerService:
    def __init__(self):
        # Initialize FlashRank model
        self.reranker = Reranker(
            model="ms-marco-TinyBERT-L-12",
            batch_size=128,
            device="cuda"  # GPU acceleration
        )
    
    def rerank(
        self,
        query: str,
        documents: list,
        top_k: int = 5,
    ) -> list:
        """
        Re-score documents by relevance using cross-encoder.
        
        Args:
            query: Search query
            documents: List of (text, metadata) tuples
            top_k: Return top K documents
        
        Returns:
            Sorted list by relevance score (highest first)
        """
        # 1. Extract text from documents
        texts = [doc['content'] for doc in documents]
        
        # 2. Score each doc against query
        scores = self.reranker.score([query] * len(texts), texts)
        
        # 3. Sort by score
        ranked = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [(doc, score) for doc, score in ranked[:top_k]]
```

**Key Insight:** Reranking improves result quality by 10-25% at minimal computational cost.

---

## Indexing Pipeline

The **Indexing Pipeline** converts raw documents into searchable, semantically indexed chunks.

### **Pipeline Architecture**

```
Document Upload
    ↓
┌─────────────────────────────────────┐
│     Document Type Detection         │
│  (PDF, Email, Webpage, Confluence)  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  ETL Processing (Extract Content)   │
│  • Docling: PDFs, images            │
│  • Unstructured: General files      │
│  • Web scraper: URLs                │
│  • LlamaCloud: Complex documents    │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Document Hashing & Deduplication   │
│  • Content hash for change detection│
│  • Skip if unchanged                │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Document Summarization             │
│  • LLM-generated titles/summaries   │
│  • Metadata extraction              │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Smart Chunking                     │
│  • RecursiveChunker: General text   │
│  • CodeChunker: Source code         │
│  • Preserves context & structure    │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Embedding Generation               │
│  • Batch process chunks             │
│  • GPU acceleration                 │
│  • 384-1024 dimensional vectors     │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Persistence to Database            │
│  • Insert chunks with embeddings    │
│  • Create HNSW indices              │
│  • Update document status           │
└────────────┬────────────────────────┘
             ↓
Document Ready for Search
```

### **IndexingPipelineService** (`indexing_pipeline/indexing_pipeline_service.py`)

```python
class IndexingPipelineService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.document_chunker = DocumentChunker()
        self.document_embedder = DocumentEmbedder()
        self.document_summarizer = DocumentSummarizer()
    
    async def index_document(
        self,
        document_id: int,
        connector_document: ConnectorDocument,
        search_space_id: int,
        retry_count: int = 0,
    ) -> None:
        """
        Complete indexing pipeline for a single document.
        """
        try:
            # 1. GET DOCUMENT CONTENT
            content_hash = compute_content_hash(connector_document.content)
            existing = await self._get_existing_document(document_id)
            
            # Check if document changed
            if existing and existing.content_hash == content_hash:
                logger.info(f"Document {document_id} unchanged, skipping")
                return
            
            # 2. EXTRACT & SUMMARIZE
            summary = await self.document_summarizer.summarize(
                connector_document.content,
                connector_document.title
            )
            
            # 3. CHUNK THE DOCUMENT
            chunks = self.document_chunker.chunk(
                content=connector_document.content,
                content_type=connector_document.doc_type,
                metadata={
                    'source': connector_document.source,
                    'date': connector_document.date,
                    'page_count': connector_document.page_count
                }
            )
            
            logger.info(f"Created {len(chunks)} chunks from document {document_id}")
            
            # 4. GENERATE EMBEDDINGS
            embeddings = await self.document_embedder.embed_batch(
                [chunk.text for chunk in chunks],
                batch_size=32
            )
            
            # 5. PERSIST TO DATABASE
            await attach_chunks_to_document(
                self.db_session,
                document_id,
                chunks,
                embeddings,
                search_space_id
            )
            
            # 6. UPDATE STATUS
            await self._update_document_status(
                document_id,
                DocumentStatus.READY,
                chunk_count=len(chunks)
            )
            
            logger.info(f"Successfully indexed document {document_id}")
        
        except Exception as e:
            # Handle errors with retries
            await self._handle_indexing_error(
                document_id,
                e,
                retry_count
            )
```

### **Smart Chunking Strategy**

#### **RecursiveChunker** (General Text)

```python
# Splits recursively on:
# 1. Paragraphs (")
# 2. Sentences (". ")
# 3. Words (" ")
# 4. Characters (fallback)

# Configuration
chunk_size = 512  # tokens per chunk
overlap = 128     # overlap between chunks

example_chunks = [
    "Chapter 1 discusses photosynthesis, the process...",
    "...energy production in plants. Photosynthesis occurs...",
    "...in chloroplasts, using sunlight..."
]
```

#### **CodeChunker** (Source Code)

```python
# Preserves code structure:
# 1. Split on function definitions
# 2. Keep imports & dependencies
# 3. Preserve indentation & scope

# Example
chunks = [
    "from typing import List\n\ndef calculate(x: int) -> int:\n    return x * 2",
    "\ndef main():\n    result = calculate(10)\n    print(result)",
]
```

### **Document Types Handled**

| Type | Extractor | Use Case |
|------|-----------|----------|
| **PDF** | Docling | Scientific papers, reports |
| **Email** | Gmail API | Email conversations |
| **Confluence** | Confluence API | Knowledge bases, wikis |
| **Notion** | Notion API | Note databases |
| **Slack** | Slack API | Channel conversations |
| **GitHub** | GitHub API | Code repos, issues |
| **Web** | Firecrawl | Websites, blogs |
| **YouTube** | YouTube API | Video transcripts |
| **Code** | Code Parser | Source code files |

---

## Document Management

### **Database Schema**

```python
# Core tables
Document
  ├── id: int (primary key)
  ├── title: str
  ├── content: str (full text)
  ├── doc_type: DocumentType (enum: pdf, email, webpage, etc.)
  ├── source: str (origin identifier)
  ├── created_at: datetime
  ├── updated_at: datetime
  ├── status: DocumentStatus (processing, ready, failed)
  ├── search_space_id: int (FK)
  └── connector_id: int (FK to source connector)

Chunk
  ├── id: int
  ├── document_id: int (FK)
  ├── content: str (chunk text)
  ├── embedding: vector (1024 dims)
  ├── sequence_number: int (order in document)
  ├── metadata: json (page, section, etc.)
  └── created_at: datetime

DocumentVersion
  ├── id: int
  ├── document_id: int
  ├── version_number: int
  ├── content_hash: str (for detecting changes)
  └── created_at: datetime

SearchSpace
  ├── id: int
  ├── name: str
  ├── user_id: int
  └── documents: [Document] (1:many)

Folder
  ├── id: int
  ├── name: str
  ├── search_space_id: int
  └── documents: [Document] (hierarchical)
```

### **Document Upload & Processing** (`routes/documents_routes.py`)

```python
@router.post("/documents")
async def upload_document(
    file: UploadFile,
    search_space_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Upload and index a new document.
    
    Flow:
    1. Store file temporarily
    2. Create database record
    3. Queue indexing task (async via Celery)
    4. Return document ID
    """
    # 1. SAVE FILE
    file_path = await save_upload_file(file)
    content = await read_file_content(file_path)
    
    # 2. CREATE DATABASE RECORD
    document = Document(
        title=file.filename,
        doc_type=detect_doc_type(file.filename),
        source=file_path,
        status=DocumentStatus.PROCESSING,
        search_space_id=search_space_id,
        content=content[:10000]  # Preview
    )
    db.add(document)
    await db.commit()
    
    # 3. QUEUE INDEXING (async)
    indexing_task.delay(
        document_id=document.id,
        search_space_id=search_space_id
    )
    
    return {
        "document_id": document.id,
        "status": "queued_for_indexing"
    }

@router.get("/documents/{document_id}/status")
async def get_document_status(
    document_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """Poll for indexing progress."""
    document = await db.get(Document, document_id)
    
    return {
        "id": document.id,
        "status": document.status,
        "chunk_count": len(document.chunks),
        "progress": "100%" if document.status == "ready" else "50%"
    }
```

### **Document Deletion & Cleanup**

```python
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """Cascade delete document and all chunks."""
    # 1. Delete all embeddings & chunks
    await db.execute(
        delete(Chunk).where(Chunk.document_id == document_id)
    )
    
    # 2. Delete document record
    await db.execute(
        delete(Document).where(Document.id == document_id)
    )
    
    await db.commit()
```

---

## Podcast Generation

### **Architecture**

Converts any document or chat response into **audio podcasts** using LLM + TTS:

```
Input (Document/Chat)
    ↓
LLM: Generate Transcript
  • Natural narration
  • Multi-paragraph structure
  • Speaker variation
    ↓
Split into Segments
  • One sentence per TTS call
  • Preserve pauses & emphasis
    ↓
TTS: Generate Audio
  • Kokoro TTS service
  • 9 language support
    ↓
Merge Audio Segments
  • Concatenate with transitions
  • Add background music (optional)
    ↓
Store & Return
  • MP3/WAV file
  • Stream to client
```

### **Podcast Agent** (`agents/podcaster/`)

Uses **LangGraph** for multi-step orchestration:

```python
class PodcasterAgent:
    """
    LangGraph-based agent for podcast generation.
    
    States:
    1. analyze_content - Understand document
    2. generate_transcript - Create script
    3. split_segments - Break into chunks
    4. generate_audio - TTS conversion
    5. merge_audio - Combine segments
    """
    
    def __init__(self, llm, tts_service):
        self.llm = llm  # LiteLLM router
        self.tts = tts_service  # Kokoro
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build LangGraph workflow."""
        workflow = StateGraph(PodcastState)
        
        # Add nodes (tasks)
        workflow.add_node("analyze", self._analyze_content)
        workflow.add_node("generate", self._generate_transcript)
        workflow.add_node("split", self._split_segments)
        workflow.add_node("tts", self._generate_audio)
        workflow.add_node("merge", self._merge_segments)
        
        # Add edges (transitions)
        workflow.add_edge("analyze", "generate")
        workflow.add_edge("generate", "split")
        workflow.add_edge("split", "tts")
        workflow.add_edge("tts", "merge")
        workflow.add_edge("merge", END)
        
        return workflow.compile()
    
    async def generate_podcast(
        self,
        document_content: str,
        style: str = "conversational",  # or "professional", "storytelling"
        language: str = "en",
    ) -> bytes:
        """
        Generate podcast from document.
        
        Args:
            document_content: Text to convert
            style: Narration style
            language: Output language (en, fr, es, etc.)
        
        Returns:
            Audio bytes (MP3)
        """
        state = {
            "content": document_content,
            "style": style,
            "language": language,
            "transcript": None,
            "segments": None,
            "audio_segments": None,
            "final_audio": None,
        }
        
        # Run the graph
        result = await self.graph.ainvoke(state)
        
        return result["final_audio"]
    
    async def _generate_transcript(self, state):
        """LLM: Create natural podcast transcript."""
        prompt = f"""
        Convert this document into a natural podcast script.
        Style: {state['style']}
        
        Document:
        {state['content'][:2000]}...
        
        Generate a conversational transcript suitable for audio narration.
        Use clear paragraphs (each ~30 seconds of speech).
        """
        
        transcript = await self.llm.ainvoke(
            prompt,
            temperature=0.7
        )
        
        state["transcript"] = transcript
        return state
    
    async def _split_segments(self, state):
        """Split transcript into TTS-friendly sentences."""
        text = state["transcript"]
        
        # Split on sentence boundaries
        sentences = text.split(". ")
        
        # Merge short sentences
        segments = []
        current = ""
        for sentence in sentences:
            current += sentence + ". "
            if len(current) > 100:  # ~5-10 seconds of speech
                segments.append(current)
                current = ""
        
        if current:
            segments.append(current)
        
        state["segments"] = segments
        return state
    
    async def _generate_audio(self, state):
        """TTS: Convert each segment to audio."""
        segments = state["segments"]
        language = state["language"]
        
        # Parallel TTS generation
        audio_segments = await asyncio.gather(*[
            self.tts.synthesize(
                text=segment,
                language=language,
                voice="default"
            )
            for segment in segments
        ])
        
        state["audio_segments"] = audio_segments
        return state
    
    async def _merge_segments(self, state):
        """Merge audio segments into single file."""
        audio_segments = state["audio_segments"]
        
        # Concatenate all audio
        merged = self._concatenate_audio(audio_segments)
        
        # Add transitions/silence
        with_transitions = self._add_transitions(merged)
        
        state["final_audio"] = with_transitions
        return state
```

### **Kokoro TTS Service** (`services/kokoro_tts_service.py`)

```python
class KokoroTTSService:
    """
    Local TTS service supporting 9 languages.
    
    Languages:
    - English (en)
    - Spanish (es)
    - French (fr)
    - German (de)
    - Italian (it)
    - Portuguese (pt)
    - Dutch (nl)
    - Chinese (zh)
    - Japanese (ja)
    """
    
    def __init__(self):
        self.model = Kokoro()  # Load model
        self.voice_samples = {
            "en": "voice_en_default",
            "es": "voice_es_default",
            # ... etc
        }
    
    async def synthesize(
        self,
        text: str,
        language: str = "en",
        voice: str = "default",
        speed: float = 1.0,
    ) -> bytes:
        """
        Convert text to speech.
        
        Args:
            text: Text to synthesize
            language: Language code (en, fr, etc.)
            voice: Voice profile
            speed: Playback speed (0.5 - 2.0)
        
        Returns:
            Audio bytes (WAV format)
        """
        # Load voice sample
        voice_sample = self.voice_samples.get(language, "voice_en_default")
        
        # Generate speech
        audio = self.model.synthesize(
            text,
            voice=voice_sample,
            speed=speed
        )
        
        return audio
```

### **Usage Example**

```python
# In chat response handler
@router.post("/chat/{chat_id}/podcast")
async def generate_podcast(
    chat_id: int,
    language: str = "en",
    db: AsyncSession = Depends(get_async_session),
):
    """Generate podcast from last chat message."""
    # Get chat content
    chat = await db.get(Chat, chat_id)
    last_message = chat.messages[-1]
    
    # Generate podcast
    podcaster = PodcasterAgent(
        llm=get_litellm_router(),
        tts_service=KokoroTTSService()
    )
    
    audio = await podcaster.generate_podcast(
        document_content=last_message.content,
        language=language
    )
    
    return StreamingResponse(
        iter([audio]),
        media_type="audio/mpeg"
    )
```

---

## Composio Connectors

**Composio** provides unified SDK for connecting to 100+ external services.

### **Architecture**

```
VocalAIze App
    ↓
ComposioService (wrapper)
    ↓
Composio SDK
    ↓
┌─────────────────────────────────────┐
│  100+ Integrations                  │
├─────────────────────────────────────┤
│ • Google (Drive, Gmail, Calendar)  │
│ • Microsoft (Teams, OneDrive)       │
│ • Slack, Discord                    │
│ • Notion, Confluence                │
│ • Jira, Linear, GitHub              │
│ • Dropbox, Box                      │
│ • And many more...                  │
└─────────────────────────────────────┘
```

### **ComposioService** (`services/composio_service.py`)

```python
class ComposioService:
    """Unified wrapper for Composio integrations."""
    
    def __init__(self, api_key: str):
        self.client = Composio(api_key=api_key)
        self.supported_integrations = {
            "GOOGLE_DRIVE": GoogleDriveConnector,
            "GMAIL": GmailConnector,
            "SLACK": SlackConnector,
            "NOTION": NotionConnector,
            # ... registered connectors
        }
    
    async def authenticate(
        self,
        integration: str,
        user_id: int,
        auth_code: str = None,
    ):
        """
        OAuth authentication for external service.
        
        Flow:
        1. User clicks "Connect"
        2. Redirected to OAuth provider
        3. Provider returns auth code
        4. Exchange for access token
        5. Store securely in database
        """
        connection = await self.client.authenticate(
            integration=integration,
            auth_code=auth_code
        )
        
        # Store connection
        await save_connection(
            user_id=user_id,
            integration=integration,
            token=connection.access_token,
            refresh_token=connection.refresh_token,
            expires_at=connection.expires_at
        )
```

### **Base Connector Class**

```python
class ComposioConnector(BaseConnector):
    """
    Base class for all Composio-based connectors.
    
    Workflow:
    1. OAuth authentication
    2. Fetch remote data (documents, emails, tasks)
    3. Convert to ConnectorDocument
    4. Index via VocalAIze pipeline
    """
    
    def __init__(
        self,
        user_id: int,
        connection_id: int,
        composio_service: ComposioService,
    ):
        self.user_id = user_id
        self.connection_id = connection_id
        self.composio = composio_service
    
    async def fetch_documents(self) -> list[ConnectorDocument]:
        """Fetch all documents from external service."""
        raise NotImplementedError
    
    async def sync_incremental(
        self,
        since: datetime,
    ) -> list[ConnectorDocument]:
        """
        Fetch only documents modified since timestamp.
        (More efficient than full sync)
        """
        raise NotImplementedError
```

### **Specific Connector Implementations**

#### **Google Drive Connector** (`services/google_drive/`)

```python
class GoogleDriveConnector(ComposioConnector):
    """
    Sync files from Google Drive.
    
    Features:
    - Share to multiple users
    - Folder structure preservation
    - Real-time sync via Pub/Sub
    """
    
    async def fetch_documents(self) -> list[ConnectorDocument]:
        """Get all Drive files."""
        # Use Composio SDK
        files = await self.composio.list_files(
            integration="GOOGLE_DRIVE",
            connection_id=self.connection_id
        )
        
        documents = []
        for file in files:
            # Download file
            content = await self.composio.download_file(
                file_id=file.id
            )
            
            # Create ConnectorDocument
            doc = ConnectorDocument(
                title=file.name,
                content=content,
                source=f"gdrive://{file.id}",
                date=file.modified_time,
                doc_type="pdf" if file.name.endswith(".pdf") else "document"
            )
            documents.append(doc)
        
        return documents
    
    async def sync_incremental(self, since: datetime):
        """Fetch only new/modified files."""
        files = await self.composio.list_files(
            integration="GOOGLE_DRIVE",
            connection_id=self.connection_id,
            modified_after=since
        )
        
        return await self.fetch_documents_by_ids([f.id for f in files])
```

#### **Gmail Connector** (`services/gmail/`)

```python
class GmailConnector(ComposioConnector):
    """Sync emails from Gmail."""
    
    async def fetch_documents(self):
        """Get all emails."""
        emails = await self.composio.list_emails(
            integration="GMAIL",
            connection_id=self.connection_id
        )
        
        documents = []
        for email in emails:
            doc = ConnectorDocument(
                title=email.subject,
                content=f"From: {email.from}\n\n{email.body}",
                source=f"gmail://{email.id}",
                date=email.received_date,
                doc_type="email"
            )
            documents.append(doc)
        
        return documents
```

#### **Notion Connector** (`services/notion/`)

```python
class NotionConnector(ComposioConnector):
    """Sync Notion databases and pages."""
    
    async def fetch_documents(self):
        """Get all Notion pages from databases."""
        databases = await self.composio.list_databases(
            integration="NOTION",
            connection_id=self.connection_id
        )
        
        documents = []
        for db in databases:
            pages = await self.composio.query_database(
                database_id=db.id
            )
            
            for page in pages:
                content = f"Title: {page.title}\n\n{page.body}"
                doc = ConnectorDocument(
                    title=page.title,
                    content=content,
                    source=f"notion://{page.id}",
                    date=page.last_modified,
                    doc_type="notion_page"
                )
                documents.append(doc)
        
        return documents
```

### **Connector Registration & Sync**

```python
# In config/connectors.py
AVAILABLE_CONNECTORS = {
    "google_drive": GoogleDriveConnector,
    "gmail": GmailConnector,
    "notion": NotionConnector,
    "slack": SlackConnector,
    "confluence": ConfluenceConnector,
    "jira": JiraConnector,
    "github": GitHubConnector,
    "linear": LinearConnector,
}

# Background sync task (Celery)
@celery_app.task
def sync_all_connectors(user_id: int):
    """Periodically sync all user's connectors."""
    for connector_name, connector_class in AVAILABLE_CONNECTORS.items():
        try:
            connector = connector_class(user_id=user_id)
            documents = asyncio.run(connector.fetch_documents())
            
            for doc in documents:
                index_document.delay(
                    user_id=user_id,
                    document_data=doc.to_dict()
                )
        except Exception as e:
            logger.error(f"Failed to sync {connector_name}: {e}")
```

---

## LiteLLM Router

**LiteLLM** provides unified interface to 25+ LLM providers with intelligent routing.

### **Router Architecture**

```
User Request (Chat/RAG)
    ↓
┌──────────────────────────────────────────┐
│     LiteLLM Router Selection              │
├──────────────────────────────────────────┤
│ Decision Factors:                         │
│ • Model requirements (speed, quality)    │
│ • Current rate limits & cooldowns        │
│ • Provider costs & quotas                │
│ • User tier (free/pro)                   │
│ • Previous error history                 │
└──────┬───────────────────────────────────┘
       ↓
  ┌─────────────────────────────────────────┐
  │  Route to Best Available Provider        │
  ├─────────────────────────────────────────┤
  │ Try #1: Primary choice                  │
  │   └─ Success? Return response           │
  │   └─ Rate limited? Backoff + retry next │
  │   └─ Error? Try next provider           │
  │                                         │
  │ Try #2: Secondary choice                │
  │ Try #3: Tertiary choice                 │
  │ ...                                     │
  └─────────────────────────────────────────┘
       ↓
Response to User
```

### **LiteLLM Router Service** (`services/llm_router_service.py`)

```python
class LiteLLMRouterService:
    """
    Unified LLM interface with intelligent routing.
    
    Features:
    • Multi-provider load balancing
    • Rate limit detection & cooldown
    • Automatic failover & retries
    • Cost tracking
    • Context window management
    """
    
    def __init__(self, config: LiteLLMConfig):
        self.router = Router(
            model_list=config.model_list,
            fallbacks=config.fallbacks,
            cooldown_time=config.cooldown_time,
            debug_level=config.debug_level,
        )
        self.config = config
    
    async def ainvoke(
        self,
        messages: list[dict],
        model_id: int = 0,  # 0 = AUTO (router decides)
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ):
        """
        Send messages to LLM with automatic routing.
        
        Args:
            messages: Chat messages (role: "system", "user", "assistant")
            model_id: 0=auto, or specific model ID
            temperature: Randomness (0.0-1.0)
            max_tokens: Max output length
            stream: Enable streaming
        
        Returns:
            LLM response (str or async generator if streaming)
        """
        if model_id == 0:
            # Use router for automatic selection
            response = await self.router.acompletion(
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
        else:
            # Use specific model
            response = await self.router.acompletion(
                model=f"model_{model_id}",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
        
        return response
```

### **Provider Configuration** (`config/global_llm_config.yaml`)

```yaml
# LiteLLM Router Configuration

model_list:
  # Primary models (fast, cheap)
  - model_name: "gpt-4o-mini"
    litellm_params:
      model: "gpt-4-turbo"
      api_key: !ENV ${OPENAI_API_KEY}
    max_tokens: 128000
    max_requests_per_minute: 5000
    tpm_limit: 2000000
    priority: 1

  - model_name: "claude-opus"
    litellm_params:
      model: "claude-3-opus-20240229"
      api_key: !ENV ${ANTHROPIC_API_KEY}
    max_tokens: 200000
    tpm_limit: 500000
    priority: 2

  # Fallback models
  - model_name: "gpt-4"
    litellm_params:
      model: "gpt-4"
      api_key: !ENV ${OPENAI_API_KEY}
    priority: 3

  - model_name: "gemini-pro"
    litellm_params:
      model: "gemini-pro"
      api_key: !ENV ${GOOGLE_API_KEY}
    priority: 4

# Routing strategy
router_strategy: "least-busy"  # or "cost-optimized", "speed-optimized"
fallback_order: ["gpt-4o-mini", "claude-opus", "gpt-4", "gemini-pro"]
cooldown_time: 5  # seconds before retrying failed provider
timeout: 30  # seconds per request

# Cost tracking
cost_tracking:
  enable: true
  budget_per_user: 10.0  # dollars/month
  budget_per_request: 1.0  # dollars/request
```

### **Supported Providers** (25+)

```python
PROVIDER_MAP = {
    "OPENAI": "gpt-4-turbo, gpt-4, gpt-3.5-turbo",
    "ANTHROPIC": "claude-3-opus, claude-3-sonnet, claude-opus",
    "GOOGLE": "gemini-pro, gemini-flash",
    "COHERE": "command-r-plus, command-r",
    "GROQ": "mixtral-8x7b, llama2-70b",
    "MISTRAL": "mistral-large, mistral-medium",
    "AZURE_OPENAI": "Azure GPT-4, Azure GPT-3.5",
    "OLLAMA": "Local models (llama, mistral, etc.)",
    "TOGETHER_AI": "Meta-Llama, Mistral",
    "PERPLEXITY": "pplx-api (online search)",
    "VERTEX_AI": "Palm, Gemini",
    # ... 15+ more
}
```

### **Auto Mode (Router-Based Selection)**

```python
# When model_id=0, router automatically selects based on:

def select_best_model(
    query: str,
    required_speed: bool = False,
    required_reasoning: bool = False,
) -> str:
    """
    Intelligent model selection logic.
    """
    
    # For speed-critical operations (chatbot responses)
    if required_speed:
        if available_quota("gpt-3.5-turbo"):
            return "gpt-3.5-turbo"
        elif available_quota("gemini-flash"):
            return "gemini-flash"
        else:
            return fallback_list[0]
    
    # For reasoning tasks (RAG synthesis)
    if required_reasoning:
        if available_quota("gpt-4-turbo"):
            return "gpt-4-turbo"
        elif available_quota("claude-opus"):
            return "claude-opus"
        else:
            return fallback_list[0]
    
    # Default: use least-busy available model
    return router.pick_best_model()
```

### **Usage Examples**

#### **Simple Chat**
```python
# Automatic routing
response = await llm_router.ainvoke(
    messages=[
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "Hello!"}
    ]
)
# Returns: "Hi! How can I help you today?"
```

#### **RAG Context Augmentation**
```python
# Use specific model for quality
response = await llm_router.ainvoke(
    messages=[
        {"role": "system", "content": "You are a research assistant."},
        {"role": "user", "content": question},
        {"role": "assistant", "content": f"Context:\n{retrieved_docs}"}
    ],
    model_id=0,  # Let router choose
    temperature=0.3,  # Lower for factuality
    stream=True  # Stream for real-time feedback
)
```

#### **Error Handling**
```python
try:
    response = await llm_router.ainvoke(messages)
except litellm.exceptions.ContextWindowExceededError:
    # Trim context and retry
    truncated_messages = trim_messages(messages, max_tokens=4000)
    response = await llm_router.ainvoke(truncated_messages)
except litellm.exceptions.RateLimitError:
    # Backoff and retry
    await asyncio.sleep(5)
    response = await llm_router.ainvoke(messages)
```

---

## Integration Flow

### **Complete RAG-Powered Chat Flow**

```
User: "Search my notes about photosynthesis"
                    ↓
        ┌────────────────────────────┐
        │ Parse Intent               │
        │ • Query: "photosynthesis"  │
        │ • Action: search           │
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────────────────┐
        │ Search (Hybrid Retriever)              │
        ├────────────────────────────────────────┤
        │ 1. Embed query (Sentence-Transformers)│
        │ 2. Vector search (pgvector)           │
        │ 3. Keyword search (Elasticsearch)     │
        │ 4. Merge & deduplicate                │
        │ 5. Rerank (FlashRank)                 │
        │                                       │
        │ Results:                              │
        │ - "Photosynthesis is the process..." │
        │ - "Light reactions occur in..."      │
        │ - "Chloroplasts contain..."          │
        └────────────┬───────────────────────────┘
                     ↓
        ┌────────────────────────────────────┐
        │ Build Prompt with Context          │
        ├────────────────────────────────────┤
        │ System: "You are a tutor..."       │
        │ Retrieved docs: [3 chunks]        │
        │ User query: "about photosynthesis"│
        └────────────┬─────────────────────┘
                     ↓
        ┌────────────────────────────────────┐
        │ LiteLLM Router Selection           │
        ├────────────────────────────────────┤
        │ Decision:                          │
        │ • Quality > Speed needed           │
        │ • GPT-4 available? No              │
        │ • Claude available? Yes!           │
        │ → Route to Claude Opus            │
        └────────────┬─────────────────────┘
                     ↓
        ┌────────────────────────────────────────┐
        │ LLM Generation (Claude)                │
        ├────────────────────────────────────────┤
        │ Prompt:                                │
        │   "Based on these notes, explain      │
        │    photosynthesis to a student..."     │
        │                                       │
        │ Response:                             │
        │   "Photosynthesis is how plants      │
        │    convert sunlight into energy.     │
        │    It occurs in two main stages:    │
        │    1. Light reactions...             │
        │    2. Calvin cycle..."              │
        └────────────┬─────────────────────────┘
                     ↓
        ┌────────────────────────────────────┐
        │ Post-Processing                    │
        ├────────────────────────────────────┤
        │ • Add citations                    │
        │ • Format for display               │
        │ • Save to chat history             │
        └────────────┬─────────────────────┘
                     ↓
        ┌────────────────────────────────────┐
        │ Optional: Generate Podcast         │
        │ (Podcast Agent)                    │
        ├────────────────────────────────────┤
        │ 1. LLM: Create narration script   │
        │ 2. Split into sentences           │
        │ 3. TTS: Synthesize audio          │
        │ 4. Merge segments                 │
        │ → Return MP3 file                 │
        └────────────┬─────────────────────┘
                     ↓
        ┌────────────────────────────────────┐
        │ Return to User (Multimodal)        │
        ├────────────────────────────────────┤
        │ • Text response                    │
        │ • Audio podcast (optional)         │
        │ • Source citations                 │
        │ • Related documents                │
        └────────────────────────────────────┘
```

---

## Summary

| Component | Role | Technology | Why It Matters |
|-----------|------|-----------|-----------------|
| **RAG Retriever** | Find relevant documents | Vector + Keyword + Reranking | 90% of quality depends on retrieval |
| **Indexing Pipeline** | Prepare documents | Chunking + Embedding + pgvector | Enables fast semantic search |
| **Document Management** | Store & organize | PostgreSQL + Folders | Multi-tenant document organization |
| **Podcast Generation** | Convert to audio | LLM + TTS + LangGraph | Accessibility & mobile-first UX |
| **Composio Connectors** | Connect to external services | OAuth + 100+ integrations | Unified data ingestion |
| **LiteLLM Router** | Intelligent LLM selection | Multi-provider routing | Cost optimization + reliability |

Together, these components create a **production-grade AI research platform** that is:
- ✅ **Accurate** - Hybrid search + reranking
- ✅ **Fast** - Vector search < 100ms
- ✅ **Scalable** - Async indexing + batch processing
- ✅ **Accessible** - Voice + podcast support
- ✅ **Flexible** - 100+ data sources
- ✅ **Reliable** - Automatic failover & retries
