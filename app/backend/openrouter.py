import os
import json
import asyncio
import httpx
import time
from typing import List, Dict, Any, Optional
from .config import OPENROUTER_API_URL, OPENROUTER_API_KEY as DEFAULT_API_KEY

# Simple in-memory cache
MODEL_CACHE = {
    "data": [],
    "timestamp": 0
}
CACHE_TTL = 300  # 5 minutes

def normalize_model(raw_model: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize OpenRouter model data into a rich schema for the UI.
    """
    model_id = raw_model.get("id", "")
    name = raw_model.get("name", model_id)
    description = raw_model.get("description", "")
    context_length = int(raw_model.get("context_length", 0))
    
    # pricing
    pricing = raw_model.get("pricing", {})
    
    # architecture & modality
    arch = raw_model.get("architecture", {})
    modality = arch.get("modality", "").lower()
    
    # granular capabilities
    has_image = "image" in modality or "vision" in model_id.lower() or "vl" in model_id.lower()
    has_video = "video" in modality
    
    # Context bucket
    context_k = context_length / 1024
    if context_k <= 8:
        context_bucket = "short"
    elif context_k <= 64:
        context_bucket = "mid"
    else:
        context_bucket = "long"

    # UI Pills generation
    pills = []
    
    if has_image:
        pills.append("Image")
    if has_video:
        pills.append("Video")
    
    # Context pill removed (redundant with display text)
    
    # Rankings lookup (flexible matching)
    rankings = []
    model_name_lower = name.lower()
    model_id_lower = model_id.lower()
    
    RANKING_DATA = {
        # Keys must be lowercase
        "mimo": ["Academia (#4)", "Translation (#8)", "Finance (#9)"],
        "devstral": ["Programming (#5)", "Legal (#7)", "SEO (#10)"],
        "r1t2": ["Roleplay (#5)"],
        "chimera": ["Roleplay (#5)"],
    }
    
    for key, callback_rankings in RANKING_DATA.items():
        if key in model_name_lower or key in model_id_lower:
            print(f"  -> Assigned rankings to {model_id} (matched '{key}')")
            rankings = callback_rankings
            break
    
    # if not rankings:
    #     print(f"NO MATCH: {model_id} (name: {name})")

    return {
        "id": model_id,
        "name": name,
        "description": description,
        "context_length": context_length,
        "pricing": pricing,
        "provider": raw_model.get("top_provider", {}).get("name"),
        "capabilities": {
            "image": has_image,
            "video": has_video
        },
        "ui_pills": pills,
        "rankings": rankings
    }

async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 60.0,
    api_key: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter.
    
    Args:
        model: Model ID to query
        messages: List of message dicts
        timeout: Request timeout in seconds
        api_key: Optional API key override
        
    Returns:
        Response message dict or None on failure
    """
    key = api_key or DEFAULT_API_KEY
    if not key:
        print(f"Error: No API key provided for model {model}")
        return None

    headers = {
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": "https://llm-council.vercel.app",
        "X-Title": "LLM Council",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload,
                timeout=timeout
            )
            
            if response.status_code != 200:
                # Log error but don't crush the app
                print(f"Error querying {model}: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            if "choices" not in data or not data["choices"]:
                return None
                
            return data["choices"][0]["message"]
                
        except httpx.TimeoutException:
            print(f"Timeout querying {model}")
            return None
        except Exception as e:
            print(f"Exception querying {model}: {e}")
            return None


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
    api_key: Optional[str] = None
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.
    
    Args:
        models: List of model IDs
        messages: List of message dicts
        api_key: Optional API key override
        
    Returns:
        Dictionary mapping model ID to response message (or None)
    """
    tasks = []
    # Create tasks for all models
    for model in models:
        tasks.append(query_model(model, messages, api_key=api_key))
        
    # Run all tasks concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Map results back to models
    output = {}
    for model, result in zip(models, results):
        if isinstance(result, Exception):
            print(f"Error in parallel query for {model}: {result}")
            output[model] = None
        else:
            output[model] = result
            
    return output


async def get_free_models() -> List[Dict[str, Any]]:
    """
    Fetch list of available free models from OpenRouter with caching and normalization.
    """
    # Check cache
    now = time.time()
    if MODEL_CACHE["data"] and (now - MODEL_CACHE["timestamp"] < CACHE_TTL):
        return MODEL_CACHE["data"]
        
    url = "https://openrouter.ai/api/v1/models"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            
            if response.status_code != 200:
                return MODEL_CACHE["data"] # Return stale data if fetch fails
            
            data = response.json()
            models = data.get("data", [])
            
            free_models = []
            for m in models:
                pricing = m.get("pricing", {})
                # Check if essentially free
                try:
                    p_prompt = float(pricing.get("prompt", 0))
                    p_completion = float(pricing.get("completion", 0))
                    
                    if p_prompt == 0 and p_completion == 0:
                        # Normalize and add
                        normalized = normalize_model(m)
                        free_models.append(normalized)
                except (ValueError, TypeError):
                    continue
            
            # Update cache
            MODEL_CACHE["data"] = free_models
            MODEL_CACHE["timestamp"] = now
            
            return free_models
        except Exception as e:
            print(f"Error fetching models: {e}")
            return MODEL_CACHE["data"] # Return stale data on error
