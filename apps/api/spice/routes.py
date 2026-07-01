"""API routes for SPICE."""

import asyncio
import hashlib
import logging
import re
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

# Combo signature format: "ingredient1,ingredient2,...|flavour_mode"
_COMBO_SIG_RE = re.compile(r"^[\w\s,.\-]+\|[\w]+$")


def _extract_client_ip(request: Request) -> str:
    """Extract client IP, using only the first entry from X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest, request: Request) -> SuggestResponse:
    # Rate limit by client IP
    client_ip = _extract_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    try:
        result = await get_suggestion(req)

        # Non-food rejections aren't real combos — don't pollute the table.
        if result.rejection:
            return result

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
    except RuntimeError:
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
    # Validate signature format before hashing
    if not _COMBO_SIG_RE.match(req.combo_signature):
        raise HTTPException(status_code=422, detail="Invalid combo_signature format")

    h = hashlib.sha256(req.combo_signature.encode()).hexdigest()
    if not combo_exists(h):
        raise HTTPException(status_code=404, detail="Unknown combo")
    record_feedback(h, req.feedback_type)
    breakdown, total = get_feedback_breakdown(h)
    return FeedbackResponse(feedback_breakdown=breakdown, total_feedback=total)
