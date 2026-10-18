const LENGTHS = new Set([8, 12, 13, 14]);

export type BarcodeCheck = {
  ok: boolean;
  digits: string;
  reason?: string;
};

/** Same GS1 check as the API. A failed digit is not sent to Open Food Facts. */
export function checkBarcode(code: string): BarcodeCheck {
  const digits = code.replace(/\D/g, "");
  if (!LENGTHS.has(digits.length)) {
    return {
      ok: false,
      digits,
      reason: "Enter an 8, 12, 13, or 14 digit barcode.",
    };
  }

  const numbers = digits.split("").map((digit) => Number(digit));
  const check = numbers.pop() ?? -1;
  let sum = 0;
  numbers.reverse().forEach((digit, index) => {
    sum += digit * (index % 2 === 0 ? 3 : 1);
  });
  const expected = (10 - (sum % 10)) % 10;
  if (expected !== check) {
    return {
      ok: false,
      digits,
      reason: `Check digit is ${check}. A GS1 barcode with these digits should end in ${expected}. A misread digit is a different product, so this code was not looked up.`,
    };
  }
  return { ok: true, digits };
}
