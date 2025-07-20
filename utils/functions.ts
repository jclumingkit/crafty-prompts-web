import dayjs from "dayjs";
import { NextResponse } from "next/server";
import { CORS_HEADERS } from "./constant";

export function standardDateFormat(date?: string | Date) {
  return dayjs(date).format("DD MMM [at] hh:mm A");
}

export function extractVariablesFromPromptContent(content: string): string[] {
  const matches = content.match(/{{\s*([\w.-]+)\s*}}/g);
  if (!matches) return [];

  return matches.map((match) => match.replace(/{{\s*|\s*}}/g, ""));
}

export function withCORS(json: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(json), {
    status,
    headers: CORS_HEADERS,
  });
}

export function handleRouteOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
