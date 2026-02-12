/** Budget challenge generator – curated cheap ingredients. */

const CHEAP_INGREDIENTS = [
  "rice", "pasta", "bread", "eggs", "onion", "garlic", "potatoes",
  "tinned tomatoes", "frozen peas", "lentils", "maggi noodles",
  "cabbage", "carrots", "tinned beans", "oats", "flour",
  "bananas", "frozen spinach", "tinned sweetcorn", "soy sauce",
];

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export interface Challenge {
  title: string;
  budget: string;
  time_minutes: number;
  ingredients: string[];
}

export function generateChallenge(): Challenge {
  const ingredients = pick(CHEAP_INGREDIENTS, 3);
  return {
    title: "Budget Survival Challenge",
    budget: "Under \u00a33",
    time_minutes: 15,
    ingredients,
  };
}
