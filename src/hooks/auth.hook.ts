import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import type { User } from "../../generated/prisma/client";
import { AppError } from "../utils/appError";
import { fakeUsers } from "../utils/fakeUser";

export const authHook = new Elysia({
  name: "auth-hook",
})
  .state<{
    user: User | null;
  }>({
    user: null,
  })
  .use(jwt({ secret: process.env.JWT_SECRET || "secret" }))
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

      // TODO: add function to get user from DB

      store.user = isValidToken as User;
    },
  })
  .resolve(({ store }) => {
    return {
      user: store.user!,
    };
  })
  .as("scoped");
