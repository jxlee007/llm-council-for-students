"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    "openai/gpt-oss-20b:free",
    "google/gemma-3-27b-it:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "x-ai/grok-4.1-fast:free",
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "arcee-ai/trinity-mini:free"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"