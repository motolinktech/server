import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { usersService } from "../modules/users/users.service";
import { userRolesEnum } from "../shared/enums/userRoles.enum";
import { fakeUsers } from "../utils/fakeUser";

export const authPlugin = new Elysia({ name: "auth-plugin" })
  .use(
    jwt({
      secret: process.env.JWT_SECRET || "secret",
      schema: t.Object({ id: t.String() }),
    }),
  )
  .use(bearer())
  .derive({ as: "global" }, async ({ bearer, jwt }) => {
    if (!bearer) return { user: null };

    if (process.env.NODE_ENV === "development") {
      const fakeUser = fakeUsers[bearer as keyof typeof fakeUsers];
      if (fakeUser) return { user: fakeUser };
    }

    const payload = await jwt.verify(bearer);
    if (!payload) return { user: null };

    const user = await usersService().getById(payload.id);
    return { user };
  })
  .macro({
    isAuth: {
      resolve: async ({ user, status }) => {
        if (!user) return status(401, "Não autorizado");

        return { user };
      },
    },
    branchCheck: {
      headers: t.Object({
        "x-branch-id": t.String({
          error: "Filial é obrigatória",
        }),
      }),
      resolve: async ({ user, status, headers }) => {
        const { "x-branch-id": currentBranch } = headers;

        if (!user || !currentBranch) return status(401, "Não autorizado");

        if (
          user.role !== userRolesEnum.ADMIN &&
          !user.branches.includes(currentBranch)
        ) {
          return status(403, "Não autorizado para esta filial");
        }

        return { user, currentBranch };
      },
    },
  });
