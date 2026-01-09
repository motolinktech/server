import Elysia, { t } from "elysia";
import { Region } from "../../../generated/prismabox/Region";
import { authPlugin } from "../../hooks/auth.hook";
import { ListRegionsSchema, RegionsMutateSchema } from "./regions.schema";
import { regionsService } from "./regions.service";

const service = regionsService();

const RegionReponse = t.Omit(Region, ["branch", "deliverymen"]);

export const regionsRoutes = new Elysia({
  prefix: "/regions",
  detail: {
    tags: ["Regions"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true }, (app) =>
    app
      .post(
        "/",
        ({ body, currentBranch }) =>
          service.create({ ...body, branchId: currentBranch }),
        {
          body: t.Omit(RegionsMutateSchema, ["id", "branchId"]),
          response: {
            200: RegionReponse,
          },
          branchCheck: true,
        },
      )
      .get(
        "/",
        ({ query, currentBranch }) =>
          service.listAll({ ...query, branchId: currentBranch }),
        {
          query: ListRegionsSchema,
          response: {
            200: t.Object({
              data: t.Array(RegionReponse),
              count: t.Number(),
            }),
          },
          branchCheck: true,
        },
      )
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: {
          200: RegionReponse,
        },
        branchCheck: true,
      })
      .put(
        "/:id",
        ({ params, body }) => service.edit({ ...body, id: params.id }),
        {
          body: t.Omit(RegionsMutateSchema, ["id", "branchId"]),
          response: {
            200: RegionReponse,
          },
          branchCheck: true,
        },
      )
      .delete("/:id", ({ params }) => service.delete(params.id), {
        branchCheck: true,
      }),
  );
