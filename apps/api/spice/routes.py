"""API routes for SPICE."""

import sys
import os

# Add packages to path so we can import shared schemas
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from fastapi import APIRouter
from shared.schemas import SuggestRequest, SuggestResponse

from spice.suggest import get_suggestion

router = APIRouter()


@router.post("/suggest", response_model=SuggestResponse)
async def suggest(req: SuggestRequest) -> SuggestResponse:
    return await get_suggestion(req)
