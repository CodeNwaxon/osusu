export type PayoutChargeType = "none" | "fixed" | "percentage";

export function calculateNet(amount: number, type: PayoutChargeType, value: number): { gross: number, charge: number, net: number } {
  if (type === "none" || !value) {
    return { gross: amount, charge: 0, net: amount };
  }

  let charge = 0;
  if (type === "fixed") {
    charge = Math.min(value, 500); // Max cap 500 NGN
  } else if (type === "percentage") {
    // Value is expected to be decimal representation of percentage (e.g., 0.005 for 0.5%)
    const percentage = Math.min(value, 0.005); // Max cap 0.5%
    charge = amount * percentage;
  }

  return {
    gross: amount,
    charge: charge,
    net: amount - charge
  };
}
