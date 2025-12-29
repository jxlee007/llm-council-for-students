"""JSON-based storage for conversations, with Convex adapter support."""

import json
import os
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import DATA_DIR
import sys

# Determine storage backend
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "file")

# Import Convex client if needed
# Note: We import it conditionally, but for testing (mocking) we might want it available in the namespace.
# However, if 'convex' package is missing, we shouldn't fail unless backend is convex.
convex_client = None
if STORAGE_BACKEND == "convex":
    try:
        from . import convex_client
    except ImportError:
        if "unittest" not in sys.modules:
            print("Warning: convex module not found but STORAGE_BACKEND=convex")

def validate_conversation_id(conversation_id: str):
    """
    Validate that the conversation ID is safe (alphanumeric, hyphens, and underscores only).
    Raises ValueError if invalid.
    """
    # Convex IDs can contain underscores
    # We validate to prevent path traversal attacks
    if STORAGE_BACKEND == "file":
        if not re.match(r'^[a-zA-Z0-9_-]+$', conversation_id):
            raise ValueError(f"Invalid conversation ID: {conversation_id}")


def ensure_data_dir():
    """Ensure the data directory exists."""
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)


def get_conversation_path(conversation_id: str) -> str:
    """Get the file path for a conversation."""
    validate_conversation_id(conversation_id)
    return os.path.join(DATA_DIR, f"{conversation_id}.json")


def create_conversation(conversation_id: str) -> Dict[str, Any]:
    """
    Create a new conversation.

    Args:
        conversation_id: Unique identifier for the conversation (used for file storage)

    Returns:
        New conversation dict
    """
    if STORAGE_BACKEND == "convex" and convex_client:
        return convex_client.create_conversation(conversation_id)

    ensure_data_dir()

    conversation = {
        "id": conversation_id,
        "created_at": datetime.utcnow().isoformat(),
        "title": "New Conversation",
        "messages": []
    }

    # Save to file
    path = get_conversation_path(conversation_id)
    with open(path, 'w') as f:
        json.dump(conversation, f, indent=2)

    return conversation


def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a conversation from storage.

    Args:
        conversation_id: Unique identifier for the conversation

    Returns:
        Conversation dict or None if not found
    """
    if STORAGE_BACKEND == "convex" and convex_client:
        return convex_client.get_conversation(conversation_id)

    try:
        path = get_conversation_path(conversation_id)
    except ValueError:
        return None

    if not os.path.exists(path):
        return None

    with open(path, 'r') as f:
        return json.load(f)


def save_conversation(conversation: Dict[str, Any]):
    """
    Save a conversation to storage.

    Args:
        conversation: Conversation dict to save
    """
    if STORAGE_BACKEND == "convex":
        # Convex saves incrementally via add_message,
        # but if we needed to save the whole object:
        # Currently not supported/needed by the adapter pattern
        # as the individual update methods handle persistence.
        # This function is mostly a helper for the file-based approach.
        return

    ensure_data_dir()

    path = get_conversation_path(conversation['id'])
    with open(path, 'w') as f:
        json.dump(conversation, f, indent=2)


def list_conversations() -> List[Dict[str, Any]]:
    """
    List all conversations (metadata only).

    Returns:
        List of conversation metadata dicts
    """
    if STORAGE_BACKEND == "convex" and convex_client:
        return convex_client.list_conversations()

    ensure_data_dir()

    conversations = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            path = os.path.join(DATA_DIR, filename)
            with open(path, 'r') as f:
                data = json.load(f)
                # Return metadata only
                conversations.append({
                    "id": data["id"],
                    "created_at": data["created_at"],
                    "title": data.get("title", "New Conversation"),
                    "message_count": len(data["messages"])
                })

    # Sort by creation time, newest first
    conversations.sort(key=lambda x: x["created_at"], reverse=True)

    return conversations


def add_user_message(conversation_id: str, content: str):
    """
    Add a user message to a conversation.

    Args:
        conversation_id: Conversation identifier
        content: User message content
    """
    if STORAGE_BACKEND == "convex" and convex_client:
        return convex_client.add_user_message(conversation_id, content)

    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "role": "user",
        "content": content
    })

    save_conversation(conversation)


def add_assistant_message(
    conversation_id: str,
    stage1: List[Dict[str, Any]],
    stage2: List[Dict[str, Any]],
    stage3: Dict[str, Any]
):
    """
    Add an assistant message with all 3 stages to a conversation.

    Args:
        conversation_id: Conversation identifier
        stage1: List of individual model responses
        stage2: List of model rankings
        stage3: Final synthesized response
    """
    if STORAGE_BACKEND == "convex" and convex_client:
        return convex_client.add_assistant_message(conversation_id, stage1, stage2, stage3)

    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "role": "assistant",
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3
    })

    save_conversation(conversation)


def update_conversation_title(conversation_id: str, title: str):
    """
    Update the title of a conversation.

    Args:
        conversation_id: Conversation identifier
        title: New title for the conversation
    """
    if STORAGE_BACKEND == "convex" and convex_client:
        return convex_client.update_conversation_title(conversation_id, title)

    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["title"] = title
    save_conversation(conversation)
