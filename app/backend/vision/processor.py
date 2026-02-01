"""
Vision Processor Module

Processes images using vision models and returns structured textual context.
The council never receives raw images - only this extracted context.
"""

import base64
import httpx
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from ..config import OPENROUTER_API_URL, OPENROUTER_API_KEY as DEFAULT_API_KEY


# Default vision model (free tier, good balance of quality and speed)
DEFAULT_VISION_MODEL = "google/gemma-3-27b-it:free"

# Fallback vision models in order of preference
FALLBACK_VISION_MODELS = [
    "nvidia/nemotron-nano-12b-2-vl:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "google/gemma-3-4b-it:free",
]


@dataclass
class VisionContext:
    """Structured context extracted from an image."""
    source: str  # "image"
    extracted_text: str
    entities: List[str]
    tables: List[Dict[str, Any]]
    confidence: float  # 0.0 to 1.0
    warnings: List[str]
    model_used: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


async def _call_vision_model(
    model: str,
    image_base64: str,
    mime_type: str,
    api_key: str,
    timeout: float = 90.0
) -> Optional[str]:
    """
    Call a vision model with an image and get text response.
    
    Returns the extracted text or None on failure.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://llm-council.vercel.app",
        "X-Title": "LLM Council Vision",
        "Content-Type": "application/json"
    }
    
    # Create the vision prompt
    system_prompt = """You are an expert at extracting information from images.
Analyze the provided image and extract ALL textual and visual information.

Your response MUST follow this exact format:

## EXTRACTED TEXT
[All text visible in the image, preserving structure]

## KEY ENTITIES
[List of important entities: names, dates, numbers, organizations, etc.]

## TABLES/STRUCTURED DATA
[If any tables or structured data, represent as markdown tables]

## CONFIDENCE
[Rate 0-100 how confident you are in your extraction]

## WARNINGS
[Any issues: blur, partial visibility, unclear text, etc.]

Be thorough and accurate. If text is unclear, note it in warnings but attempt extraction anyway."""

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{image_base64}"
                    }
                },
                {
                    "type": "text",
                    "text": "Please analyze this image and extract all information following the specified format."
                }
            ]
        }
    ]
    
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 4096
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
                print(f"Vision model {model} failed: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            if "choices" not in data or not data["choices"]:
                return None
            
            return data["choices"][0]["message"]["content"]
            
        except httpx.TimeoutException:
            print(f"Timeout calling vision model {model}")
            return None
        except Exception as e:
            print(f"Exception calling vision model {model}: {e}")
            return None


def _parse_vision_response(raw_response: str, model_used: str) -> VisionContext:
    """
    Parse the structured response from the vision model into VisionContext.
    """
    extracted_text = ""
    entities = []
    tables = []
    confidence = 0.7  # Default moderate confidence
    warnings = []
    
    # Parse sections from the response
    sections = raw_response.split("##")
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
            
        lines = section.split("\n", 1)
        header = lines[0].strip().upper()
        content = lines[1].strip() if len(lines) > 1 else ""
        
        if "EXTRACTED TEXT" in header:
            extracted_text = content
        elif "KEY ENTITIES" in header or "ENTITIES" in header:
            # Parse entity list
            for line in content.split("\n"):
                line = line.strip().lstrip("-•*").strip()
                if line:
                    entities.append(line)
        elif "TABLE" in header or "STRUCTURED" in header:
            # Keep tables as formatted text for now
            if content:
                tables.append({"raw": content})
        elif "CONFIDENCE" in header:
            # Extract confidence number
            import re
            match = re.search(r"(\d+)", content)
            if match:
                confidence = min(100, max(0, int(match.group(1)))) / 100.0
        elif "WARNING" in header:
            for line in content.split("\n"):
                line = line.strip().lstrip("-•*").strip()
                if line:
                    warnings.append(line)
    
    # Fallback if parsing failed
    if not extracted_text:
        extracted_text = raw_response
        warnings.append("Could not parse structured response; using raw output")
        confidence = 0.5
    
    return VisionContext(
        source="image",
        extracted_text=extracted_text,
        entities=entities,
        tables=tables,
        confidence=confidence,
        warnings=warnings,
        model_used=model_used
    )


async def process_image_to_context(
    image_bytes: bytes,
    mime_type: str,
    api_key: Optional[str] = None,
    preferred_model: Optional[str] = None
) -> VisionContext:
    """
    Process an image and return structured textual context.
    
    Args:
        image_bytes: Raw image bytes
        mime_type: MIME type (e.g., "image/png", "image/jpeg")
        api_key: OpenRouter API key
        preferred_model: Optional specific vision model to use
        
    Returns:
        VisionContext with extracted information
        
    Raises:
        ValueError: If image processing fails after all retries
    """
    key = api_key or DEFAULT_API_KEY
    if not key:
        raise ValueError("No API key provided for vision processing")
    
    # Encode image to base64
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    
    # Build model list to try
    models_to_try = []
    if preferred_model:
        models_to_try.append(preferred_model)
    models_to_try.append(DEFAULT_VISION_MODEL)
    models_to_try.extend(FALLBACK_VISION_MODELS)
    
    # Remove duplicates while preserving order
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]
    
    # Try each model until one succeeds
    last_error = None
    for model in models_to_try:
        try:
            raw_response = await _call_vision_model(
                model=model,
                image_base64=image_base64,
                mime_type=mime_type,
                api_key=key
            )
            
            if raw_response:
                context = _parse_vision_response(raw_response, model)
                print(f"Vision processing succeeded with {model}")
                return context
                
        except Exception as e:
            last_error = e
            print(f"Vision model {model} failed: {e}")
            continue
    
    # All models failed
    raise ValueError(
        f"Vision processing failed after trying {len(models_to_try)} models. "
        f"Last error: {last_error}"
    )
