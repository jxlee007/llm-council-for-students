"""
Input Normalization Module

Normalizes all user inputs (text, images, or both) into a single textual prompt
that can be passed to the council. This ensures the council only ever receives text.
"""

from typing import Optional, Tuple, Dict, Any
from ..vision.processor import process_image_to_context, VisionContext


async def render_context_as_prompt(
    vision_context: VisionContext,
    user_caption: Optional[str] = None
) -> str:
    """
    Render vision context into a textual prompt for the council.
    
    Args:
        vision_context: Structured context from vision processing
        user_caption: Optional user-provided caption or question about the image
        
    Returns:
        Formatted prompt string
    """
    parts = []
    
    # Header indicating this came from an image
    parts.append("## Image Context")
    parts.append("The following information was extracted from an uploaded image.")
    parts.append("")
    
    # Confidence warning if low
    if vision_context.confidence < 0.6:
        parts.append("> ⚠️ **Low Confidence Extraction**: The image quality or content made extraction difficult. Results may be incomplete.")
        parts.append("")
    
    # Extracted text
    if vision_context.extracted_text:
        parts.append("### Extracted Content")
        parts.append(vision_context.extracted_text)
        parts.append("")
    
    # Key entities
    if vision_context.entities:
        parts.append("### Key Entities Identified")
        for entity in vision_context.entities[:10]:  # Limit to avoid prompt bloat
            parts.append(f"- {entity}")
        parts.append("")
    
    # Tables if present
    if vision_context.tables:
        parts.append("### Structured Data")
        for table in vision_context.tables[:3]:  # Limit tables
            if "raw" in table:
                parts.append(table["raw"])
        parts.append("")
    
    # Warnings
    if vision_context.warnings:
        parts.append("### Extraction Notes")
        for warning in vision_context.warnings[:5]:
            parts.append(f"- ⚠️ {warning}")
        parts.append("")
    
    # User's question/caption
    if user_caption:
        parts.append("---")
        parts.append("### User Question")
        parts.append(user_caption)
    else:
        parts.append("---")
        parts.append("### User Request")
        parts.append("Please analyze and respond based on the extracted image content above.")
    
    # Instruction for council
    parts.append("")
    parts.append("---")
    parts.append("*Note: Base your response ONLY on the extracted content above. The original image is not available to you.*")
    
    return "\n".join(parts)


async def normalize_user_input(
    text: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None,
    api_key: Optional[str] = None
) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    Normalize user input into a single textual prompt.
    
    Args:
        text: Optional text message from user
        image_bytes: Optional image bytes
        mime_type: MIME type of image (required if image_bytes provided)
        api_key: OpenRouter API key
        
    Returns:
        Tuple of (normalized_prompt, vision_context_dict)
        vision_context_dict is None if no image was processed.
        
    Raises:
        ValueError: If neither text nor image provided, or if image processing fails
    """
    # Case 1: Text only - return as-is
    if text and not image_bytes:
        return text, None
    
    # Case 2: Image present - process through vision
    if image_bytes:
        if not mime_type:
            raise ValueError("mime_type is required when providing image_bytes")
        
        # Process image to get structured context
        vision_context = await process_image_to_context(
            image_bytes=image_bytes,
            mime_type=mime_type,
            api_key=api_key
        )
        
        # Render context as prompt, with user text as caption
        prompt = await render_context_as_prompt(
            vision_context=vision_context,
            user_caption=text  # May be None
        )

        return prompt, vision_context.to_dict()
    
    # Case 3: Neither text nor image
    raise ValueError("At least one of text or image must be provided")
