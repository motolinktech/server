import { type Static, t } from "elysia";

const HistoryTraceActions = t.Union([
  t.Literal("CREATE"),
  t.Literal("EDIT"),
  t.Literal("DELETE"),
]);

export const HistoryTraceCreateSchema = t.Object({
  new: t.Any({}),
  old: t.Optional(t.Any({})),
  userId: t.String(),
  action: HistoryTraceActions,
});

export const HistoryTraceListQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  userId: t.Optional(t.String()),
  action: t.Optional(t.String()),
  entityType: t.Optional(t.String()),
  entityId: t.Optional(t.String()),
});

export const HistoryTraceResponseSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  action: t.String(),
  entityType: t.String(),
  entityId: t.String(),
  changes: t.Any(),
  createdAt: t.Date(),
  user: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    role: t.String(),
    permissions: t.Array(t.String()),
    branches: t.Array(t.String()),
    status: t.String(),
  }),
});

export const HistoryTraceListResponseSchema = t.Object({
  data: t.Array(HistoryTraceResponseSchema),
  count: t.Number(),
});

export type HistoryTraceListInputDTO = Static<
  typeof HistoryTraceListQuerySchema
>;

export type HistoryTraceCreateDTO = Static<typeof HistoryTraceCreateSchema>;
