import type { SuggestRequest, SuggestResponse, FeedbackRequest, FeedbackResponse } from "./types";

const API_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSuggestion(req: SuggestRequest): Promise<SuggestResponse> {
  const res = await fetchWithTimeout("/api/v1/suggest", {
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
  const res = await fetchWithTimeout("/api/v1/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) return { status: "error", feedback_breakdown: {}, total_feedback: 0 };
  return res.json();
}
