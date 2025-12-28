"""OpenRouter API client for making LLM requests."""

import httpx
from typing import List, Dict, Any, Optional
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 120.0,
    api_key: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content'
        timeout: Request timeout in seconds
        api_key: Optional OpenRouter API key (uses env var if not provided)

    Returns:
        Response dict with 'content' and optional 'reasoning_details', or None if failed
    """
    # Use provided API key or fall back to environment variable
    effective_key = api_key or OPENROUTER_API_KEY
    
    if not effective_key:
        print(f"Error: No API key provided for model {model}")
        return None

    headers = {
        "Authorization": f"Bearer {effective_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            message = data['choices'][0]['message']

            return {
                'content': message.get('content'),
                'reasoning_details': message.get('reasoning_details')
            }

    except Exception as e:
        print(f"Error querying model {model}: {e}")
        return None


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
    api_key: Optional[str] = None
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of OpenRouter model identifiers
        messages: List of message dicts to send to each model
        api_key: Optional OpenRouter API key (uses env var if not provided)

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    import asyncio

    # Create tasks for all models, passing api_key
    tasks = [query_model(model, messages, api_key=api_key) for model in models]

    # Wait for all to complete
    responses = await asyncio.gather(*tasks)

    # Map models to their responses
    return {model: response for model, response in zip(models, responses)}


async def get_free_models() -> List[Dict[str, Any]]:
    """
    Fetch all available models from OpenRouter and filter for free ones.

    Returns:
        List of model objects
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://openrouter.ai/api/v1/models")
            response.raise_for_status()

            data = response.json()
            models_data = data.get('data', [])

            free_models = []
            for model in models_data:
                pricing = model.get('pricing', {})
                model_id = model.get('id', '')

                # Check for zero pricing or specific free flag in ID
                is_free = (
                    (pricing.get('prompt') == '0' and pricing.get('completion') == '0') or
                    ':free' in model_id
                )

                if is_free:
                    free_models.append({
                        'id': model_id,
                        'name': model.get('name'),
                        'context_length': model.get('context_length'),
                        'pricing': pricing
                    })

            return free_models

    except Exception as e:
        print(f"Error fetching free models: {e}")
        return []
