import Elysia from "elysia";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";

export const routes = new Elysia({ prefix: "/api" })
  .use(authRoutes)
  .use(usersRoutes);
