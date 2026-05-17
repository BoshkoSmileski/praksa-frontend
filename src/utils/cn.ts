import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine and de-duplicate Tailwind classes.
 *
 * Why this exists:
 *   cn('px-2 py-1', isActive && 'bg-blue-500', 'px-4')  →  'py-1 bg-blue-500 px-4'
 *
 * tailwind-merge ensures `px-4` overrides the earlier `px-2`,
 * so conditional styling Just Works.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
