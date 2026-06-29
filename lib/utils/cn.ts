import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 * Combines clsx (conditional logic) with tailwind-merge (conflict resolution).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
