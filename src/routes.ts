import Elysia from "elysia";
import { authRoutes } from "./modules/auth/auth.routes";
import { branchesRoutes } from "./modules/branches/branches.routes";
import { clientsRoutes } from "./modules/clients/clients.routes";
import { deliverymenRoutes } from "./modules/deliverymen/deliverymen.routes";
import { eventsRoutes } from "./modules/events/events.routes";
import { es
import { historyTracesRoutesrom "./modules/hihihistoryTracesthistoryTraces.routes.routesskShiftSlots.routeskShiftSlots.routes";
export const routes = new Elysia({ prefix: "/api" })
  .use(usersR_routes
  .use(groupsRoutes)
  .use(region_routess)
  .use(historyTracesRoutes)
  .use(deliverymenRoutes)
  .use(client_routess)
  .use(workShiftSlotsRoutes)
  .use(paymentRequestsRoutes)
  .use(planningRoutes);
