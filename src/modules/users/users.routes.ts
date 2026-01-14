import Elysia, { t } from "elysia";
import { User } from "../../../generated/prismabox/User";
import { authPlugin } from "../../hooks/auth.hook";
import {
  UserDetailed,
  UserMutateSchema,
  UserPasswordChangeSchema,
} from "./users.schema";
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
      .post("/", ({ body }) => service.create({ ...body }), {
        body: t.Omit(UserMutateSchema, ["id"]),
        response: {
          200: t.Omit(User, [
            "password",
            "verificationTokens",
            "historyTraces",
          ]),
        },
        branchCheck: true,
      })
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
          200: t.Omit(UserDetailed, [
            "password",
            "verificationTokens",
            "historyTraces",
          ]),
        },
        branchCheck: true,
      })
      .get("/me", ({ user }) => service.getById(user.id), {
        response: {
          200: t.Omit(User, [
            "password",
            "verificationTokens",
            "historyTraces",
          ]),
        },
      })
      .delete("/:id", ({ params }) => service.delete(params.id))
      .post(
        "/:id/change-password",
        ({ params, body }) => {
          return service.changePassword({ ...body, id: params.id });
        },
        {
          body: t.Omit(UserPasswordChangeSchema, ["id"]),
          params: t.Object({
            id: t.String({
              error: "ID do usuário é obrigatório",
            }),
          }),
        },
      ),
  );
