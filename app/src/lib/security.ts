/**
 * Security utility helpers to prevent vulnerabilities (XSS, Injection, Redirects)
 */

/**
 * Sanitizes a URL to prevent DOM-based Cross-Site Scripting (XSS) via javascript:/data: protocol injection.
 * Only allows safe protocols: http, https, mailto, tel, relative paths (/), or page anchors (#).
 * 
 * @param url The input URL string to validate and sanitize.
 * @returns The sanitized URL string, or a safe default ('#') if unsafe.
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // Regex to match javascript:, data:, vbscript: protocols at the start of the string
  const unsafeProtocolRegex = /^(javascript|data|vbscript):/i;

  // Regex to confirm safe protocols or relative/anchor patterns
  const safeProtocolRegex = /^(https?:\/\/|\/|#|mailto:|tel:)/i;

  // Check if it has an unsafe protocol or does not match safe protocols
  if (unsafeProtocolRegex.test(trimmed) || !safeProtocolRegex.test(trimmed)) {
    // If it's a simple anchor or relative link without protocol, allow it
    if (/^[a-zA-Z0-9_\-\/]+$/.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
    console.warn(`Blocked unsafe URL protocol attempt: "${trimmed}"`);
    return '#';
  }

  return trimmed;
};
