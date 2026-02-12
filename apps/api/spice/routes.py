"""API routes for SPICE."""

import asyncio
import logging
import sys
import os

# Add packages to path so we can import shared schemas
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from shared.schemas import SuggestRequest, SuggestResponse

from spice.suggest import get_suggestion

logger = logging.getLogger("spice.routes")
router = APIRouter()


@router.post("/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest) -> SuggestResponse:
    try:
        return await get_suggestion(req)
    except ValidationError:
        logger.exception("Validation error in suggestion response")
        raise HTTPException(status_code=422, detail="Invalid response from suggestion engine")
    except RuntimeError as exc:
        logger.exception("Configuration error")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except asyncio.TimeoutError:
        logger.exception("Suggestion timed out")
        raise HTTPException(status_code=504, detail="Suggestion generation timed out")
    except Exception:
        logger.exception("Suggestion failed")
        raise HTTPException(status_code=500, detail="Internal server error")
