import { type Static, t } from "elysia";

export const PlanningMutateSchema = t.Object({
  id: t.Optional(t.String()),
  clientId: t.String(),
  branchId: t.String(),
  plannedDate: t.String({ error: "Data planejada é obrigatória" }),
  plannedCount: t.Number({
    minimum: 0,
    error: "Quantidade deve ser maior ou igual a 0",
  }),
});

export const ListPlanningsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  clientId: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
});

export type PlanningMutateDTO = Static<typeof PlanningMutateSchema>;
export type ListPlanningsDTO = Static<typeof ListPlanningsSchema>;
