import { type Static, t } from "elysia";

export const ClientMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({ minLength: 3, maxLength: 100 }),
  cnpj: t.String(),
  cep: t.String(),
  street: t.String(),
  number: t.String(),
  complement: t.Optional(t.String()),
  city: t.String(),
  neighborhood: t.String(),
  uf: t.String(),
  regionId: t.Optional(t.String()),
  groupId: t.Optional(t.String()),
  contactName: t.String(),
  contactPhone: t.String(),
  observations: t.Optional(t.String()),
  branchId: t.String(),
});

export const CommercialConditionSchema = t.Object({
  paymentForm: t.Optional(t.Array(t.String())),
  dailyPeriods: t.Optional(t.Array(t.String())),
  guaranteedPeriods: t.Optional(t.Array(t.String())),
  deliveryAreaKm: t.Optional(t.Number()),
  isMotolinkCovered: t.Optional(t.Boolean()),
  bagsStatus: t.Optional(t.String()),
  bagsAllocated: t.Optional(t.Number()),
  guaranteedDay: t.Optional(t.Number()),
  guaranteedDayWeekend: t.Optional(t.Number()),
  guaranteedNight: t.Optional(t.Number()),
  guaranteedNightWeekend: t.Optional(t.Number()),
  clientDailyDay: t.Optional(t.String()),
  clientDailyDayWknd: t.Optional(t.String()),
  clientDailyNight: t.Optional(t.String()),
  clientDailyNightWknd: t.Optional(t.String()),
  clientPerDelivery: t.Optional(t.String()),
  clientAdditionalKm: t.Optional(t.String()),
  deliverymanDailyDay: t.Optional(t.String()),
  deliverymanDailyDayWknd: t.Optional(t.String()),
  deliverymanDailyNight: t.Optional(t.String()),
  deliverymanDailyNightWknd: t.Optional(t.String()),
  deliverymanPerDelivery: t.Optional(t.String()),
  deliverymanAdditionalKm: t.Optional(t.String()),
});

export const CommercialConditionResponseSchema = t.Object({
  id: t.String(),
  clientId: t.String(),
  paymentForm: t.Array(t.String()),
  dailyPeriods: t.Array(t.String()),
  guaranteedPeriods: t.Array(t.String()),
  deliveryAreaKm: t.Number(),
  isMotolinkCovered: t.Boolean(),
  bagsStatus: t.String(),
  bagsAllocated: t.Number(),
  guaranteedDay: t.Number(),
  guaranteedDayWeekend: t.Number(),
  guaranteedNight: t.Number(),
  guaranteedNightWeekend: t.Number(),
  clientDailyDay: t.String(),
  clientDailyDayWknd: t.String(),
  clientDailyNight: t.String(),
  clientDailyNightWknd: t.String(),
  clientPerDelivery: t.String(),
  clientAdditionalKm: t.String(),
  deliverymanDailyDay: t.String(),
  deliverymanDailyDayWknd: t.String(),
  deliverymanDailyNight: t.String(),
  deliverymanDailyNightWknd: t.String(),
  deliverymanPerDelivery: t.String(),
  deliverymanAdditionalKm: t.String(),
  updatedAt: t.Date(),
  createdAt: t.Date(),
});

export const ClientWithCommercialConditionSchema = t.Object({
  client: ClientMutateSchema,
  commercialCondition: t.Optional(CommercialConditionSchema),
});

export const ListClientsSchema = t.Object({
  page: t.Optional(t.Number()),
  limit: t.Optional(t.Number()),
  name: t.Optional(t.String()),
  cnpj: t.Optional(t.String()),
  city: t.Optional(t.String()),
  uf: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
  regionId: t.Optional(t.String()),
  groupId: t.Optional(t.String()),
  isDeleted: t.Optional(t.Boolean()),
});

export type ClientMutateDTO = Static<typeof ClientMutateSchema>;
export type CommercialConditionDTO = Static<typeof CommercialConditionSchema>;
export type ClientWithCommercialConditionDTO = Static<
  typeof ClientWithCommercialConditionSchema
>;
export type ListClientsDTO = Static<typeof ListClientsSchema>;
