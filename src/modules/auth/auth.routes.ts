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
  .use(
    jwt({
      secret: process.env.JWT_SECRET || "secret",
      schema: t.Object({ id: t.String() }),
    }),
  )
  .post(
    "/",
    async ({ jwt, body, status }) => {
      const user = await service.authenticate(body);

      const token = await jwt.sign({
        id: user.id,
        exp: "7d",
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
          user: t.Omit(User, ["password", "verificationTokens"]),
          token: t.String(),
        }),
      },
    },
  );
