import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  // Remove all non-digit characters except +
  let clean = phone.replace(/[^\d+]/g, '');

  // Format Uzb numbers: 998901234567 or +998901234567
  const isUzb = (clean.startsWith('998') && clean.length === 12) || (clean.startsWith('+998') && clean.length === 13);

  if (isUzb) {
    const numbersOnly = clean.replace('+', '');
    // 998 90 123 45 67
    return `+998 ${numbersOnly.slice(3, 5)} ${numbersOnly.slice(5, 8)} ${numbersOnly.slice(8, 10)} ${numbersOnly.slice(10, 12)}`;
  }

  return phone;
}

export function formatAddress(address: string | null | undefined): string {
  if (!address) return "Адрес не указан";

  // Replace ":" with ": " if no space follows
  return address.replace(/:(?!\s)/g, ': ');
}
