import Elysia, { t } from "elysia";
import { Deliveryman } from "../../../generated/prismabox/Deliveryman";
import { authPlugin } from "../../hooks/auth.hook";
import {
  DeliverymenMutateSchema,
  ListDeliverymenSchema,
} from "./deliverymen.schema";
import { deliverymenService } from "./deliverymen.service";

const service = deliverymenService();

const DeliverymanReponse = t.Omit(Deliveryman, ["branch", "region"]);

export const deliverymenRoutes = new Elysia({
  prefix: "/deliverymen",
  detail: {
    tags: ["Deliverymen"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app
      .post(
        "/",
        ({ body, currentBranch }) =>
          service.create({ ...body, branchId: currentBranch }),
        {
          body: t.Omit(DeliverymenMutateSchema, ["id", "branchId"]),
          response: {
            200: DeliverymanReponse,
          },
        },
      )
      .get(
        "/",
        ({ query, currentBranch }) =>
          service.listAll({ ...query, branchId: currentBranch }),
        {
          query: ListDeliverymenSchema,
          response: {
            200: t.Object({
              data: t.Array(
                t.Composite([
                  DeliverymanReponse,
                  t.Object({
                    branch: t.Object({
                      id: t.String(),
                      name: t.String(),
                    }),
                    region: t.Nullable(
                      t.Object({
                        id: t.String(),
                        name: t.String(),
                      }),
                    ),
                  }),
                ]),
              ),
              count: t.Number(),
            }),
          },
        },
      )
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: {
          200: t.Composite([
            Deliveryman,
            t.Object({
              branch: t.Any(),
              region: t.Nullable(t.Any()),
            }),
          ]),
        },
      })
      .put(
        "/:id",
        ({ params, body }) => service.edit({ ...body, id: params.id }),
        {
          body: t.Omit(DeliverymenMutateSchema, ["id", "branchId"]),
          response: {
            200: DeliverymanReponse,
          },
        },
      )
      .patch(
        "/:id/toggle-block",
        ({ params }) => service.toggleBlock(params.id),
        {
          response: {
            200: DeliverymanReponse,
          },
        },
      )
      .delete("/:id", ({ params }) => service.delete(params.id), {
        response: {
          200: DeliverymanReponse,
        },
      }),
  );
