"""API routes for SPICE."""

import logging
import sys
import os

# Add packages to path so we can import shared schemas
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from fastapi import APIRouter, HTTPException
from shared.schemas import SuggestRequest, SuggestResponse

from spice.suggest import get_suggestion

logger = logging.getLogger("spice.routes")
router = APIRouter()


@router.post("/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest) -> SuggestResponse:
    try:
        return await get_suggestion(req)
    except Exception as exc:
        logger.exception("Suggestion failed")
        raise HTTPException(status_code=502, detail=f"Suggestion generation failed: {exc}")
