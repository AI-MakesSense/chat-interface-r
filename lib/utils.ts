/**
 * Utility Functions
 *
 * Common utility functions used throughout the application.
 * Includes class name merging with tailwind-merge for optimal CSS.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with Tailwind CSS conflict resolution
 *
 * This function combines clsx for conditional classes and tailwind-merge
 * to handle Tailwind CSS class conflicts intelligently.
 *
 * @param inputs - Class names to merge (strings, objects, arrays)
 * @returns Merged class names with conflicts resolved
 *
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4"
 * cn("text-red-500", condition && "text-blue-500") // conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
