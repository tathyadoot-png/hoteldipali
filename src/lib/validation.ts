// Validates a visitor-typed Indian mobile number for the enquiry form. This is
// deliberately more permissive than content/schemas/common.ts's indianMobileSchema
// (which enforces the canonical "+91 XXXXX XXXXX" format for OUR stored data) —
// a guest might type "9876543210", "+91-98765-43210", "091 98765 43210", etc.
export function isValidIndianMobile(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  // Accept a bare 10-digit number, or with a leading 0 or 91/+91 country code.
  const national = digits.length === 10 ? digits : digits.replace(/^(0|91)/, "");
  return /^[6-9]\d{9}$/.test(national) && (digits.length === 10 || digits.length <= 12);
}

// Simple, permissive email shape check for client-side form feedback — not a
// deliverability guarantee, just enough to catch obvious typos.
export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}
