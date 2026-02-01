import { type Static, t } from "elysia";
import { periodEnum } from "../../shared/enums/period.enum";

export const PlanningMutateSchema = t.Object({
  id: t.Optional(t.String()),
  clientId: t.String(),
  branchId: t.String(),
  plannedDate: t.String({ error: "Data planejada é obrigatória" }),
  plannedCount: t.Number({
    minimum: 0,
    error: "Quantidade deve ser maior ou igual a 0",
  }),
  period: t.Union(
    [t.Literal(periodEnum.DAYTIME), t.Literal(periodEnum.NIGHTTIME)],
    {
      error: "Período é obrigatório (diurno ou noturno)",
    },
  ),
});

export const ListPlanningsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  clientId: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
  groupId: t.Optional(t.String()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  period: t.Optional(
    t.Union([t.Literal(periodEnum.DAYTIME), t.Literal(periodEnum.NIGHTTIME)]),
  ),
});

export type PlanningMutateDTO = Static<typeof PlanningMutateSchema>;
export type ListPlanningsDTO = Static<typeof ListPlanningsSchema>;
