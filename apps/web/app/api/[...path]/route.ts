import { NextRequest, NextResponse } from "next/server";

const BACKEND = () => process.env.API_URL || "http://localhost:5000";

async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Strip leading /api to get the backend path, e.g. /api/v1/suggest -> /v1/suggest
  const backendPath = pathname.replace(/^\/api/, "");
  const url = `${BACKEND()}${backendPath}${search}`;

  const headers = new Headers(req.headers);
  // Remove host / next-specific headers so they don't confuse the backend
  headers.delete("host");
  headers.delete("connection");

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(url, init);
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: Object.fromEntries(upstream.headers),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Backend unavailable: ${message}` },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
