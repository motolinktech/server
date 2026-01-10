import Elysia, { t } from "elysia";
import { WorkShiftSlot } from "../../../generated/prismabox/WorkShiftSlot";
import { authPlugin } from "../../hooks/auth.hook";
import {
  ListWorkShiftSlotsSchema,
  WorkShiftSlotMutateSchema,
} from "./workShiftSlots.schema";
import { workShiftSlotsService } from "./workShiftSlots.service";

const service = workShiftSlotsService();

const WorkShiftSlotResponse = t.Omit(WorkShiftSlot, ["deliveryman", "client"]);

export const workShiftSlotsRoutes = new Elysia({
  prefix: "/work-shift-slots",
  detail: {
    tags: ["WorkShiftSlots"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app
      .post("/", ({ body }) => service.create(body), {
        body: t.Omit(WorkShiftSlotMutateSchema, ["id"]),
        response: {
          200: WorkShiftSlotResponse,
        },
      })
      .get("/", ({ query }) => service.listAll(query), {
        query: ListWorkShiftSlotsSchema,
        response: {
          200: t.Object({
            data: t.Array(
              t.Composite([
                WorkShiftSlotResponse,
                t.Object({
                  deliveryman: t.Nullable(
                    t.Object({
                      id: t.String(),
                      name: t.String(),
                    }),
                  ),
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
            WorkShiftSlot,
            t.Object({
              deliveryman: t.Nullable(t.Any()),
              client: t.Any(),
            }),
          ]),
        },
      })
      .get(
        "/group/:groupId",
        ({ params }) => service.getByGroup(params.groupId),
        {
          response: {
            200: t.Record(
              t.String(),
              t.Array(
                t.Composite([
                  WorkShiftSlotResponse,
                  t.Object({
                    deliveryman: t.Nullable(
                      t.Object({
                        id: t.String(),
                        name: t.String(),
                      }),
                    ),
                  }),
                ]),
              ),
            ),
          },
        },
      )
      .put(
        "/:id",
        ({ params, body }) => service.edit({ ...body, id: params.id }),
        {
          body: t.Omit(WorkShiftSlotMutateSchema, ["id"]),
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      ),
  );
