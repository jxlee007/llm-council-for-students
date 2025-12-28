"""Convex backend client for LLM Council."""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from convex import ConvexClient

# Get Convex URL from environment
CONVEX_URL = os.getenv("CONVEX_URL")
if not CONVEX_URL:
    # Fallback/Mock for build time or if not set,
    # though it will fail at runtime if we try to use it.
    CONVEX_URL = "https://mock.convex.cloud"

# Initialize client
# Note: In a real deployment, we might need to handle the admin key differently
# depending on if we are acting as admin or user.
# For the backend API acting on behalf of users (or itself),
# we might need an admin key if we want to bypass RLS or simply use the URL.
# The python client uses CONVEX_DEPLOY_KEY env var if available for admin tasks,
# or we pass it. But basic `ConvexClient` uses public API.
# Assuming standard setup:
client = ConvexClient(CONVEX_URL)

def create_conversation(conversation_id: str) -> Dict[str, Any]:
    """
    Create a new conversation.
    Note: Convex generates its own IDs.
    We might need to map the provided UUID to the Convex ID or just use Convex ID.
    However, the frontend expects a specific flow.

    If `conversation_id` is passed, we can't easily force it as the Convex _id.

    Strategy:
    The existing API generates a UUID and passes it to `create_conversation`.
    We will create the conversation in Convex, get the Convex ID,
    and return a dict that LOOKS like what the app expects.

    BUT: If the frontend uses the UUID to refer to it later, we have a mismatch.
    The `main.py` generates the ID.

    Solution:
    We will store the UUID in the metadata if needed, OR we change `main.py`
    to respect the ID returned by storage.

    Looking at `main.py`:
    `conversation_id = str(uuid.uuid4())`
    `conversation = storage.create_conversation(conversation_id)`

    If we change `storage.py` to return the ACTUAL id (which might be the Convex ID),
    we need to ensure `main.py` uses that returned ID.

    Wait, `main.py` returns the `conversation` object which contains the ID.
    So if we return a conversation object with the Convex ID as `id`,
    it should propagate.
    """
    # Create in Convex
    # We ignore the passed conversation_id UUID because Convex handles IDs.
    # Unless we want to store it as an external ID?
    # Let's rely on Convex IDs.

    # Check if we have a userId in context?
    # The current `create_conversation` signature doesn't accept userId.
    # We will assume None (Guest) for now.

    created_at = datetime.utcnow().isoformat()
    title = "New Conversation"

    convex_id = client.mutation("conversations:create", {
        "title": title,
        "userId": None,
        "created_at": created_at
    })

    return {
        "id": convex_id,
        "created_at": created_at,
        "title": title,
        "messages": []
    }

def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a conversation from storage.
    """
    try:
        # Get metadata
        conv = client.query("conversations:get", {"id": conversation_id})
        if not conv:
            return None

        # Get messages
        messages = client.query("messages:list", {"conversationId": conversation_id})

        # Transform messages to match expected format
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                "role": msg["role"],
                # Standardize fields based on role
            }
            if msg["role"] == "user":
                formatted_msg["content"] = msg["content"]
            elif msg["role"] == "assistant":
                formatted_msg["stage1"] = msg["stage1"]
                formatted_msg["stage2"] = msg["stage2"]
                formatted_msg["stage3"] = msg["stage3"]

            formatted_messages.append(formatted_msg)

        return {
            "id": conv["_id"],
            "created_at": conv["created_at"],
            "title": conv["title"],
            "messages": formatted_messages
        }
    except Exception as e:
        print(f"Error getting conversation {conversation_id}: {e}")
        return None

def list_conversations() -> List[Dict[str, Any]]:
    """
    List all conversations (metadata only).
    """
    # Fetch all (or filter by user if we had context)
    convs = client.query("conversations:list", {})

    results = []
    for conv in convs:
        # We need message count.
        # Ideally, the list query should return this or we do a separate count.
        # Doing N+1 queries is bad, but for a prototype it's okay.
        # Better: Add message_count to conversation document and update it on message add.
        # For now, let's fetch messages or just return 0 to be fast?
        # The frontend uses it.
        # Let's see if we can get away with 0 or if we must query.
        # `client.query("messages:list")` returns all messages for a conv.
        # This is heavy.

        # Let's assume we update the schema later or accept the N+1 for now
        # since "Guest Mode" likely has few conversations.
        messages = client.query("messages:list", {"conversationId": conv["_id"]})

        results.append({
            "id": conv["_id"],
            "created_at": conv["created_at"],
            "title": conv.get("title", "New Conversation"),
            "message_count": len(messages)
        })

    # Sort by creation time, newest first (handled by Convex query mostly, but ensure here)
    # The convex query had .order("desc")

    return results

def add_user_message(conversation_id: str, content: str):
    """
    Add a user message to a conversation.
    """
    client.mutation("messages:add", {
        "conversationId": conversation_id,
        "role": "user",
        "content": content
    })

def add_assistant_message(
    conversation_id: str,
    stage1: List[Dict[str, Any]],
    stage2: List[Dict[str, Any]],
    stage3: Dict[str, Any]
):
    """
    Add an assistant message with all 3 stages.
    """
    client.mutation("messages:add", {
        "conversationId": conversation_id,
        "role": "assistant",
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3
    })

def update_conversation_title(conversation_id: str, title: str):
    """
    Update the title of a conversation.
    """
    client.mutation("conversations:updateTitle", {
        "id": conversation_id,
        "title": title
    })
