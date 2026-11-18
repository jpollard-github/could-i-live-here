import datasetJson from "../../data/places.json";
import { Explorer } from "@/components/explorer";
import type { PlacesDataset } from "@/lib/types";

export default function Home() {
  return <Explorer dataset={datasetJson as PlacesDataset} />;
}
