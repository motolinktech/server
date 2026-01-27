import { type Static, t } from "elysia";
import { periodEnum } from "../../shared/enums/period.enum";
import { workShiftSlotStatusEnum } from "../../shared/enums/workShiftSlotStatus.enum";

export const WorkShiftSlotMutateSchema = t.Object({
  id: t.Optional(t.String()),
  deliverymanId: t.Optional(t.String()),
  clientId: t.Optional(t.String()),
  status: t.Optional(t.String({ default: workShiftSlotStatusEnum.OPEN })),
  contractType: t.String(),
  shiftDate: t.String(),
  startTime: t.String(),
  endTime: t.String(),
  period: t.Array(
    t.Union([t.Literal(periodEnum.DAYTIME), t.Literal(periodEnum.NIGHTTIME)]),
    {
      error: "Período é obrigatório (daytime ou nighttime)",
      default: [periodEnum.DAYTIME],
    },
  ),
  auditStatus: t.String(),
  isFreelancer: t.Optional(t.Boolean({ default: false })),
  logs: t.Optional(t.Array(t.Any())),
});

export const ListWorkShiftSlotsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  clientId: t.Optional(t.String()),
  groupId: t.Optional(t.String()),
  deliverymanId: t.Optional(t.String()),
  status: t.Optional(t.String()),
  period: t.Optional(
    t.Array(
      t.Union([t.Literal(periodEnum.DAYTIME), t.Literal(periodEnum.NIGHTTIME)]),
    ),
  ),
  isFreelancer: t.Optional(t.Boolean()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  month: t.Optional(t.Number()),
  week: t.Optional(t.Number()),
});

export const SendInviteSchema = t.Object({
  deliverymanId: t.String({ error: "ID do entregador é obrigatório" }),
  expiresInHours: t.Optional(
    t.Number({
      default: 24,
      minimum: 1,
      maximum: 72,
      error: "Tempo de expiração deve ser entre 1 e 72 horas",
    }),
  ),
});

export const CheckInOutSchema = t.Object({
  location: t.Optional(
    t.Object({
      lat: t.Number(),
      lng: t.Number(),
    }),
  ),
});

export const MarkAbsentSchema = t.Object({
  reason: t.Optional(t.String({ maxLength: 500 })),
});

export type WorkShiftSlotMutateDTO = Static<typeof WorkShiftSlotMutateSchema>;
export type ListWorkShiftSlotsDTO = Static<typeof ListWorkShiftSlotsSchema>;
export type SendInviteDTO = Static<typeof SendInviteSchema>;
export type CheckInOutDTO = Static<typeof CheckInOutSchema>;
export type MarkAbsentDTO = Static<typeof MarkAbsentSchema>;

export const AcceptInviteSchema = t.Object({
  isAccepted: t.Boolean(),
});

export type AcceptInviteDTO = Static<typeof AcceptInviteSchema>;

export const ListWorkShiftSlotsByGroupSchema = t.Object({
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
});

export type ListWorkShiftSlotsByGroupDTO = Static<
  typeof ListWorkShiftSlotsByGroupSchema
>;

export const CopyWorkShiftSlotsSchema = t.Object({
  sourceDate: t.String({ error: "Data de origem é obrigatória" }),
  targetDate: t.String({ error: "Data de destino é obrigatória" }),
  clientId: t.String({ error: "ID do cliente é obrigatório" }),
});

export type CopyWorkShiftSlotsDTO = Static<typeof CopyWorkShiftSlotsSchema>;
