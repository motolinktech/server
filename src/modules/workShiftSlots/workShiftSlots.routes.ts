import Elysia, { t } from "elysia";
import { WorkShiftSlot } from "../../../generated/prismabox/WorkShiftSlot";
import { authPlugin } from "../../hooks/auth.hook";
import {
  CheckInOutSchema,
  ListWorkShiftSlotsSchema,
  MarkAbsentSchema,
  SendInviteSchema,
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
  // Public endpoint for accepting invites (no auth required)
  .post(
    "/accept-invite/:token",
    ({ params }) => service.acceptInvite(params.token),
    {
      params: t.Object({
        token: t.String(),
      }),
      response: {
        200: WorkShiftSlotResponse,
      },
    }
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
        }
      )
      .post(
        "/:id/check-in",
        ({ params, body }) => service.checkIn(params.id, body),
        {
          body: CheckInOutSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        }
      )
      .post(
        "/:id/check-out",
        ({ params, body }) => service.checkOut(params.id, body),
        {
          body: CheckInOutSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        }
      )
      .post(
        "/:id/mark-absent",
        ({ params, body }) => service.markAbsent(params.id, body),
        {
          body: MarkAbsentSchema,
          response: {
            200: WorkShiftSlotResponse,
          },
        }
      )
      .post(
        "/:id/connect-tracking",
        ({ params }) => service.connectTracking(params.id),
        {
          response: {
            200: WorkShiftSlotResponse,
          },
        }
      ),
  );
