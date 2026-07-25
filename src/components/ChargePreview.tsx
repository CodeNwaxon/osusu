"use client";

import { useWatch, Control } from "react-hook-form";
import { calculateNet, PayoutChargeType } from "@/lib/calculations";
import { Badge } from "@/components/ui/badge";

interface ChargePreviewProps {
  control: Control<any>;
}

export function ChargePreview({ control }: ChargePreviewProps) {
  const amount = useWatch({ control, name: "amount", defaultValue: 0 });
  const chargeType = useWatch({ control, name: "payoutChargeType", defaultValue: "none" }) as PayoutChargeType;
  const chargeValue = useWatch({ control, name: "payoutChargeValue", defaultValue: 0 });

  const { net, charge } = calculateNet(Number(amount), chargeType, Number(chargeValue));

  if (!amount || amount <= 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-muted rounded-lg border border-border flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Collector will receive:</span>
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
