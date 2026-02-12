"""Shared Pydantic models for SPICE API request/response."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Constraints(BaseModel):
    diet: str | None = None
    time_minutes: int | None = None
    equipment: list[str] = Field(default_factory=list)
    spice_level: str | None = None


class SuggestRequest(BaseModel):
    ingredients: list[str] = Field(..., min_length=1)
    constraints: Constraints = Field(default_factory=Constraints)


class Step(BaseModel):
    t: int
    instruction: str


class Upgrade(BaseModel):
    requires: str
    why: str
    how: str


class CheapAddition(BaseModel):
    item: str
    why: str
    cost_note: str


class Safety(BaseModel):
    assumptions: list[str] = Field(default_factory=list)
    missing_ingredients: list[str] = Field(default_factory=list)
    disclaimer: str = "Adjust salt to taste."


class SuggestResponse(BaseModel):
    title: str
    prep_time_minutes: int
    steps: list[Step]
    upgrades: list[Upgrade] = Field(default_factory=list)
    one_cheapest_addition: CheapAddition | None = None
    notes: list[str] = Field(default_factory=list)
    safety: Safety = Field(default_factory=Safety)
