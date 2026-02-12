"""Suggestion service – returns a meal plan from ingredients."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages"))

from shared.schemas import (
    MinimalRescue,
    Safety,
    Step,
    SuggestRequest,
    SuggestResponse,
    Upgrade,
    UpgradeLadder,
)

# ── Mock data ─────────────────────────────────────────────────────

_MOCK_RESPONSES: dict[str, SuggestResponse] = {
    "maggi noodles": SuggestResponse(
        title="Caramelised onion Maggi with glossy broth",
        prep_time_minutes=12,
        flavour_mode="umami",
        steps=[
            Step(t_seconds=0, instruction="Slice onion thinly.", tip="Thinner = faster caramelisation."),
            Step(t_seconds=120, instruction="Heat a little oil in the pan over medium heat."),
            Step(t_seconds=180, instruction="Saut\u00e9 onion until golden, about 4 minutes.", tip="Don't stir too often \u2013 let it colour."),
            Step(t_seconds=420, instruction="Add 1.5 cups water and bring to boil."),
            Step(t_seconds=540, instruction="Add noodles and half the seasoning pack."),
            Step(t_seconds=660, instruction="Cook until water is mostly absorbed. Add remaining seasoning."),
        ],
        why_this_works=[
            "Caramelised onion adds sweetness and depth without extra ingredients.",
            "Splitting the seasoning pack prevents bitterness from over-cooking spices.",
            "Reducing the broth concentrates flavour \u2013 glossy, not watery.",
        ],
        upgrade_ladder=UpgradeLadder(
            pantry_upgrade=[
                Upgrade(requires="butter", why="Glossy, richer broth", how="Stir in a small knob at the very end."),
            ],
            if_you_have=[
                Upgrade(requires="egg", why="Adds richness and protein", how="Whisk and pour in a thin stream at 8:00 for silky ribbons."),
                Upgrade(requires="cheese", why="Melty umami hit", how="Grate on top while still steaming. Let it melt 30s."),
            ],
            one_pound_shop=Upgrade(requires="spring onions", why="Fresh bite and colour contrast", how="Slice and scatter on top raw."),
        ),
        notes=["Don't overcook \u2013 slightly firm noodles have better texture."],
        safety=Safety(assumptions=["Oil and water available"], missing_ingredients=["oil"], disclaimer="Adjust salt to taste."),
    ),
    "rice": SuggestResponse(
        title="Quick garlic egg fried rice",
        prep_time_minutes=15,
        flavour_mode="umami",
        steps=[
            Step(t_seconds=0, instruction="Mince the garlic finely."),
            Step(t_seconds=60, instruction="Heat oil in a wok over high heat.", tip="Wok must be smoking hot."),
            Step(t_seconds=120, instruction="Scramble eggs in the wok, break into pieces, set aside."),
            Step(t_seconds=240, instruction="Add garlic, stir 30 seconds until fragrant."),
            Step(t_seconds=300, instruction="Add rice, toss and fry for 3\u20134 minutes.", tip="Press rice flat, let it crisp, then toss."),
            Step(t_seconds=540, instruction="Add soy sauce, toss to coat evenly."),
            Step(t_seconds=600, instruction="Return eggs to wok, toss to combine."),
        ],
        why_this_works=[
            "High heat + dry rice = wok hei (smoky char) even on a home hob.",
            "Garlic blooms fast in hot oil \u2013 30 seconds is enough for maximum aroma.",
            "Soy sauce goes in late so it sizzles and reduces, not steams.",
        ],
        upgrade_ladder=UpgradeLadder(
            pantry_upgrade=[
                Upgrade(requires="sesame oil", why="Nutty aroma", how="Drizzle a few drops at the very end."),
            ],
            if_you_have=[
                Upgrade(requires="spring onions", why="Freshness and colour", how="Slice and toss in at the very end."),
            ],
            one_pound_shop=Upgrade(requires="frozen peas", why="Colour, sweetness, and extra veg", how="Throw in frozen at 4:00, they\u2019ll cook in 60s."),
        ),
        notes=["Day-old rice works best \u2013 less moisture means better frying."],
        safety=Safety(assumptions=["Oil available for frying"], missing_ingredients=["oil"], disclaimer="Adjust soy sauce to taste."),
    ),
}

_DEFAULT_MOCK = SuggestResponse(
    title="Simple toast with melted cheese",
    prep_time_minutes=8,
    flavour_mode="comfort_rich",
    steps=[
        Step(t_seconds=0, instruction="Butter one side of each bread slice."),
        Step(t_seconds=60, instruction="Place cheese between slices, buttered sides out."),
        Step(t_seconds=120, instruction="Heat pan on medium. Toast each side 2\u20133 minutes until golden.", tip="Low and slow gives crunchier crust."),
    ],
    why_this_works=[
        "Butter on the outside = even golden crust without burning.",
        "Medium heat melts cheese fully before bread over-browns.",
    ],
    upgrade_ladder=UpgradeLadder(
        pantry_upgrade=[],
        if_you_have=[
            Upgrade(requires="tomato", why="Acidity cuts richness", how="Slice thinly and layer inside before toasting."),
        ],
        one_pound_shop=Upgrade(requires="hot sauce", why="Heat and tang", how="Drizzle inside before closing."),
    ),
    notes=[],
    safety=Safety(assumptions=[], missing_ingredients=[], disclaimer="Adjust to taste."),
)

_RESCUE_MOCK = SuggestResponse(
    title="Emergency Maggi \u2013 minimum viable noodles",
    prep_time_minutes=8,
    steps=[
        Step(t_seconds=0, instruction="Boil 1.5 cups water."),
        Step(t_seconds=120, instruction="Add noodles, cook 2 minutes."),
        Step(t_seconds=240, instruction="Add half the seasoning pack. Stir."),
        Step(t_seconds=300, instruction="Let water reduce until glossy. Add remaining seasoning."),
        Step(t_seconds=360, instruction="Serve immediately \u2013 noodles keep cooking from residual heat."),
    ],
    why_this_works=[
        "Splitting seasoning avoids bitter over-cooked spices.",
        "Reducing the broth = concentrated flavour, not sad soup.",
    ],
    upgrade_ladder=UpgradeLadder(
        pantry_upgrade=[],
        if_you_have=[
            Upgrade(requires="egg", why="Protein + richness", how="Crack in at 4:00, stir for ribbons."),
        ],
        one_pound_shop=Upgrade(requires="onion", why="Sweetness and depth", how="Slice thin, fry before adding water."),
    ),
    minimal_rescue=MinimalRescue(
        enabled=True,
        flavour_hacks=["Toast the noodle block dry for 30s before boiling \u2013 adds nuttiness.", "A drop of vinegar at the end brightens everything."],
        ask_for=["onion", "egg"],
        rescue_line="You're 2 steps away from elite noodles.",
    ),
    notes=[],
    safety=Safety(assumptions=["Water available"], missing_ingredients=[], disclaimer="Adjust salt to taste."),
)


# ── Service ───────────────────────────────────────────────────────

def _use_openai() -> bool:
    return bool(os.environ.get("OPENAI_API_KEY"))


async def get_suggestion(req: SuggestRequest) -> SuggestResponse:
    """Return a meal suggestion. Uses OpenAI if API key is set, otherwise mock data."""
    if _use_openai():
        from spice.openai_service import generate_suggestion
        return await generate_suggestion(req)

    # Minimal rescue: single ingredient
    if len(req.ingredients) <= 1:
        return _RESCUE_MOCK

    # Fallback: mock data for development
    for key, response in _MOCK_RESPONSES.items():
        if key in req.ingredients:
            return response
    return _DEFAULT_MOCK
