import Elysia from "elysia";
import { authRoutes } from "./modules/auth/auth.routes";
import { historyTracesRoutes } from "./modules/historyTraces/historyTraces.routes";
import { usersRoutes } from "./modules/users/users.routes";

export const routes = new Elysia({ prefix: "/api" })
  .use(authRoutes)
  .use(usersRoutes)
  .use(historyTracesRoutes);
