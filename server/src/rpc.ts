// gRPC via Connect: the service contract lives in proto/codraft/v1/title.proto.
// Connect serves the same handler over gRPC, gRPC-Web and the Connect protocol,
// so browsers (which can't speak raw gRPC/HTTP2 trailers) can call it with fetch.
import { Code, ConnectError, type ConnectRouter } from "@connectrpc/connect";

import { userIdFromCookies } from "./auth.ts";
import { readLiveText, writeTitle } from "./collab.ts";
import { TitleService } from "./gen/codraft/v1/title_pb.ts";
import { findAccessibleDoc } from "./models.ts";
import { suggestTitle } from "./text.ts";

export default (router: ConnectRouter) =>
  router.service(TitleService, {
    async suggestTitle({ documentId }, context) {
      const userId = userIdFromCookies(context.requestHeader.get("cookie") ?? undefined);
      if (!userId) throw new ConnectError("Not signed in", Code.Unauthenticated);

      const doc = await findAccessibleDoc(documentId, userId);
      if (!doc) throw new ConnectError("Document not found", Code.NotFound);

      const text = (await readLiveText(doc.id)) ?? doc.text;
      if (!text.trim()) throw new ConnectError("Write something first", Code.FailedPrecondition);

      const title = suggestTitle(text);
      await writeTitle(doc.id, title);
      return { title };
    },
  });
