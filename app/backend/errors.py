"""Structured error types for the LLM Council API."""

from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ErrorCode(str, Enum):
    """Machine-readable error codes for API responses."""
    
    # Configuration errors
    MISSING_API_KEY = "MISSING_API_KEY"
    INVALID_API_KEY = "INVALID_API_KEY"
    
    # User errors
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INVALID_REQUEST = "INVALID_REQUEST"
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"
    
    # Provider errors
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    PROVIDER_ERROR = "PROVIDER_ERROR"
    TIMEOUT = "TIMEOUT"
    
    # System errors
    INTERNAL_ERROR = "INTERNAL_ERROR"


class APIError(BaseModel):
    """Structured API error response."""
    error_code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None


class CouncilException(Exception):
    """Exception with structured error code for council operations."""
    
    def __init__(
        self, 
        code: ErrorCode, 
        message: str, 
        details: Optional[Dict[str, Any]] = None
    ):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)
    
    def to_api_error(self) -> APIError:
        """Convert to API error response model."""
        return APIError(
            error_code=self.code,
            message=self.message,
            details=self.details
        )
