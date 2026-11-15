// gRPC client. The typed `TitleService` comes from proto/codraft/v1/title.proto (npm run gen:proto).
// Connect speaks a browser-friendly flavor of gRPC over plain fetch.
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { TitleService } from "@/gen/codraft/v1/title_pb";
import { API_URL } from "@/lib/api";

const transport = createConnectTransport({
  baseUrl: API_URL,
  useBinaryFormat: true, // real protobuf bytes on the wire (JSON is the default)
  fetch: (input, init) => fetch(input, { ...init, credentials: "include" }), // carry the session cookie
});

export const titles = createClient(TitleService, transport);
