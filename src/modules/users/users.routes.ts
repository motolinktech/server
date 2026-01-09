import Elysia, { t } from "elysia";
import { User } from "../../../generated/prismabox/User";
import { authHook } from "../../hooks/auth.hook";
import { UserMutateSchema, UserPasswordChangeSchema } from "./users.schema";
import { usersService } from "./users.service";

const service = usersService();

export const usersRoutes = new Elysia({
  prefix: "/users",
  detail: {
    tags: ["Users"],
  },
})
  .use(authHook)
  .post("/", ({ body }) => service.create(body), {
    body: UserMutateSchema,
    response: {
      200: t.Omit(User, ["password", "verificationTokens"]),
    },
  })
  .get("/", ({ query }) => service.list(query), {
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
            branchs: t.Array(t.String()),
            verificationTokens: t.Array(t.Object({ token: t.String() })),
          }),
        ),
        count: t.Number(),
      }),
    },
  })
  .get("/:id", ({ params }) => service.getById(params.id), {
    response: {
      200: t.Omit(User, ["password", "verificationTokens"]),
    },
  })
  .get("/me", ({ user }) => service.getById(user.id), {
    response: {
      200: t.Omit(User, ["password", "verificationTokens"]),
    },
  })
  .delete("/:id", ({ params }) => service.delete(params.id))
  .post(
    "/:id/change-password",
    ({ params, body }) => service.changePassword({ ...body, id: params.id }),
    {
      body: UserPasswordChangeSchema,
    },
  );
