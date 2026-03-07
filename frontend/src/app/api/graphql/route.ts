import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const graphqlEndpoint =
  process.env.GRAPHQL_INTERNAL_URL ?? "http://localhost:3000/graphql";

function jsonError(message: string, status: number) {
  return NextResponse.json({ errors: [{ message }] }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const upstreamResponse = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
      },
      body,
      cache: "no-store",
    });

    const responseText = await upstreamResponse.text();

    return new NextResponse(responseText, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GraphQL proxy request failed";

    return jsonError(message, 502);
  }
}

export function GET() {
  return jsonError("Use POST /api/graphql with a GraphQL query payload.", 405);
}
