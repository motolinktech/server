import Elysia, { t } from "elysia";
import { WorkShiftSlot } from "../../../generated/prismabox/WorkShiftSlot";
import { authPlugin } from "../../plugins/auth.plugin";
import { invitesRoutes } from "./invites/invites.routes";
import {
  CheckInOutSchema,
  CopyWorkShiftSlotsSchema,
  ListWorkShiftSlotsByGroupSchema,
  ListWorkShiftSlotsSchema,
  MarkAbsentSchema,
  WorkShiftSlotMutateSchema,
} from "./workShiftSlots.schema";
import { workShiftSlotsService } from "./workShiftSlots.service";

const service = workShiftSlotsService();

const WorkShiftSlotResponse = t.Composite([
  t.Omit(WorkShiftSlot, [
    "deliveryman",
    "client",
    "paymentRequests",
    "invites",
    "deliverymanAmountDay",
    "deliverymanAmountNight",
    "deliverymanPerDeliveryDay",
    "deliverymanPerDeliveryNight",
  ]),
  t.Object({
    deliverymanAmountDay: t.String(),
    deliverymanAmountNight: t.String(),
    deliverymanPerDeliveryDay: t.String(),
    deliverymanPerDeliveryNight: t.String(),
  }),
]);

export const workShiftSlotsRoutes = new Elysia({
  prefix: "/work-shift-slots",
  detail: {
    tags: ["WorkShiftSlots"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app
      .post("/", ({ body, user }) => service.create(body, user!.id), {
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
            WorkShiftSlotResponse,
            t.Object({
              deliveryman: t.Nullable(t.Any()),
              client: t.Any(),
            }),
          ]),
        },
      })
      .get(
        "/group/:groupId",
        async ({ params, query }) => {
          const result = await service.getByGroup(params.groupId, query);
          return Object.fromEntries(
            Object.entries(result).map(([key, arr]) => [
              key,
              arr.map((item) => ({
                ...item,
                deliverymanAmountDay:
                  (item as any).deliverymanAmountDay?.toString?.() ?? "0",
                deliverymanAmountNight:
                  (item as any).deliverymanAmountNight?.toString?.() ?? "0",
              })),
            ]),
          );
        },
        {
          params: t.Object({
            groupId: t.String(),
          }),
          query: ListWorkShiftSlotsByGroupSchema,
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
        ({ params, body, user }) => service.edit({ ...body, id: params.id }, user!.id),
        {
          body: t.Omit(WorkShiftSlotMutateSchema, ["id"]),
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/check-in",
        ({ params, body, user }) => service.checkIn(params.id, body, user!.id),
        {
          body: CheckInOutSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/check-out",
        ({ params, body, user }) => service.checkOut(params.id, body, user!.id),
        {
          body: CheckInOutSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/confirm-completion",
        ({ params, user }) => service.confirmCompletion(params.id, user!.id),
        {
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/mark-absent",
        ({ params, body, user }) => service.markAbsent(params.id, body, user!.id),
        {
          body: MarkAbsentSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .delete("/:id", ({ params, user }) => service.delete(params.id, user!.id), {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: WorkShiftSlotResponse,
        },
      })
      .post(
        "/:id/connect-tracking",
        ({ params, user }) => service.connectTracking(params.id, user!.id),
        {
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post("/copy", ({ body, user }) => service.copyShifts(body, user!.id), {
        body: CopyWorkShiftSlotsSchema,
        response: {
          200: t.Object({
            copiedShifts: t.Array(WorkShiftSlotResponse),
            warnings: t.Nullable(
              t.Object({
                message: t.String(),
                conflictedShifts: t.Array(
                  t.Object({
                    sourceShiftId: t.String(),
                    deliverymanId: t.String(),
                    deliverymanName: t.String(),
                    conflictingShiftId: t.String(),
                  }),
                ),
              }),
            ),
          }),
        },
      }),
  )
  .use(invitesRoutes);
