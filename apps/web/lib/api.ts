import type { SuggestRequest, SuggestResponse, FeedbackRequest, FeedbackResponse } from "./types";

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

export async function submitFeedback(req: FeedbackRequest): Promise<FeedbackResponse> {
  const res = await fetch("/api/v1/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) return { status: "error", feedback_breakdown: {}, total_feedback: 0 };
  return res.json();
}
