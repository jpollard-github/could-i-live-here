import { NextResponse } from "next/server";
import dataset from "../../../../data/places.json";

export function GET() {
  const dataLoaded = dataset.generatedAt !== null && dataset.cities.every((city) => city.places.length > 0);
  const body = {
    status: dataLoaded ? "ok" : "needs_data",
    source: dataset.source,
    generatedAt: dataset.generatedAt,
    cityCounts: Object.fromEntries(dataset.cities.map((city) => [city.id, city.places.length])),
  };
  // Vercel captures this structured log for operational checks; no user data collected.
  console.info(JSON.stringify({ level: "info", event: "health_check", status: body.status }));
  return NextResponse.json(body, { status: dataLoaded ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
