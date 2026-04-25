import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL("/icon.png", request.url);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return new NextResponse(null, { status: 404 });
  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
