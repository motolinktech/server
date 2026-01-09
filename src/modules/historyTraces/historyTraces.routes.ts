import Elysia from "elysia";
import { authPlugin } from "../../hooks/auth.hook";
import {
  HistoryTraceListQuerySchema,
  HistoryTraceListResponseSchema,
  HistoryTraceResponseSchema,
} from "./historyTraces.schema";
import { historyTraceService } from "./historyTraces.service";

const service = historyTraceService();

export const historyTracesRoutes = new Elysia({
  prefix: "/history-traces",
  detail: {
    tags: ["History Traces"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true }, (app) =>
    app
      .get("/", ({ query }) => service.list(query), {
        query: HistoryTraceListQuerySchema,
        response: {
          200: HistoryTraceListResponseSchema,
        },
      })
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: {
          200: HistoryTraceResponseSchema,
        },
      }),
  );
