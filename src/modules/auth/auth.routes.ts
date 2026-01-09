import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { User } from "../../../generated/prismabox/User";
import { AuthSchema } from "./auth.schema";
import { authService } from "./auth.service";

const service = authService();

export const authRoutes = new Elysia({
  prefix: "/auth",
  detail: {
    tags: ["Auth"],
  },
})
  .use(jwt({ secret: process.env.JWT_SECRET || "secret" }))
  .use(bearer())
  .get(
    "/authenticate",
    async ({ jwt, body, status }) => {
      const user = await service.authenticate(body);

      const token = await jwt.sign({
        sub: user.id,
        email: user.email,
        exp: 60 * 60 * 24 * 7,
      });

      return status(200, {
        user,
        token,
      });
    },
    {
      body: AuthSchema,
      response: {
        200: t.Object({
          user: t.Omit(User, ["password"]),
          token: t.String(),
        }),
      },
    },
  );
