"""API routes for SPICE."""

import asyncio
import hashlib
import logging
import sys
import os

# Add packages to path so we can import shared schemas
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError
from shared.schemas import (
    SuggestRequest,
    SuggestResponse,
    CommunityStats,
    FeedbackRequest,
    FeedbackResponse,
)

from spice.db import (
    make_combo_hash,
    record_combo,
    combo_exists,
    record_feedback,
    get_feedback_breakdown,
)
from spice.rate_limit import check_rate_limit
from spice.suggest import get_suggestion

logger = logging.getLogger("spice.routes")
router = APIRouter()


@router.post("/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest, request: Request) -> SuggestResponse:
    # Rate limit by client IP
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    try:
        result = await get_suggestion(req)

        # Track combo and attach community stats
        sig, h = make_combo_hash(req.ingredients, req.constraints.flavour_mode)
        count = record_combo(sig, h)
        breakdown, total = get_feedback_breakdown(h)
        result.community = CommunityStats(
            combo_count=count,
            feedback_breakdown=breakdown,
            total_feedback=total,
        )

        return result
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


@router.post("/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest) -> FeedbackResponse:
    h = hashlib.sha256(req.combo_signature.encode()).hexdigest()
    if not combo_exists(h):
        raise HTTPException(status_code=404, detail="Unknown combo")
    record_feedback(h, req.feedback_type)
    breakdown, total = get_feedback_breakdown(h)
    return FeedbackResponse(feedback_breakdown=breakdown, total_feedback=total)
