import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// helper fucntion for conflcting tailwind classes

/**
 * Sanitize a potentially untrusted URL for use in href/src attributes.
 *
 * Rules:
 * - Allow safe relative paths (starting with "/") unchanged
 * - Allow absolute http/https URLs
 * - Block everything else (javascript:, data:, vbscript:, unknown schemes)
 * - On invalid input, return 'about:blank'
 */
export function sanitizeUrl(untrustedUrl) {
  if (typeof untrustedUrl !== 'string') return 'about:blank';

  const trimmed = untrustedUrl.trim();
  if (trimmed === '') return 'about:blank';

  // Safe relative path
  if (trimmed.startsWith('/')) return trimmed;

  try {
    // Support protocol-relative (e.g., //example.com) by providing a base
    const parsed = new URL(trimmed, 'https://dummy-base.local');
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'http:' || protocol === 'https:') {
      // Return absolute URL string
      return parsed.toString();
    }
  } catch (_) {
    // fallthrough to about:blank
  }

  return 'about:blank';
}