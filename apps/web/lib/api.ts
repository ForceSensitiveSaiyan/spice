import type { SuggestRequest, SuggestResponse } from "./types";

export async function fetchSuggestion(req: SuggestRequest): Promise<SuggestResponse> {
  const res = await fetch("/api/v1/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}
