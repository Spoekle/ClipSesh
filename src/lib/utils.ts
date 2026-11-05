import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins conditional class names and resolves conflicting Tailwind utilities,
 * letting later classes win.
 *
 * @example
 * cn('px-2 rounded-lg', isActive && 'bg-primary', 'rounded-full');
 * // => 'px-2 bg-primary rounded-full'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
