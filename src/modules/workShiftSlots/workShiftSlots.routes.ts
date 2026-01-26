import Elysia, { t } from "elysia";
import { WorkShiftSlot } from "../../../generated/prismabox/WorkShiftSlot";
import { authPlugin } from "../../plugins/auth.plugin";
import {
  AcceptInviteSchema,
  CheckInOutSchema,
  CopyWorkShiftSlotsSchema,
  ListWorkShiftSlotsByGroupSchema,
  ListWorkShiftSlotsSchema,
  MarkAbsentSchema,
  SendInviteSchema,
  WorkShiftSlotMutateSchema,
} from "./workShiftSlots.schema";
import { workShiftSlotsService } from "./workShiftSlots.service";

const service = workShiftSlotsService();

const WorkShiftSlotResponse = t.Composite([
  t.Omit(WorkShiftSlot, [
    "deliveryman",
    "client",
    "paymentRequests",
    "deliverymanAmountDay",
    "deliverymanAmountNight",
  ]),
  t.Object({
    deliverymanAmountDay: t.String(),
    deliverymanAmountNight: t.String(),
  }),
]);

export const workShiftSlotsRoutes = new Elysia({
  prefix: "/work-shift-slots",
  detail: {
    tags: ["WorkShiftSlots"],
  },
})
  .use(authPlugin)
  .post(
    "/accept-invite/:token",
    ({ params, body }) => service.acceptInvite({ ...body, ...params }),
    {
      params: t.Object({
        token: t.String(),
      }),
      body: AcceptInviteSchema,
      response: {
        200: WorkShiftSlotResponse,
      },
    },
  )
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
        ({ params, body }) => service.edit({ ...body, id: params.id }),
        {
          body: t.Omit(WorkShiftSlotMutateSchema, ["id"]),
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/send-invite",
        ({ params, body }) => service.sendInvite(params.id, body),
        {
          body: SendInviteSchema,
          response: {
            200: t.Object({
              inviteToken: t.Nullable(t.String()),
              inviteSentAt: t.Nullable(t.Date()),
              inviteExpiresAt: t.Nullable(t.Date()),
            }),
          },
        },
      )
      .post(
        "/:id/check-in",
        ({ params, body }) => service.checkIn(params.id, body),
        {
          body: CheckInOutSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/check-out",
        ({ params, body }) => service.checkOut(params.id, body),
        {
          body: CheckInOutSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/confirm-completion",
        ({ params }) => service.confirmCompletion(params.id),
        {
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post(
        "/:id/mark-absent",
        ({ params, body }) => service.markAbsent(params.id, body),
        {
          body: MarkAbsentSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .delete("/:id", ({ params }) => service.delete(params.id), {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: WorkShiftSlotResponse,
        },
      })
      .post(
        "/:id/connect-tracking",
        ({ params }) => service.connectTracking(params.id),
        {
          response: {
            200: WorkShiftSlotResponse,
          },
        },
      )
      .post("/copy", ({ body }) => service.copyShifts(body), {
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
  );
