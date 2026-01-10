import { type Static, t } from "elysia";

export const WorkShiftSlotMutateSchema = t.Object({
  id: t.Optional(t.String()),
  deliverymanId: t.Optional(t.String()),
  clientId: t.String(),
  status: t.String(),
  contractType: t.String(),
  shiftDate: t.String(),
  startTime: t.String(),
  endTime: t.String(),
  auditStatus: t.String(),
  logs: t.Optional(t.Array(t.Any())),
});

export const ListWorkShiftSlotsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  clientId: t.Optional(t.String()),
  deliverymanId: t.Optional(t.String()),
  status: t.Optional(t.String()),
  month: t.Optional(t.Number()),
  week: t.Optional(t.Number()),
});

export type WorkShiftSlotMutateDTO = Static<typeof WorkShiftSlotMutateSchema>;
export type ListWorkShiftSlotsDTO = Static<typeof ListWorkShiftSlotsSchema>;
