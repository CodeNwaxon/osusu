import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 md:px-6">
      <div className="mb-12 space-y-4 text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-foreground md:text-4xl">
          <FileText className="h-8 w-8 text-primary" /> Privacy Policy
        </h1>
        <p className="text-lg text-muted-foreground">
          How Osusu 9ja uses information when you use the platform.
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="space-y-8 p-6 text-muted-foreground md:p-10">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Information you provide</h2>
            <p>
              Osusu may store account details provided during sign-in, such as your name, email address, and profile image. Information you submit while creating or joining a group, contacting a creator, or sending support messages is also stored to provide those services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">How information is used</h2>
            <p>
              Information is used to operate accounts, display group membership and activity, deliver notifications, and respond to support requests. Group information and activity may be visible to members of that group.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Service providers and payments</h2>
            <p>
              Osusu uses Firebase services for authentication and data storage. Contributions and any joining fee are arranged directly between members and group creators; Osusu does not collect or hold those payments.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Questions</h2>
            <p>
              For privacy questions or requests about your information, contact the Osusu support team through the <a href="/contact" className="font-medium text-primary underline underline-offset-4">Contact Us</a> page.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}