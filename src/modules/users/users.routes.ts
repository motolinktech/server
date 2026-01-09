import Elysia, { t } from "elysia";
import { User } from "../../../generated/prismabox/User";
import { authPlugin } from "../../hooks/auth.hook";
import { UserMutateSchema, UserPasswordChangeSchema } from "./users.schema";
import { usersService } from "./users.service";

const service = usersService();

export const usersRoutes = new Elysia({
  prefix: "/users",
  detail: {
    tags: ["Users"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true }, (app) =>
    app
      .post(
        "/",
        ({ body, currentBranch }) =>
          service.create({ ...body, branches: [currentBranch] }),
        {
          body: UserMutateSchema,
          response: {
            200: t.Omit(User, ["password", "verificationTokens"]),
          },
          branchCheck: true,
        },
      )
      .get(
        "/",
        ({ query, currentBranch }) => service.list({ ...query, currentBranch }),
        {
          response: {
            200: t.Object({
              data: t.Array(
                t.Object({
                  id: t.String(),
                  name: t.String(),
                  email: t.String(),
                  role: t.String(),
                  status: t.String(),
                  permissions: t.Array(t.String()),
                  branches: t.Array(t.String()),
                  verificationTokens: t.Array(t.Object({ token: t.String() })),
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
          200: t.Omit(User, ["password", "verificationTokens"]),
        },
        branchCheck: true,
      })
      .get("/me", ({ user }) => service.getById(user.id), {
        response: {
          200: t.Omit(User, ["password", "verificationTokens"]),
        },
      })
      .delete("/:id", ({ params }) => service.delete(params.id))
      .post(
        "/:id/change-password",
        ({ params, body }) =>
          service.changePassword({ ...body, id: params.id }),
        {
          body: UserPasswordChangeSchema,
        },
      ),
  );
