import type { CategoryId, Place } from "./types.ts";

export type CategoryConfig = {
  id: CategoryId;
  label: string;
  symbol: string;
  color: string;
  tokens: readonly string[];
};

/** Explicit Overture taxonomy tokens; each mapped place gets one visible category. */
export const CATEGORIES: readonly CategoryConfig[] = [
  { id: "groceries", label: "Groceries", symbol: "🛒", color: "#267D5B", tokens: ["grocery_store", "supermarket", "grocery", "food_market", "farmers_market"] },
  { id: "coffee", label: "Coffee & cafés", symbol: "☕", color: "#79559B", tokens: ["coffee_shop", "coffeehouse", "cafe", "tea_house"] },
  { id: "pharmacy", label: "Pharmacy", symbol: "✚", color: "#3276AC", tokens: ["pharmacy", "drugstore", "pharmacy_and_drug_store"] },
  { id: "parks", label: "Parks", symbol: "🌳", color: "#638431", tokens: ["park", "public_park", "playground", "botanical_garden", "nature_reserve"] },
  { id: "restaurants", label: "Restaurants", symbol: "🍽", color: "#BB543F", tokens: ["restaurant", "diner", "bistro"] },
  { id: "fast_food", label: "Fast food", symbol: "🍟", color: "#AB7217", tokens: ["fast_food_restaurant"] },
  { id: "hardware", label: "Hardware", symbol: "🔨", color: "#586D7B", tokens: ["hardware_store", "home_improvement_store", "building_materials_store", "tool_store"] },
];

/**
 * Priority matters: some taxonomies contain parent categories (e.g. restaurant).
 * We classify fast food separately, never as a sit-down restaurant, and never
 * treat all casual_eatery records (including dessert shops) as restaurants.
 * Overture does not reliably identify locally owned vs chain restaurants.
 */
export function categoryForPlace(place: Place): CategoryId | null {
  const tokens = new Set([place.category, ...place.taxonomy]);
  if (tokens.has("fast_food_restaurant")) return "fast_food";
  for (const config of CATEGORIES) {
    if (config.tokens.some((token) => tokens.has(token))) return config.id;
  }
  return null;
}

export function belongsToCategory(place: Place, category: CategoryId): boolean {
  return categoryForPlace(place) === category;
}
