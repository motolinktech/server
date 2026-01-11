import { type Static, t } from "elysia";
import { PaymentRequestStatus } from "../../shared/enums/paymentRequest.enum";

export const PaymentRequestMutateSchema = t.Object({
  id: t.Optional(t.String()),
  workShiftSlotId: t.String(),
  deliverymanId: t.String(),
  amount: t.Number({ minimum: 0 }),
  status: t.Optional(
    t.Enum(PaymentRequestStatus, {
      default: PaymentRequestStatus.NEW,
      error: "Status inválido",
    }),
  ),
  logs: t.Optional(t.Array(t.Any())),
});

export const ListPaymentRequestsSchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  workShiftSlotId: t.Optional(t.String()),
  deliverymanId: t.Optional(t.String()),
  status: t.Optional(t.Enum(PaymentRequestStatus)),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
});

export type PaymentRequestMutateDTO = Static<typeof PaymentRequestMutateSchema>;
export type ListPaymentRequestsDTO = Static<typeof ListPaymentRequestsSchema>;
