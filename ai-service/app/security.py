"""
security.py
───────────
Simple API-key guard shared across all routers.

The Node.js backend sends:
    X-API-Key: <value from AI_SERVICE_API_KEY in its .env>

This service checks it against its own API_KEY env var.

For production, rotate to JWT or mTLS — this is sufficient for a local
Docker-compose network where the service is not exposed to the internet.
"""

from fastapi import Header, HTTPException, status
from app.config import get_settings


async def verify_api_key(x_api_key: str = Header(...)) -> None:
    """
    FastAPI dependency — add to any router or individual endpoint:

        @router.post("/", dependencies=[Depends(verify_api_key)])
    """
    if x_api_key != get_settings().API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )