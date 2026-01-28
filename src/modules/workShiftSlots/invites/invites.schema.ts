import { type Static, t } from "elysia";

export const SendBulkInvitesSchema = t.Object({
  date: t.String({
    pattern: "^\\d{2}/\\d{2}/\\d{4}$",
    error: "Data deve estar no formato dd/MM/YYYY",
  }),
  workShiftSlotId: t.Optional(t.String()),
  groupId: t.Optional(t.String()),
  clientId: t.Optional(t.String()),
});

export const SendBulkInvitesResponseSchema = t.Object({
  sent: t.Number(),
  failed: t.Number(),
  errors: t.Array(
    t.Object({
      slotId: t.String(),
      reason: t.String(),
    }),
  ),
});

export type SendBulkInvitesDTO = Static<typeof SendBulkInvitesSchema>;
export type SendBulkInvitesResponseDTO = Static<
  typeof SendBulkInvitesResponseSchema
>;

export const GetInviteQuerySchema = t.Object({
  token: t.String({ error: "Token é obrigatório" }),
});

export const InviteResponseSchema = t.Object({
  id: t.String(),
  token: t.String(),
  status: t.String(),
  workShiftSlotId: t.String(),
  deliverymanId: t.String(),
  clientId: t.String(),
  clientName: t.String(),
  clientAddress: t.String(),
  shiftDate: t.String(),
  startTime: t.String(),
  endTime: t.String(),
  sentAt: t.String(),
  expiresAt: t.String(),
  respondedAt: t.Nullable(t.String()),
});

export const RespondInviteSchema = t.Object({
  isAccepted: t.Boolean(),
});

export type GetInviteQueryDTO = Static<typeof GetInviteQuerySchema>;
export type InviteResponseDTO = Static<typeof InviteResponseSchema>;
export type RespondInviteDTO = Static<typeof RespondInviteSchema>;
