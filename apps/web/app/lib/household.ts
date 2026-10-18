import type { Nutrients } from "./safety";

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type HouseholdItem = {
  id: string;
  productName: string;
  confirmedAt: string;
  per100g: Nutrients;
  allergens: string[];
  ingredients: string[];
  fitAtConfirm: { safe: boolean; reasons: string[] };
  followUpAt: string;
  weekLaterAgrees: boolean | null;
};

export function agreementSummary(
  items: Array<Pick<HouseholdItem, "followUpAt" | "weekLaterAgrees">>,
  now = Date.now(),
) {
  const due = items.filter((item) => Date.parse(item.followUpAt) <= now);
  const answered = due.filter((item) => item.weekLaterAgrees !== null);
  const agrees = answered.filter((item) => item.weekLaterAgrees === true).length;
  return {
    due: due.length,
    answered: answered.length,
    agrees,
    measured: answered.length > 0,
  };
}
