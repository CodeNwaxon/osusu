"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Newspaper } from "lucide-react";

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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) throw new Error("Failed to fetch news");
        const data = await response.json();
        setArticles(data.articles?.slice(0, 4) || []);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-10">
          <Newspaper className="h-7 w-7 text-primary" />
          <h2 className="text-xl md:text-4xl font-bold text-foreground">
            Nigerian Financial News
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse h-72 bg-muted border-border/30" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No financial news available at the moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden border-border/30 h-full hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30">
                  {/* Image */}
                  <div className="relative h-40 bg-muted overflow-hidden">
                    {article.urlToImage ? (
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-orange-100 dark:from-primary/5 dark:to-orange-900/20">
                        <Newspaper className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-black/60 text-white text-[10px] backdrop-blur-sm border-0">
                      {article.source.name}
                    </Badge>
                  </div>

                  <CardContent className="pt-4 pb-4">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(article.publishedAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
