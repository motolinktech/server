import Elysia, { t } from "elysia";
import { WorkShiftSlot } from "../../../../generated/prismabox/WorkShiftSlot";
import { authPlugin } from "../../../plugins/auth.plugin";
import {
  GetInviteQuerySchema,
  InviteResponseSchema,
  RespondInviteSchema,
  SendBulkInvitesResponseSchema,
  SendBulkInvitesSchema,
} from "./invites.schema";
import { invitesService } from "./invites.service";

const service = invitesService();

const WorkShiftSlotResponse = t.Composite([
  t.Omit(WorkShiftSlot, [
    "deliveryman",
    "client",
    "paymentRequests",
    "invites",
    "deliverymanAmountDay",
    "deliverymanAmountNight",
  ]),
  t.Object({
    deliverymanAmountDay: t.String(),
    deliverymanAmountNight: t.String(),
  }),
]);

export const invitesRoutes = new Elysia({
  prefix: "/invites",
  detail: {
    tags: ["WorkShiftSlots Invites"],
  },
})
  .use(authPlugin)
  .get(
    "/:inviteId",
    ({ params, query }) => service.getInviteById(params.inviteId, query.token),
    {
      params: t.Object({
        inviteId: t.String(),
      }),
      query: GetInviteQuerySchema,
      response: {
        200: InviteResponseSchema,
      },
    },
  )
  .post(
    "/:inviteId/respond",
    ({ params, query, body }) =>
      service.respondToInvite(params.inviteId, query.token, body.isAccepted),
    {
      params: t.Object({
        inviteId: t.String(),
      }),
      query: GetInviteQuerySchema,
      body: RespondInviteSchema,
      response: {
        200: WorkShiftSlotResponse,
      },
    },
  )
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app.post("/", ({ body }) => service.sendInvites(body), {
      body: SendBulkInvitesSchema,
      response: {
        200: SendBulkInvitesResponseSchema,
      },
    }),
  );
