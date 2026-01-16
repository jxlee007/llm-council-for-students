"""FastAPI backend for LLM Council.

This API provides LLM computation endpoints only. All data persistence
is handled by Convex on the client side.
"""

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio

from .council import (
    run_full_council,
    generate_conversation_title,
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final,
    calculate_aggregate_rankings,
)
from .errors import CouncilException, APIError, ErrorCode

app = FastAPI(title="LLM Council API", version="1.0.0")

# CORS configuration - restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Error Handling
# ============================================================================

@app.exception_handler(CouncilException)
async def council_exception_handler(request: Request, exc: CouncilException):
    """Handle structured council exceptions."""
    status_code = 400
    if exc.code in [ErrorCode.INTERNAL_ERROR, ErrorCode.PROVIDER_ERROR]:
        status_code = 500
    elif exc.code == ErrorCode.RATE_LIMIT_EXCEEDED:
        status_code = 429
    
    return JSONResponse(
        status_code=status_code,
        content=APIError(
            error_code=exc.code,
            message=exc.message,
            details=exc.details
        ).model_dump()
    )


# ============================================================================
# Request/Response Models
# ============================================================================

class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str
    council_members: Optional[List[str]] = None
    chairman_model: Optional[str] = None


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "LLM Council API", "version": "1.0.0"}


@app.get("/api/models/free")
async def get_free_models_endpoint():
    """Get list of available free models from OpenRouter."""
    from .openrouter import get_free_models
    return await get_free_models()


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
    if not x_openrouter_key:
        raise CouncilException(
            code=ErrorCode.MISSING_API_KEY,
            message="OpenRouter API key is required. Please configure your API key in Settings."
        )
    
    try:
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
    except CouncilException:
        raise
    except Exception as e:
        raise CouncilException(
            code=ErrorCode.INTERNAL_ERROR,
            message="Council processing failed. Please try again.",
            details={"original_error": str(e)}
        )


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
    # Validate API key upfront
    if not x_openrouter_key:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": ErrorCode.MISSING_API_KEY,
                "message": "OpenRouter API key is required. Please configure your API key in Settings."
            }
        )
    
    # Capture api_key for closure
    api_key = x_openrouter_key

    # Use provided members or fallback to default
    from .config import COUNCIL_MODELS
    council_members = request.council_members or COUNCIL_MODELS

    async def event_generator():
        try:
            # Validate quorum
            if len(council_members) < 1:
                yield f"data: {json.dumps({'type': 'error', 'error_code': ErrorCode.INVALID_REQUEST, 'message': 'Council requires at least 1 member.'})}\n\n"
                return

            # Start title generation in parallel (don't await yet)
            title_task = asyncio.create_task(generate_conversation_title(request.content, api_key=api_key))

            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content, council_members, api_key=api_key)

            # Check quorum after response
            if len(stage1_results) < 1:
                yield f"data: {json.dumps({'type': 'error', 'error_code': ErrorCode.MODEL_UNAVAILABLE, 'message': 'No models responded. Please check your API key and try again.'})}\n\n"
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
            # Send error event with structured error code
            error_code = ErrorCode.INTERNAL_ERROR
            message = "Council processing failed. Please try again."
            
            error_str = str(e).lower()
            if "api key" in error_str or "unauthorized" in error_str or "401" in error_str:
                error_code = ErrorCode.INVALID_API_KEY
                message = "Invalid API key. Please check your OpenRouter API key in Settings."
            elif "rate limit" in error_str or "429" in error_str:
                error_code = ErrorCode.RATE_LIMIT_EXCEEDED
                message = "Rate limit exceeded. Please wait before trying again."
            elif "timeout" in error_str:
                error_code = ErrorCode.TIMEOUT
                message = "Request timed out. Please try again."
            
            yield f"data: {json.dumps({'type': 'error', 'error_code': error_code, 'message': message})}\n\n"

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
