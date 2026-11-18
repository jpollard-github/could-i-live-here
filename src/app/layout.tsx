import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Could I Live Here? | A neighborhood reality check",
  description: "Before falling in love with the house, meet the neighborhood. Compare nearby essentials with open Overture Maps data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
