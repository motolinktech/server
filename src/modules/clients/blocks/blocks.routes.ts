import Elysia, { t } from "elysia";
import { authPlugin } from "../../../hooks/auth.hook";
import {
  ClientBlockResponseSchema,
  CreateClientBlockSchema,
} from "./blocks.schema";
import { blocksService } from "./blocks.service";

const service = blocksService();

export const blocksRoutes = new Elysia({
  prefix: "/:clientId/blocks",
  detail: {
    tags: ["Client Blocks"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true }, (app) =>
    app
      .post("/", ({ params, body }) => service.create(params.clientId, body), {
        params: t.Object({
          clientId: t.String(),
        }),
        body: CreateClientBlockSchema,
        response: {
          200: ClientBlockResponseSchema,
        },
      })
      .get("/", ({ params }) => service.listByClient(params.clientId), {
        params: t.Object({
          clientId: t.String(),
        }),
        response: {
          200: t.Array(ClientBlockResponseSchema),
        },
      })
      .delete(
        "/:blockId",
        ({ params }) => service.delete(params.clientId, params.blockId),
        {
          params: t.Object({
            clientId: t.String(),
            blockId: t.String(),
          }),
          response: {
            200: ClientBlockResponseSchema,
          },
        },
      ),
  );
