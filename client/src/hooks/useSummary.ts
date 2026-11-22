// Server-Sent Events: the browser's built-in EventSource listens to a one-way stream
// and reconnects by itself. Ideal when only the server talks (here: live summaries).
import { useEffect, useState } from "react";

import { API_URL } from "@/lib/rest";

export function useSummary(docId: string) {
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!docId) return;
    const source = new EventSource(`${API_URL}/api/documents/${docId}/summary`, { withCredentials: true });

    const handleSummary = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.summary !== undefined) {
          setSummary(parsed.summary);
        }
      } catch {
        // Discard invalid JSON payloads
      }
    };

    source.addEventListener("summary", handleSummary);

    return () => {
      source.removeEventListener("summary", handleSummary);
      source.close();
    };
  }, [docId]);

  return summary;
}
