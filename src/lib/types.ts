export type Coordinate = { lng: number; lat: number };

export type Place = Coordinate & {
  id: string;
  name: string;
  /** Overture basic_category, not a guessed business category. */
  category: string;
  /** Overture taxonomy hierarchy, e.g. ["food_and_drink", "restaurant", ...]. */
  taxonomy: string[];
  address?: string;
  confidence?: number;
};

export type CityId = "lexington" | "kernersville";

export type CityData = {
  id: CityId;
  name: string;
  region: string;
  center: [number, number];
  bbox: [number, number, number, number];
  places: Place[];
};

export type PlacesDataset = {
  schemaVersion: number;
  generatedAt: string | null;
  source: string;
  cities: CityData[];
};

export type CategoryId = "groceries" | "coffee" | "pharmacy" | "parks" | "restaurants" | "hardware";

export type Anchor = Coordinate & { label: string };
