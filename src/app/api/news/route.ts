import { NextResponse } from "next/server";

const NEWS_API_KEY = "b5d5218722db422887646d22feb36fdd";

export async function GET() {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=ng&category=business&pageSize=4&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 3600 } } // cache for 1 hour
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch news" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
