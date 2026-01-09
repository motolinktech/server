import { type Static, t } from "elysia";

export const RegionsMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({ minLength: 3, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 255 })),
  branchId: t.String(),
});

export const ListRegionsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  name: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
});

export type RegionsMutateDTO = Static<typeof RegionsMutateSchema>;
export type ListRegionsDTO = Static<typeof ListRegionsSchema>;
