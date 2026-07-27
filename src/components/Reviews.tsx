"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, limit, addDoc, deleteDoc, doc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { Button } from "@/components/ui/button";
import { Trash2, Send } from "lucide-react";
import { toast } from "sonner";

interface ReviewData {
  id: string;
  userId?: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  avatar: string;
}

const DEFAULT_REVIEWS: ReviewData[] = [
  {
    id: "1",
    name: "Aisha Mohammed",
    location: "Lagos",
    rating: 5,
    text: "Osusu made it so easy to save with my colleagues. The transparency feature is amazing — I can see every payment and proof!",
    avatar: "AM",
  },
  {
    id: "2",
    name: "Chukwudi Okafor",
    location: "Abuja",
    text: "I was skeptical at first, but the trust system and payout proofs gave me confidence. Already completed 3 groups!",
    rating: 5,
    avatar: "CO",
  },
  {
    id: "3",
    name: "Funmilayo Adeyemi",
    location: "Ibadan",
    text: "Finally a platform that understands how Ajo/Esusu works. Clean interface, no hidden fees. Highly recommend.",
    rating: 4,
    avatar: "FA",
  },
];

export function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewData[]>(DEFAULT_REVIEWS);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc"),
        limit(6)
      );
      const snapshot = await getDocs(reviewsQuery);
      if (!snapshot.empty) {
        const fetchedReviews: ReviewData[] = [];
        snapshot.forEach((docSnap) => {
          fetchedReviews.push({ id: docSnap.id, ...docSnap.data() } as ReviewData);
        });
        setReviews(fetchedReviews);
        
        if (user) {
          const userHasReview = fetchedReviews.some(r => r.userId === user.uid);
          if (userHasReview) {
            setHasReviewed(true);
          } else {
            // Check if user has review beyond the limit(6)
            const userReviewQuery = query(collection(db, "reviews"), where("userId", "==", user.uid));
            const userSnap = await getDocs(userReviewQuery);
            setHasReviewed(!userSnap.empty);
          }
        }
      } else if (user) {
        const userReviewQuery = query(collection(db, "reviews"), where("userId", "==", user.uid));
        const userSnap = await getDocs(userReviewQuery);
        setHasReviewed(!userSnap.empty);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !user) return;
    
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        userId: user.uid,
        name: user.displayName || "Anonymous User",
        email: user.email || "",
        avatar: user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "US",
        text: reviewText.trim(),
        rating: reviewRating,
        location: "Nigeria", // default
        createdAt: serverTimestamp()
      });
      toast.success("Review submitted successfully! Thank you.");
      setReviewText("");
      setReviewRating(5);
      setShowReviewForm(false);
      setHasReviewed(true);
      fetchReviews(); // Refresh
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Ensure you are logged in.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review deleted successfully.");
      setHasReviewed(false);
      fetchReviews(); // Refresh
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review.");
    }
  };

  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-1 md:mb-3">
            What Our Users Say
          </h2>
          <p className="text-muted-foreground text-xs md:text-lg max-w-xl mx-auto mb-6">
            Trusted by system ment to build wealth together.
          </p>
          
          {user && !hasReviewed && !showReviewForm && (
            <Button onClick={() => setShowReviewForm(true)} className="rounded-full">
              <Star className="w-4 h-4 mr-2" /> Add Your Review
            </Button>
          )}

          {showReviewForm && (
            <Card className="max-w-xl mx-auto border-border/30 overflow-hidden text-left shadow-lg mb-8">
              <CardContent className="p-6">
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">Leave a Review</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                  </div>
                  <div>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= reviewRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Write your review here..."
                    className="min-h-[100px] resize-none flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={reviewText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)}
                    disabled={submittingReview}
                  />
                  <Button
                    type="submit"
                    disabled={!reviewText.trim() || submittingReview}
                    className="w-full rounded-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white"
                  >
                    {submittingReview ? "Submitting..." : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Submit Review
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="border-border/30 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative"
            >
              {user && review.userId === user.uid && (
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  className="absolute top-4 right-4 text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors"
                  title="Delete your review"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
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
