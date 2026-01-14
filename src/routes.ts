import Elysia from "elysia";
import { authRoutes } from "./modules/auth/auth.routes";
import { branchesRoutes } from "./modules/branches/branches.routes";
import { clientsRoutes } from "./modules/clients/clients.routes";
import { deliverymenRoutes } from "./modules/deliverymen/deliverymen.routes";
import { eventsRoutes } from "./modules/events/events.routes";
import { groupsRoutes } from "./modules/groups/groups.routes";
import { historyTracesRoutes } from "./modules/historyTraces/historyTraces.routes";
import { paymentRequestsRoutes } from "./modules/paymentRequests/paymentRequests.routes";
import { planningRoutes } from "./modules/planning/planning.routes";
import { regionsRoutes } from "./modules/regions/regions.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { workShiftSlotsRoutes } from "./modules/workShiftSlots/workShiftSlots.routes";

export const routes = new Elysia({ prefix: "/api" })
  .use(authRoutes)
  .use(branchesRoutes)
  .use(usersRoutes)
  .use(eventsRoutes)
  .use(groupsRoutes)
  .use(regionsRoutes)
  .use(historyTracesRoutes)
  .use(deliverymenRoutes)
  .use(clientsRoutes)
  .use(workShiftSlotsRoutes)
  .use(paymentRequestsRoutes)
  .use(planningRoutes);
