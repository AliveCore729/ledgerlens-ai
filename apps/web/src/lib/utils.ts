import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard shadcn/ui class merger (Leave this exactly as is)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Updated exact currency formatter
export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return '₹0.00';
  
  // Intl.NumberFormat with 'en-IN' automatically handles the Indian numbering system 
  // (e.g., 1,50,000.00) and ensures exact 2 decimal precision.
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}