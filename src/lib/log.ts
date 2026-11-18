/** Small structured event wrapper. No precise location, names, or user input in logs. */
export function reportClientError(area: string, cause: unknown): void {
  const errorType = cause instanceof Error ? cause.name : typeof cause;
  console.error(JSON.stringify({
    level: "error",
    event: "client_failure",
    area,
    errorType,
    at: new Date().toISOString(),
  }));
}
