"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const reviews = [
  {
    name: "Aisha Mohammed",
    location: "Lagos",
    rating: 5,
    text: "Osusu made it so easy to save with my colleagues. The transparency feature is amazing — I can see every payment and proof!",
    avatar: "AM",
  },
  {
    name: "Chukwudi Okafor",
    location: "Abuja",
    text: "I was skeptical at first, but the trust system and payout proofs gave me confidence. Already completed 3 groups!",
    rating: 5,
    avatar: "CO",
  },
  {
    name: "Funmilayo Adeyemi",
    location: "Ibadan",
    text: "Finally a platform that understands how Ajo/Esusu works. Clean interface, no hidden fees. Highly recommend.",
    rating: 4,
    avatar: "FA",
  },
];

export function Reviews() {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-1 md:mb-3">
            What Our Users Say
          </h2>
          <p className="text-muted-foreground text-xs md:text-lg max-w-xl mx-auto">
            Trusted by system ment to build wealth together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, i) => (
            <Card
              key={i}
              className="border-border/30 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <CardContent className="pt-6 pb-6">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`h-4 w-4 ${j < review.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/30"
                        }`}
                    />
                  ))}
                </div>

                {/* Review text */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  &ldquo;{review.text}&rdquo;
                </p>

                {/* Reviewer info */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-orange-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{review.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
