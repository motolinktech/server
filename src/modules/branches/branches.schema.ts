import { type Static, t } from "elysia";

export const BranchMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({
    minLength: 3,
    maxLength: 255,
    error: "Nome inválido.",
  }),
  code: t.String({
    minLength: 1,
    maxLength: 50,
    error: "Código é obrigatório.",
  }),
  address: t.Optional(
    t.String({
      minLength: 3,
      maxLength: 1024,
    }),
  ),
  whatsappUrl: t.Optional(
    t.String({
      maxLength: 1024,
    }),
  ),
  whatsappApiKey: t.Optional(
    t.String({
      maxLength: 1024,
    }),
  ),
});

export type BranchMutateDTO = Static<typeof BranchMutateSchema>;
