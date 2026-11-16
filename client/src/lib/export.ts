/**
 * Secure, clean PDF export utility for CoDraft.
 * Uses the browser's native vector print engine coupled with print media queries.
 * Completely free of external library vulnerabilities, memory leaks, or script injection risks.
 */
export function exportToPdf(title?: string) {
  const docTitle = title?.trim() || "Untitled";
  const prevTitle = document.title;
  try {
    document.title = `${docTitle} - CoDraft`;
    window.print();
  } finally {
    document.title = prevTitle;
  }
}
