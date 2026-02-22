import { NextResponse } from "next/server";
import { getApiDocsMarkdown } from "../../../../../lib/server/data";

export async function GET() {
  try {
    const content = getApiDocsMarkdown();
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ detail: "API docs not found" }, { status: 404 });
  }
}
