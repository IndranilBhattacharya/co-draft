// gRPC client for the "Suggest title" button.
// `TitleService` is generated from proto/codraft/v1/title.proto by `npm run gen:proto`,
// so the client and server can't disagree about the request and response shapes.
// Browsers can't speak raw gRPC, so Connect sends the same calls over normal fetch.
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { TitleService } from "@/gen/codraft/v1/title_pb";
import { API_URL } from "@/lib/rest";

const transport = createConnectTransport({
  baseUrl: API_URL,
  useBinaryFormat: true, // real protobuf bytes on the wire (JSON is the default)
  fetch: (input, init) => fetch(input, { ...init, credentials: "include" }), // carry the session cookie
});

export const titles = createClient(TitleService, transport);
