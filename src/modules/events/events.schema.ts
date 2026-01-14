import { type Static, t } from "elysia";
import { EventPlain } from "../../../generated/prismabox/Event";

export const EventMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Nome inválido.",
  }),
  description: t.Optional(t.String()),
  date: t.Date(),
  startHour: t.Date(),
  endHour: t.Date(),
  branches: t.Optional(t.Array(t.String())),
});

export const ListEventsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  search: t.Optional(t.String()),
});

export const EventDetailed = t.Composite([
  EventPlain,
  t.Object({
    createdBy: t.Object({ id: t.String(), name: t.String() }),
  }),
]);

export type EventMutateDTO = Static<typeof EventMutateSchema>;
export type ListEventsDTO = Static<typeof ListEventsSchema>;
export type EventDetailedType = Static<typeof EventDetailed>;
