import { type Static, t } from "elysia";
import { periodEnum } from "../../shared/enums/period.enum";
import { workShiftSlotStatusEnum } from "../../shared/enums/workShiftSlotStatus.enum";

export const WorkShiftSlotMutateSchema = t.Object({
  id: t.Optional(t.String()),
  deliverymanId: t.Optional(t.String()),
  clientId: t.String(),
  status: t.Optional(
    t.String({ default: workShiftSlotStatusEnum.OPEN })
  ),
  contractType: t.String(),
  shiftDate: t.String(),
  startTime: t.String(),
  endTime: t.String(),
  period: t.Union(
    [t.Literal(periodEnum.DIURNO), t.Literal(periodEnum.NOTURNO)],
    { error: "Período é obrigatório (diurno ou noturno)" }
  ),
  auditStatus: t.String(),
  isFreelancer: t.Optional(t.Boolean({ default: false })),
  logs: t.Optional(t.Array(t.Any())),
});

export const ListWorkShiftSlotsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  clientId: t.Optional(t.String()),
  deliverymanId: t.Optional(t.String()),
  status: t.Optional(t.String()),
  period: t.Optional(
    t.Union([t.Literal(periodEnum.DIURNO), t.Literal(periodEnum.NOTURNO)])
  ),
  isFreelancer: t.Optional(t.Boolean()),
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
    })
  ),
});

export const CheckInOutSchema = t.Object({
  location: t.Optional(
    t.Object({
      lat: t.Number(),
      lng: t.Number(),
    })
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
