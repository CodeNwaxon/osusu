import { NextResponse } from "next/server";

export async function GET() {
  try {
    // First: Try Nigerian news (general)
    const nigeriaResponse = await fetch(
      `https://gnews.io/api/v4/top-headlines?country=ng&max=8&apikey=${process.env.GNEWS_API}`,
      { next: { revalidate: 3600 } }
    );

    if (nigeriaResponse.ok) {
      const nigeriaData = await nigeriaResponse.json();

      if (nigeriaData.articles && nigeriaData.articles.length >= 4) {
        return NextResponse.json({
          articles: nigeriaData.articles.map((article: any) => ({
            title: article.title,
            description: article.description || "Read more about this story.",
            url: article.url,
            urlToImage: article.image || null,
            source: { name: article.source?.name || "GNews" },
            publishedAt: article.publishedAt || new Date().toISOString(),
          })),
        });
      }
    }

    // Fallback: Nigerian business/finance news
    const financeResponse = await fetch(
      `https://gnews.io/api/v4/top-headlines?category=business&country=ng&max=8&apikey=${process.env.GNEWS_API}`,
      { next: { revalidate: 3600 } }
    );

    if (financeResponse.ok) {
      const financeData = await financeResponse.json();

      if (financeData.articles && financeData.articles.length >= 4) {
        return NextResponse.json({
          articles: financeData.articles.map((article: any) => ({
            title: article.title,
            description: article.description || "Read more about this story.",
            url: article.url,
            urlToImage: article.image || null,
            source: { name: article.source?.name || "GNews" },
            publishedAt: article.publishedAt || new Date().toISOString(),
          })),
        });
      }
    }

    // Second fallback: Search for Nigerian news with keywords
    const searchResponse = await fetch(
      `https://gnews.io/api/v4/search?q=Nigeria&max=8&apikey=${process.env.GNEWS_API}`,
      { next: { revalidate: 3600 } }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();

      if (searchData.articles && searchData.articles.length >= 4) {
        return NextResponse.json({
          articles: searchData.articles.map((article: any) => ({
            title: article.title,
            description: article.description || "Read more about this story.",
            url: article.url,
            urlToImage: article.image || null,
            source: { name: article.source?.name || "GNews" },
            publishedAt: article.publishedAt || new Date().toISOString(),
          })),
        });
      }
    }

    // Final fallback: Mock Nigerian news data
    return NextResponse.json({
      articles: [
        {
          title: "Nigeria's Economy Shows Resilience Despite Global Challenges",
          description: "The Nigerian economy continues to show strength in the face of global economic headwinds.",
          url: "#",
          urlToImage: null,
          source: { name: "Nigerian Business News" },
          publishedAt: new Date().toISOString(),
        },
        {
          title: "Nigerian Government Announces New Infrastructure Projects",
          description: "Major infrastructure development projects set to create thousands of jobs across the country.",
          url: "#",
          urlToImage: null,
          source: { name: "Nigerian Times" },
          publishedAt: new Date().toISOString(),
        },
        {
          title: "Tech Sector Growth Drives Nigerian Economy Forward",
          description: "Nigeria's technology sector continues to attract foreign investment and drive economic growth.",
          url: "#",
          urlToImage: null,
          source: { name: "Tech Economy Nigeria" },
          publishedAt: new Date().toISOString(),
        },
        {
          title: "New Banking Regulations Aim to Strengthen Financial Sector",
          description: "The Central Bank of Nigeria introduces new regulations to enhance financial stability.",
          url: "#",
          urlToImage: null,
          source: { name: "Financial Times Nigeria" },
          publishedAt: new Date().toISOString(),
        },
        {
          title: "Agriculture Sector Boosts Nigerian Exports",
          description: "Agricultural exports show significant growth, contributing to Nigeria's trade balance.",
          url: "#",
          urlToImage: null,
          source: { name: "Nigerian Agriculture" },
          publishedAt: new Date().toISOString(),
        },
        {
          title: "Digital Economy Creates New Opportunities for Nigerian Youth",
          description: "Digital skills training programs are preparing Nigerian youth for the future economy.",
          url: "#",
          urlToImage: null,
          source: { name: "Digital Nigeria" },
          publishedAt: new Date().toISOString(),
        },
      ],
    });

  } catch (error) {
    console.error("News API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}