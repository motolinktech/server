import { type Static, t } from "elysia";

export const DeliverymenMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({ minLength: 3, maxLength: 100 }),
  files: t.Optional(t.Array(t.String())),
  document: t.String(),
  phone: t.String(),
  contractType: t.String(),
  mainPixKey: t.String(),
  secondPixKey: t.Optional(t.String()),
  thridPixKey: t.Optional(t.String()),
  agency: t.Optional(t.String()),
  account: t.Optional(t.String()),
  vehicleModel: t.Optional(t.String()),
  vehiclePlate: t.Optional(t.String()),
  vehicleColor: t.Optional(t.String()),
  branchId: t.String(),
  regionId: t.Optional(t.String()),
});

export const ListDeliverymenSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  name: t.Optional(t.String()),
  document: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  contractType: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
  regionId: t.Optional(t.String()),
  isBlocked: t.Optional(t.Boolean()),
  isDeleted: t.Optional(t.Boolean()),
});

export type DeliverymenMutateDTO = Static<typeof DeliverymenMutateSchema>;
export type ListDeliverymenDTO = Static<typeof ListDeliverymenSchema>;
