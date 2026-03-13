import Elysia, { t } from "elysia";
import { Client } from "../../../generated/prismabox/Client";
import { authPlugin } from "../../plugins/auth.plugin";
import { blocksRoutes } from "./blocks/blocks.routes";
import {
  ClientMutateSchema,
  CommercialConditionResponseSchema,
  CommercialConditionSchema,
  ListClientsSchema,
} from "./clients.schema";
import { clientsService } from "./clients.service";

const service = clientsService();

const ClientResponse = t.Omit(Client, [
  "branch",
  "region",
  "group",
  "commercialCondition",
  "workShiftSlots",
  "blocks",
  "plannings",
  "invites",
]);

export const clientsRoutes = new Elysia({
  prefix: "/clients",
  detail: {
    tags: ["Clients"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true, branchCheck: true }, (app) =>
    app
      .post(
        "/",
        ({ body, currentBranch, user }) =>
          service.create(
            {
              client: { ...body.client, branchId: currentBranch },
              commercialCondition: body.commercialCondition,
            },
            user.id,
          ),
        {
          body: t.Object({
            client: t.Omit(ClientMutateSchema, ["id", "branchId"]),
            commercialCondition: t.Optional(CommercialConditionSchema),
          }),
          response: {
            200: ClientResponse,
          },
        },
      )
      .get(
        "/simplified",
        ({ query, currentBranch }) =>
          service.listAllSimplified({ ...query, branchId: currentBranch }),
        {
          query: ListClientsSchema,
          response: {
            200: t.Object({
              data: t.Array(
                t.Object({
                  id: t.String(),
                  name: t.String(),
                  cnpj: t.String(),
                  cep: t.String(),
                  street: t.String(),
                  number: t.String(),
                  complement: t.Nullable(t.String()),
                  city: t.String(),
                  neighborhood: t.String(),
                  uf: t.String(),
                  contactName: t.String(),
                  contactPhone: t.String(),
                  isDeleted: t.Boolean(),
                  createdAt: t.Date(),
                  updatedAt: t.Date(),
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
                  group: t.Nullable(
                    t.Object({
                      id: t.String(),
                      name: t.String(),
                    }),
                  ),
                }),
              ),
              count: t.Number(),
            }),
          },
        },
      )
      .get(
        "/complete",
        ({ query, currentBranch }) =>
          service.listAllComplete({ ...query, branchId: currentBranch }),
        {
          query: ListClientsSchema,
          response: {
            200: t.Object({
              data: t.Array(
                t.Composite([
                  t.Omit(ClientResponse, [
                    "commercialCondition",
                    "branch",
                    "region",
                    "group",
                  ]),
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
                    group: t.Nullable(
                      t.Object({
                        id: t.String(),
                        name: t.String(),
                      }),
                    ),
                    commercialCondition: t.Nullable(
                      CommercialConditionResponseSchema,
                    ),
                  }),
                ]),
              ),
              count: t.Number(),
            }),
          },
        },
      )
      .get("/:clientId", ({ params }) => service.getById(params.clientId), {
        response: {
          200: t.Composite([
            ClientResponse,
            t.Object({
              branch: t.Any(),
              region: t.Nullable(t.Any()),
              group: t.Nullable(t.Any()),
              commercialCondition: t.Nullable(
                CommercialConditionResponseSchema,
              ),
            }),
          ]),
        },
      })
      .put(
        "/:clientId",
        ({ params, body, user }) =>
          service.edit(params.clientId, body, user.id),
        {
          body: t.Object({
            client: t.Optional(t.Omit(ClientMutateSchema, ["id", "branchId"])),
            commercialCondition: t.Optional(CommercialConditionSchema),
          }),
          response: {
            200: t.Composite([
              ClientResponse,
              t.Object({
                commercialCondition: t.Nullable(
                  CommercialConditionResponseSchema,
                ),
              }),
            ]),
          },
        },
      )
      .delete(
        "/:clientId",
        ({ params, user }) => service.delete(params.clientId, user.id),
        {
          response: {
            200: ClientResponse,
          },
        },
      ),
  )
  .use(blocksRoutes);
