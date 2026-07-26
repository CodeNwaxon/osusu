"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "faq"));
        const list: FAQItem[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as FAQItem);
        });
        setFaqs(list);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  return (
    <div className="container mx-auto py-16 px-4 md:px-6 max-w-3xl min-h-[70vh]">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent flex justify-center items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" /> Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground text-lg">
          Find answers to common questions about using Osusu 9ja.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg border border-border" />
          ))}
        </div>
      ) : faqs.length > 0 ? (
        <Accordion className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.id} value={`item-${index}`} className="border rounded-lg px-4 bg-card shadow-sm">
              <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed whitespace-pre-wrap pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-muted-foreground">No FAQs available yet.</h3>
          <p className="text-sm text-muted-foreground">Check back later for updates.</p>
        </div>
      )}
    </div>
  );
}
