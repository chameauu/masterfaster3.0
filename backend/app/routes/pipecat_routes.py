"""
Pipecat WebRTC Routes.

FastAPI routes for Pipecat voice service with WebRTC transport.
"""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.voice.pipecat_service import PipecatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pipecat", tags=["pipecat"])


@router.websocket("/ws")
async def pipecat_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for Pipecat voice streaming.

    This endpoint handles:
    - WebRTC signaling
    - Audio streaming (bidirectional)
    - Session management

    The pipeline currently echoes audio back (tracer bullet).
    Future iterations will add VAD, STT, LLM, and TTS.
    """
    await websocket.accept()
    logger.info("Pipecat WebSocket connection established")

    service = PipecatService()

    try:
        # Start Pipecat service with WebSocket
        await service.start(websocket)

        # Note: service.start() sets up the pipeline but doesn't block
        # In production, we'll need to handle the pipeline lifecycle properly
        # For now, we keep the connection open

        logger.info("Pipecat service started, keeping connection alive")

        # Keep connection alive until client disconnects
        # The pipeline will handle audio streaming automatically
        while service.is_running:
            try:
                # Wait for messages (pipeline handles audio frames)
                data = await websocket.receive_text()
                logger.debug(f"Received WebSocket message: {data[:100]}...")
            except WebSocketDisconnect:
                logger.info("Client disconnected")
                break

    except WebSocketDisconnect:
        logger.info("Pipecat WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in Pipecat WebSocket: {e}", exc_info=True)
    finally:
        # Clean up service
        await service.stop()
        logger.info("Pipecat service stopped")


@router.get("/health")
async def pipecat_health():
    """Health check endpoint for Pipecat service."""
    return {
        "status": "ok",
        "service": "pipecat",
        "message": "Pipecat service is running",
        "version": "0.0.108",
    }
