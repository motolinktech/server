import { type Static, t } from "elysia";

export const GroupsMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({ minLength: 3, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 255 })),
  branchId: t.String(),
});

export const ListGroupsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  name: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
});

export type GroupsMutateDTO = Static<typeof GroupsMutateSchema>;
export type ListGroupsDTO = Static<typeof ListGroupsSchema>;
