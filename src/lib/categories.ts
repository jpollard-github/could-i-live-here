import type { CategoryId, Place } from "./types.ts";

export type CategoryConfig = {
  id: CategoryId;
  label: string;
  short: string;
  symbol: string;
  tokens: readonly string[];
};

/** Exact Overture taxonomy tokens avoid false positives such as parking lots counting as parks. */
export const CATEGORIES: readonly CategoryConfig[] = [
  { id: "groceries", label: "Groceries", short: "Food for the fridge", symbol: "🛒", tokens: ["grocery_store", "supermarket", "grocery", "food_market", "farmers_market"] },
  { id: "coffee", label: "Coffee", short: "A decent cup", symbol: "☕", tokens: ["coffee_shop", "coffeehouse", "cafe", "tea_house"] },
  { id: "pharmacy", label: "Pharmacy", short: "The practical stuff", symbol: "✚", tokens: ["pharmacy", "drugstore"] },
  { id: "parks", label: "Parks", short: "Some fresh air", symbol: "🌳", tokens: ["park", "public_park", "playground", "botanical_garden", "nature_reserve"] },
  { id: "restaurants", label: "Restaurants", short: "Dinner plans", symbol: "🍽", tokens: ["restaurant", "casual_eatery", "fast_food_restaurant", "diner", "bistro"] },
  { id: "hardware", label: "Hardware", short: "One more project", symbol: "🔨", tokens: ["hardware_store", "home_improvement_store", "building_materials_store", "tool_store"] },
];

export function belongsToCategory(place: Place, category: CategoryId): boolean {
  const config = CATEGORIES.find((candidate) => candidate.id === category);
  if (!config) return false;
  const tokens = new Set([place.category, ...place.taxonomy]);
  return config.tokens.some((token) => tokens.has(token));
}

export function matchingCategories(place: Place): CategoryId[] {
  return CATEGORIES.filter((category) => belongsToCategory(place, category.id)).map((category) => category.id);
}
