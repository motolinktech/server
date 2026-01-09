import { type Static, t } from "elysia";

export const BranchMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({
    minLength: 3,
    maxLength: 255,
    error: "Nome inválido.",
  }),
  address: t.Optional(
    t.String({
      minLength: 3,
      maxLength: 1024,
    }),
  ),
});

export type BranchMutateDTO = Static<typeof BranchMutateSchema>;
