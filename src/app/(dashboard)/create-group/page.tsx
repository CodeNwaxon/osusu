"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChargePreview } from "@/components/ChargePreview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// generateRefCode is generated inline

const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  amount: z.coerce.number().min(1000, "Minimum contribution is ₦1,000"),
  duration: z.coerce.number().min(2, "Minimum duration is 2 months").max(12, "Maximum duration is 12 months"),
  totalMembers: z.coerce.number().min(2, "Minimum members is 2").max(12, "Maximum members is 12"),
  payoutDay: z.coerce.number().min(1, "Day must be between 1 and 31").max(31, "Day must be between 1 and 31"),
  payoutChargeType: z.enum(["none", "fixed", "percentage"]),
  payoutChargeValue: z.coerce.number(),
  bankDetails: z.object({
    accountName: z.string().min(2, "Account name required"),
    accountNumber: z.string().length(10, "Account number must be 10 digits"),
    bank: z.string().min(2, "Bank name required"),
  }),
}).superRefine((data, ctx) => {
  if (data.payoutChargeType === "fixed" && data.payoutChargeValue > 500) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max fixed charge is ₦500",
      path: ["payoutChargeValue"],
    });
  }
  if (data.payoutChargeType === "percentage" && data.payoutChargeValue > 0.005) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max percentage charge is 0.5% (0.005)",
      path: ["payoutChargeValue"],
    });
  }
});

type FormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createGroupSchema) as any,
    defaultValues: {
      name: "",
      amount: 0,
      duration: 2,
      totalMembers: 2,
      payoutDay: 1,
      payoutChargeType: "none",
      payoutChargeValue: 0,
      bankDetails: {
        accountName: "",
        accountNumber: "",
        bank: "",
      },
    },
  });

  const watchChargeType = form.watch("payoutChargeType");

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("You must be logged in to create a group");
      return;
    }

    setLoading(true);
    try {
      const refCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const docRef = await addDoc(collection(db, "groups"), {
        ...values,
        creatorId: user.uid,
        refCode,
        status: "active",
        createdAt: serverTimestamp(),
      });

      toast.success("Group created successfully!");
      router.push(`/group/${docRef.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl px-3 md:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Create an Osusu Group</CardTitle>
          <CardDescription>Setup a new group contribution and invite members.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Group Details</h3>
                <div className="py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Lagos Tech Bros Osusu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="py-4 grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field: { value, onChange, ...field } }: { field: any }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Contribution Amount (₦)
                          <button 
                            type="button" 
                            onClick={() => toast.info("This is the amount each member contributes per cycle")} 
                            className="inline-flex items-center justify-center rounded-full w-4 h-4 bg-zinc-200 text-zinc-600 text-[10px] font-bold hover:bg-zinc-300 transition-colors cursor-pointer"
                          >
                            !
                          </button>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="50,000" 
                            {...field}
                            value={value ? Number(value).toLocaleString() : ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/,/g, "");
                              if (!isNaN(Number(val))) {
                                onChange(val);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payoutDay"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Payout Day (1-31)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="py-4 grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Duration (Months)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalMembers"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Total Members</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium border-b pb-2">Admin Payout Charge</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payoutChargeType"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Charge Type</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="none">None</option>
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchChargeType !== "none" && (
                    <FormField
                      control={form.control}
                      name="payoutChargeValue"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>
                            {watchChargeType === "fixed" ? "Amount (Max ₦500)" : "Percentage (Max 0.005 for 0.5%)"}
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step={watchChargeType === "percentage" ? "0.001" : "1"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <ChargePreview control={form.control as any} />
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium border-b pb-2">Bank Details (For receiving funds)</h3>
                <FormField
                  control={form.control}
                  name="bankDetails.accountName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankDetails.accountNumber"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="0123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.bank"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Guaranty Trust Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {!user && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-md text-center font-medium">
                  Please sign in to create a contribution group.
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Group..." : "Create Osusu Group"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
