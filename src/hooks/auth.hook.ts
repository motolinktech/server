import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import type { User } from "../../generated/prisma/client";
import { usersService } from "../modules/users/users.service";
import { AppError } from "../utils/appError";
import { fakeUsers } from "../utils/fakeUser";

export const authHook = new Elysia({
  name: "auth-hook",
})
  .state<{
    user: Omit<User, "password" | "verificationTokens"> | null;
  }>({
    user: null,
  })
  .use(
    jwt({
      secret: process.env.JWT_SECRET || "secret",
      schema: t.Object({
        id: t.String(),
      }),
    }),
  )
  .use(bearer())
  .guard({
    beforeHandle: async ({ bearer, jwt, store }) => {
      if (process.env.NODE_ENV === "development") {
        const fakeUser = fakeUsers[bearer as keyof typeof fakeUsers];

        if (!fakeUser) {
          throw new AppError("Não autorizado", 401);
        }

        store.user = fakeUser as User;
      }

      const isValidToken = await jwt.verify(bearer);

      if (!isValidToken) {
        throw new AppError("Não autorizado", 401);
      }

      const user = await usersService().getById(isValidToken.id);

      store.user = user;
    },
  })
  .resolve(({ store }) => {
    return {
      user: store.user!,
    };
  })
  .as("scoped");
