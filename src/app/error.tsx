"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/log";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError("route_render", error); }, [error]);
  return <main className="fatal"><span aria-hidden="true">⌁</span><h1>That wasn&apos;t on the map.</h1><p>The page hit an unexpected snag. Your neighborhood selections haven&apos;t been sent anywhere.</p><button onClick={reset} type="button">Try again</button></main>;
}
