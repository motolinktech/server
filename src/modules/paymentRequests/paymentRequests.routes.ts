import Elysia, { t } from "elysia";
import { PaymentRequest } from "../../../generated/prismabox/PaymentRequest";
import { authPlugin } from "../../plugins/auth.plugin";
import {
  ListPaymentRequestsSchema,
  PaymentRequestMutateSchema,
} from "./paymentRequests.schema";
import { paymentRequestsService } from "./paymentRequests.service";

const service = paymentRequestsService();

const PaymentRequestResponse = t.Composite([
  t.Omit(PaymentRequest, ["deliveryman", "workShiftSlot", "amount"]),
  t.Object({
    amount: t.Any(),
  }),
]);

export const paymentRequestsRoutes = new Elysia({
  prefix: "/payment-requests",
  detail: {
    tags: ["PaymentRequests"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app
      .post("/", ({ body }) => service.create(body), {
        body: t.Omit(PaymentRequestMutateSchema, ["id"]),
        response: {
          200: PaymentRequestResponse,
        },
      })
      .get("/", ({ query }) => service.listAll(query), {
        query: ListPaymentRequestsSchema,
        response: {
          200: t.Object({
            data: t.Array(
              t.Composite([
                PaymentRequestResponse,
                t.Object({
                  deliveryman: t.Object({
                    id: t.String(),
                    name: t.String(),
                  }),
                  workShiftSlot: t.Object({
                    id: t.String(),
                    shiftDate: t.Any(),
                    client: t.Object({
                      id: t.String(),
                      name: t.String(),
                    }),
                  }),
                }),
              ]),
            ),
            count: t.Number(),
          }),
        },
      })
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: {
          200: t.Composite([
            PaymentRequestResponse,
            t.Object({
              deliveryman: t.Any(),
              workShiftSlot: t.Any(),
            }),
          ]),
        },
      })
      .put(
        "/:id",
        ({ params, body }) => service.edit({ ...body, id: params.id }),
        {
          body: t.Omit(PaymentRequestMutateSchema, ["id"]),
          response: {
            200: PaymentRequestResponse,
          },
        },
      )
      .delete("/:id", ({ params }) => service.delete(params.id), {
        response: {
          200: t.Object({
            message: t.String(),
          }),
        },
      }),
  );
