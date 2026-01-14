import Elysia, { t } from "elysia";
import { Planning } from "../../../generated/prismabox/Planning";
import { authPlugin } from "../../hooks/auth.hook";
import { ListPlanningsSchema, PlanningMutateSchema } from "./planning.schema";
import { planningService } from "./planning.service";

const service = planningService();

const PlanningResponse = t.Omit(Planning, ["client"]);

export const planningRoutes = new Elysia({
  prefix: "/planning",
  detail: {
    tags: ["Planning"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app
      .post("/", ({ body }) => service.create(body), {
        body: t.Omit(PlanningMutateSchema, ["id"]),
        response: {
          200: t.Composite([
            PlanningResponse,
            t.Object({
              client: t.Object({
                id: t.String(),
                name: t.String(),
              }),
            }),
          ]),
        },
      })
      .get("/", ({ query }) => service.listAll(query), {
        query: ListPlanningsSchema,
        response: {
          200: t.Object({
            data: t.Array(
              t.Composite([
                PlanningResponse,
                t.Object({
                  client: t.Object({
                    id: t.String(),
                    name: t.String(),
                  }),
                }),
              ]),
            ),
            count: t.Number(),
          }),
        },
      })
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: {
          200: t.Composite([
            Planning,
            t.Object({
              client: t.Any(),
            }),
          ]),
        },
      })
      .put(
        "/:id",
        ({ params, body }) => service.edit({ ...body, id: params.id }),
        {
          body: t.Partial(t.Omit(PlanningMutateSchema, ["id"])),
          response: {
            200: t.Composite([
              PlanningResponse,
              t.Object({
                client: t.Object({
                  id: t.String(),
                  name: t.String(),
                }),
              }),
            ]),
          },
        },
      )
      .delete("/:id", ({ params }) => service.delete(params.id), {
        response: {
          200: t.Object({
            message: t.String(),
          }),
        },
      }),
  );
