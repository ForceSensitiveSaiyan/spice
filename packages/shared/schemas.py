"""Shared Pydantic models for SPICE API request/response."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# ── Enums as literals ─────────────────────────────────────────────

FlavourMode = Literal[
    "bold_spicy", "umami", "comfort_rich", "bright_fresh", "clean_light"
]

SkillMode = Literal["beginner", "confident"]

FeedbackType = Literal["too_salty", "too_bland", "perfect", "needs_spice"]


# ── Request ───────────────────────────────────────────────────────

class Constraints(BaseModel):
    diet: str | None = None
    time_minutes: int | None = None
    equipment: list[str] = Field(default_factory=list)
    spice_level: str | None = None
    flavour_mode: FlavourMode | None = None
    skill_mode: SkillMode | None = None


class SuggestRequest(BaseModel):
    ingredients: list[str] = Field(..., min_length=1)
    constraints: Constraints = Field(default_factory=Constraints)
    pantry_items: list[str] = Field(default_factory=list)
    feedback_history: list[FeedbackType] = Field(default_factory=list)


# ── Response ──────────────────────────────────────────────────────

class Step(BaseModel):
    t_seconds: int
    instruction: str
    tip: str | None = None


class Upgrade(BaseModel):
    requires: str
    why: str
    how: str


class UpgradeLadder(BaseModel):
    pantry_upgrade: list[Upgrade] = Field(default_factory=list)
    if_you_have: list[Upgrade] = Field(default_factory=list)
    one_pound_shop: Upgrade | None = None


class MinimalRescue(BaseModel):
    enabled: bool = False
    flavour_hacks: list[str] = Field(default_factory=list)
    ask_for: list[str] = Field(default_factory=list)
    rescue_line: str = ""


class Safety(BaseModel):
    assumptions: list[str] = Field(default_factory=list)
    missing_ingredients: list[str] = Field(default_factory=list)
    disclaimer: str = "Adjust salt to taste."


class SuggestResponse(BaseModel):
    rejection: str | None = None
    title: str = ""
    prep_time_minutes: int = 0
    calories_estimate: int | None = None
    flavour_mode: FlavourMode | None = None
    steps: list[Step] = Field(default_factory=list)
    why_this_works: list[str] = Field(default_factory=list)
    upgrade_ladder: UpgradeLadder = Field(default_factory=UpgradeLadder)
    minimal_rescue: MinimalRescue | None = None
    pantry_used: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    safety: Safety = Field(default_factory=Safety)
