import { type Static, t } from "elysia";

export const ClientMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({ minLength: 3, maxLength: 100 }),
  cnpj: t.String(),
  cep: t.String(),
  street: t.String(),
  number: t.String(),
  complement: t.String(),
  city: t.String(),
  neighborhood: t.String(),
  uf: t.String(),
  regionId: t.Optional(t.String()),
  groupId: t.Optional(t.String()),
  contactName: t.String(),
  branchId: t.String(),
});

export const CommercialConditionSchema = t.Object({
  paymentForm: t.Optional(t.Array(t.String())),
  dailyPeriods: t.Optional(t.Array(t.String())),
  guaranteedPeriods: t.Optional(t.Array(t.String())),
  deliveryAreaKm: t.Optional(t.Number()),
  isMotolinkCovered: t.Optional(t.Boolean()),
  guaranteedDay: t.Optional(t.Number()),
  guaranteedDayWeekend: t.Optional(t.Number()),
  guaranteedNight: t.Optional(t.Number()),
  guaranteedNightWeekend: t.Optional(t.Number()),
  clientDailyDay: t.Optional(t.Number()),
  clientDailyDayWknd: t.Optional(t.Number()),
  clientDailyNight: t.Optional(t.Number()),
  clientDailyNightWknd: t.Optional(t.Number()),
  clientPerDelivery: t.Optional(t.Number()),
  clientAdditionalKm: t.Optional(t.Number()),
  deliverymanDailyDay: t.Optional(t.Number()),
  deliverymanDailyDayWknd: t.Optional(t.Number()),
  deliverymanDailyNight: t.Optional(t.Number()),
  deliverymanDailyNightWknd: t.Optional(t.Number()),
  deliverymanPerDelivery: t.Optional(t.Number()),
  deliverymanAdditionalKm: t.Optional(t.Number()),
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
