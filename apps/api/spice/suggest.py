"""Suggestion service – returns a meal plan from ingredients."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from shared.schemas import (
    CheapAddition,
    Safety,
    Step,
    SuggestRequest,
    SuggestResponse,
    Upgrade,
)

# Mock data keyed by first ingredient for demo variety
_MOCK_RESPONSES: dict[str, SuggestResponse] = {
    "maggi noodles": SuggestResponse(
        title="Caramelised onion Maggi with glossy broth",
        prep_time_minutes=12,
        steps=[
            Step(t=0, instruction="Slice onion thinly."),
            Step(t=2, instruction="Heat a little oil in the pan over medium heat."),
            Step(t=3, instruction="Sauté onion until golden, about 4 minutes."),
            Step(t=7, instruction="Add 1.5 cups water and bring to boil."),
            Step(t=9, instruction="Add noodles and half the seasoning pack."),
            Step(t=11, instruction="Cook until water is mostly absorbed. Add remaining seasoning."),
        ],
        upgrades=[
            Upgrade(requires="egg", why="Adds richness and protein", how="Whisk and pour in a thin stream at t=10 for silky ribbons."),
            Upgrade(requires="butter", why="Glossy, richer broth", how="Stir in a small knob at the very end."),
        ],
        one_cheapest_addition=CheapAddition(item="spring onions", why="Fresh bite and colour contrast", cost_note="Usually very cheap"),
        notes=["Keep half the seasoning pack for the end to avoid bitterness.", "Don't overcook – slightly firm noodles have better texture."],
        safety=Safety(assumptions=["You have basic oil and water available"], missing_ingredients=["oil"], disclaimer="Adjust salt to taste."),
    ),
    "rice": SuggestResponse(
        title="Quick garlic egg fried rice",
        prep_time_minutes=15,
        steps=[
            Step(t=0, instruction="Mince the garlic finely."),
            Step(t=1, instruction="Heat oil in a wok over high heat."),
            Step(t=2, instruction="Scramble eggs in the wok, break into pieces, set aside."),
            Step(t=4, instruction="Add garlic, stir 30 seconds until fragrant."),
            Step(t=5, instruction="Add rice, toss and fry for 3–4 minutes."),
            Step(t=9, instruction="Add soy sauce, toss to coat evenly."),
            Step(t=10, instruction="Return eggs to wok, toss to combine."),
        ],
        upgrades=[
            Upgrade(requires="sesame oil", why="Nutty aroma", how="Drizzle a few drops at the very end."),
        ],
        one_cheapest_addition=CheapAddition(item="frozen peas", why="Colour, sweetness, and extra veg", cost_note="Very affordable frozen"),
        notes=["Day-old rice works best – less moisture means better frying."],
        safety=Safety(assumptions=["Oil available for frying"], missing_ingredients=["oil"], disclaimer="Adjust soy sauce to taste."),
    ),
}

_DEFAULT_MOCK = SuggestResponse(
    title="Simple toast with melted cheese",
    prep_time_minutes=8,
    steps=[
        Step(t=0, instruction="Butter one side of each bread slice."),
        Step(t=1, instruction="Place cheese between slices, buttered sides out."),
        Step(t=2, instruction="Heat pan on medium. Toast each side 2–3 minutes until golden."),
    ],
    upgrades=[
        Upgrade(requires="tomato", why="Acidity cuts richness", how="Slice thinly and layer inside before toasting."),
    ],
    one_cheapest_addition=CheapAddition(item="hot sauce", why="Heat and tang", cost_note="Lasts forever, very cheap per use"),
    notes=["Low and slow gives crunchier crust."],
    safety=Safety(assumptions=[], missing_ingredients=[], disclaimer="Adjust to taste."),
)


def _use_openai() -> bool:
    return bool(os.environ.get("OPENAI_API_KEY"))


async def get_suggestion(req: SuggestRequest) -> SuggestResponse:
    """Return a meal suggestion. Uses OpenAI if API key is set, otherwise mock data."""
    if _use_openai():
        from spice.openai_service import generate_suggestion

        return await generate_suggestion(req)

    # Fallback: mock data for development
    for key, response in _MOCK_RESPONSES.items():
        if key in req.ingredients:
            return response
    return _DEFAULT_MOCK
