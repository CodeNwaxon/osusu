"use client";

import { useWatch, Control } from "react-hook-form";
import { calculateNet, PayoutChargeType } from "@/lib/calculations";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ChargePreviewProps {
  control: Control<any>;
}

export function ChargePreview({ control }: ChargePreviewProps) {
  const amount = useWatch({ control, name: "amount", defaultValue: 0 });
  const totalMembers = useWatch({ control, name: "totalMembers", defaultValue: 2 });
  const chargeType = useWatch({ control, name: "payoutChargeType", defaultValue: "none" }) as PayoutChargeType;
  const chargeValue = useWatch({ control, name: "payoutChargeValue", defaultValue: 0 });

  const grossPayout = Number(amount) * Number(totalMembers);
  const { net, charge } = calculateNet(grossPayout, chargeType, Number(chargeValue));

  if (!amount || amount <= 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-muted rounded-lg border border-border flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1">
          Collector will receive:
          <button 
            type="button" 
            onClick={() => toast.info("Payout is Contributed Amount × Number of Participants, minus any Admin Charges.")} 
            className="inline-flex items-center justify-center rounded-full w-4 h-4 bg-zinc-200 text-zinc-600 text-[10px] font-bold hover:bg-zinc-300 transition-colors cursor-pointer"
          >
            !
          </button>
        </span>
        <span className="text-lg font-bold text-primary">
          {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(net)}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Payout Charge:</span>
        {charge === 0 ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            No Payout Fee
          </Badge>
        ) : (
          <span className="text-sm font-medium text-destructive">
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(charge)}
          </span>
        )}
      </div>
    </div>
  );
}
