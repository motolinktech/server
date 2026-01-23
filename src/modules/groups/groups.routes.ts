import Elysia, { t } from "elysia";
import { Group } from "../../../generated/prismabox/Group";
import { authPlugin } from "../../plugins/auth.plugin";
import { GroupsMutateSchema, ListGroupsSchema } from "./groups.schema";
import { groupsService } from "./groups.service";

const service = groupsService();

export const groupsRoutes = new Elysia({
  prefix: "/groups",
  detail: {
    tags: ["Groups"],
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
          body: t.Omit(GroupsMutateSchema, ["id", "branchId", "clients"]),
          response: {
            200: t.Omit(Group, ["branch", "clients"]),
          },
          branchCheck: true,
        },
      )
      .get(
        "/",
        ({ query, currentBranch }) =>
          service.listAll({ ...query, branchId: currentBranch }),
        {
          query: ListGroupsSchema,
          response: {
            200: t.Object({
              data: t.Array(
                t.Object({
                  id: t.String(),
                  name: t.String(),
                  description: t.Nullable(t.String()),
                  createdAt: t.Date(),
                }),
              ),
              count: t.Number(),
            }),
          },
          branchCheck: true,
        },
      )
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: {
          200: t.Omit(Group, ["branch"]),
        },
        branchCheck: true,
      })
      .put(
        "/:id",
        ({ params, body }) => service.edit({ ...body, id: params.id }),
        {
          body: t.Omit(GroupsMutateSchema, ["id", "branchId", "clients"]),
          response: {
            200: t.Omit(Group, ["branch", "clients"]),
          },
          branchCheck: true,
        },
      )
      .delete("/:id", ({ params }) => service.delete(params.id), {
        branchCheck: true,
      }),
  );
