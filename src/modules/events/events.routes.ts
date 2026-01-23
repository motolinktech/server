import Elysia, { t } from "elysia";
import { EventPlain } from "../../../generated/prismabox/Event";
import { authPlugin } from "../../plugins/auth.plugin";
import {
  EventDetailed,
  EventMutateSchema,
  ListEventsSchema,
} from "./events.schema";
import { eventsService } from "./events.service";

const service = eventsService();

const EventResponse = EventPlain;

export const eventsRoutes = new Elysia({
  prefix: "/events",
  detail: { tags: ["Events"] },
})
  .use(authPlugin)
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app
      .post("/", ({ body, user }) => service.create(body, user.id), {
        body: t.Omit(EventMutateSchema, ["id"]),
        response: { 200: EventResponse },
      })
      .get(
        "/",
        ({ query, currentBranch }) => service.list({ ...query, currentBranch }),
        {
          query: ListEventsSchema,
          response: {
            200: t.Object({
              data: t.Array(EventResponse),
              count: t.Number(),
            }),
          },
        },
      )
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: { 200: EventDetailed },
      })
      .put("/:id", ({ params, body }) => service.update(params.id, body), {
        body: t.Omit(EventMutateSchema, ["id"]),
        response: { 200: EventResponse },
      })
      .delete("/:id", ({ params }) => service.delete(params.id)),
  );
