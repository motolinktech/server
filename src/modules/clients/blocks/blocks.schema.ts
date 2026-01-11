import { type Static, t } from "elysia";

export const CreateClientBlockSchema = t.Object({
  deliverymanId: t.String(),
  reason: t.String({ minLength: 3 }),
});

export const ClientBlockResponseSchema = t.Object({
  id: t.String(),
  deliverymanId: t.String(),
  clientId: t.String(),
  reason: t.Nullable(t.String()),
  createdAt: t.Date(),
  deliveryman: t.Object({
    id: t.String(),
    name: t.String(),
    document: t.String(),
    phone: t.String(),
  }),
});

export type CreateClientBlockDTO = Static<typeof CreateClientBlockSchema>;
export type ClientBlockResponseDTO = Static<typeof ClientBlockResponseSchema>;
