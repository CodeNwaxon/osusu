"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  source: { name: string };
  publishedAt: string;
}

export function FinancialNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinanceNews, setIsFinanceNews] = useState(true);
  const [error, setError] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/news");
      if (!response.ok) throw new Error("Failed to fetch news");
      const data = await response.json();

      const hasFinanceNews = data.articles?.some((article: NewsArticle) =>
        article.source?.name?.toLowerCase().includes("business") ||
        article.source?.name?.toLowerCase().includes("financial") ||
        article.source?.name?.toLowerCase().includes("economy") ||
        article.title?.toLowerCase().includes("business") ||
        article.title?.toLowerCase().includes("finance") ||
        article.title?.toLowerCase().includes("economy") ||
        article.title?.toLowerCase().includes("naira") ||
        article.title?.toLowerCase().includes("bank") ||
        article.title?.toLowerCase().includes("market")
      );

      setIsFinanceNews(hasFinanceNews || data.articles?.length >= 4);
      // CHANGE: Fetch 10 articles
      setArticles(data.articles?.slice(0, 10) || []);
    } catch (error) {
      console.error("Error fetching news:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // CHANGE: All 10 articles are scrollable
  const scrollArticles = articles.slice(0, 10);

  if (loading) {
    return (
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-10">
            <Newspaper className="h-7 w-7 text-primary animate-pulse" />
            <h2 className="text-xl md:text-4xl font-bold text-foreground">
              Nigerian Financial News
            </h2>
          </div>
          {/* CHANGE: Show 10 loading skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Card key={i} className="animate-pulse h-28 md:h-72 bg-muted border-border/30" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-primary" />
            <div>
              <h2 className="text-xl md:text-4xl font-bold text-foreground">
                {isFinanceNews ? "Nigerian Financial News" : "Top Nigerian News"}
              </h2>
              {!isFinanceNews && (
                <p className="text-sm text-muted-foreground mt-1">
                  Financial news temporarily unavailable - showing top stories
                </p>
              )}
              {error && (
                <p className="text-sm text-red-500 mt-1">
                  Using cached news data
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchNews}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Refresh news"
          >
            <RefreshCw className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No news available at the moment.
            </p>
            <button
              onClick={fetchNews}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            {/* CHANGE: All 10 articles in scrollable container */}
            {scrollArticles.length > 0 && (
              <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 py-2">
                  {scrollArticles.map((article, i) => (
                    <NewsCard key={`scroll-${i}`} article={article} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// NewsCard with rounded (not rounded-2xl), image on left
function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card className="overflow-hidden border-border/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30 rounded">
        <div className="flex flex-row items-stretch">
          {/* Image - LEFT side (smaller) */}
          <div className="relative w-24 md:w-36 flex-shrink-0 bg-muted overflow-hidden">
            {article.urlToImage ? (
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-orange-100 dark:from-primary/5 dark:to-orange-900/20">
                <Newspaper className="h-5 w-5 md:h-7 md:w-7 text-primary/30" />
              </div>
            )}

            {/* Finance badge overlay on image */}
            {(article.source?.name?.toLowerCase().includes("business") ||
              article.source?.name?.toLowerCase().includes("financial") ||
              article.title?.toLowerCase().includes("business") ||
              article.title?.toLowerCase().includes("finance") ||
              article.title?.toLowerCase().includes("naira") ||
              article.title?.toLowerCase().includes("bank") ||
              article.title?.toLowerCase().includes("market")) && (
                <Badge className="absolute bottom-1 left-1 bg-green-600/80 text-white text-[6px] md:text-[8px] backdrop-blur-sm border-0 px-1 py-0.5">
                  Finance
                </Badge>
              )}
          </div>

          {/* Text content - RIGHT side */}
          <div className="flex-1 min-w-0 p-2.5 md:p-4">
            <Badge className="text-[7px] md:text-[10px] bg-black/60 text-white border-0 mb-1">
              {article.source.name}
            </Badge>

            <h3 className="text-[10px] md:text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            <p className="text-[9px] md:text-xs text-muted-foreground line-clamp-2 mt-0.5 md:mt-1 mb-1 md:mb-2">
              {article.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[7px] md:text-[10px] text-muted-foreground">
                {new Date(article.publishedAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <ExternalLink className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}