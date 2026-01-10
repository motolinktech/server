import Elysia from "elysia";
import { authRoutes } from "./modules/auth/auth.routes";
import { clientsRoutes } from "./modules/clients/clients.routes";
import { deliverymenRoutes } from "./modules/deliverymen/deliverymen.routes";
import { groupsRoutes } from "./modules/groups/groups.routes";
import { historyTracesRoutes } from "./modules/historyTraces/historyTraces.routes";
import { regionsRoutes } from "./modules/regions/regions.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { workShiftSlotsRoutes } from "./modules/workShiftSlots/workShiftSlots.routes";

export const routes = new Elysia({ prefix: "/api" })
  .use(authRoutes)
  .use(usersRoutes)
  .use(groupsRoutes)
  .use(regionsRoutes)
  .use(historyTracesRoutes)
  .use(deliverymenRoutes)
  .use(clientsRoutes)
  .use(workShiftSlotsRoutes);
