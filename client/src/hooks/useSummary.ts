// Server-Sent Events: the browser's built-in EventSource listens to a one-way stream
// and reconnects by itself. Ideal when only the server talks (here: live summaries).
import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";

export function useSummary(docId: string) {
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/documents/${docId}/summary`, { withCredentials: true });
    source.addEventListener("summary", (event) => setSummary(JSON.parse(event.data).summary));
    return () => source.close();
  }, [docId]);

  return summary;
}
