"""FastAPI backend for LLM Council."""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import json
import asyncio

from . import storage
from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings

app = FastAPI(title="LLM Council API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""
    pass


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str
    council_members: Optional[List[str]] = None
    chairman_model: Optional[str] = None


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    message_count: int


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "LLM Council API"}


@app.get("/api/models/free")
async def get_free_models_endpoint():
    """Get list of available free models from OpenRouter."""
    from .openrouter import get_free_models
    return await get_free_models()


@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations():
    """List all conversations (metadata only)."""
    return storage.list_conversations()


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation."""
    conversation_id = str(uuid.uuid4())
    conversation = storage.create_conversation(conversation_id)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all its messages."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        # Auto-create for new Convex IDs on GET as well
        print(f"[Auto-create-GET] Conversation {conversation_id} not found, creating...")
        conversation = storage.create_conversation(conversation_id)
    return conversation


@app.post("/api/conversations/{conversation_id}/message")
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    x_openrouter_key: Optional[str] = Header(None, alias="X-OpenRouter-Key")
):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    
    Note: This endpoint does NOT persist messages - Convex handles persistence.
    Pass your OpenRouter API key in the X-OpenRouter-Key header to use BYOK.
    """
    # Run the 3-stage council process with user's API key
    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        request.content,
        council_members=request.council_members,
        chairman_model=request.chairman_model,
        api_key=x_openrouter_key
    )

    # Return the complete response with metadata (no persistence)
    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata
    }


@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(
    conversation_id: str,
    request: SendMessageRequest,
    x_openrouter_key: Optional[str] = Header(None, alias="X-OpenRouter-Key")
):
    """
    Send a message and stream the 3-stage council process.
    Returns Server-Sent Events as each stage completes.
    
    Note: This endpoint does NOT persist messages - Convex handles persistence.
    Pass your OpenRouter API key in the X-OpenRouter-Key header to use BYOK.
    """
    # Capture api_key for closure
    api_key = x_openrouter_key

    # Use provided members or fallback to default
    from .config import COUNCIL_MODELS
    council_members = request.council_members or COUNCIL_MODELS

    async def event_generator():
        try:
            # Validate quorum
            if len(council_members) < 1:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Council requires at least 1 member.'})}\n\n"
                return

            # Start title generation in parallel (don't await yet)
            title_task = None
            title_task = asyncio.create_task(generate_conversation_title(request.content, api_key=api_key))

            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content, council_members, api_key=api_key)

            # Check quorum after response
            if len(stage1_results) < 1:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Insufficient council quorum: 0 models responded.'})}\n\n"
                return

            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results, council_members, api_key=api_key)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(
                request.content,
                stage1_results,
                stage2_results,
                chairman_model=request.chairman_model,
                api_key=api_key
            )
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Wait for title generation and emit event (Convex handles persistence)
            if title_task:
                title = await title_task
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            # Send completion event (no persistence - Convex handles it)
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
