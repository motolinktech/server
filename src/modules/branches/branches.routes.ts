import Elysia, { t } from "elysia";
import { Branch } from "../../../generated/prismabox/Branch";
import { authPlugin } from "../../hooks/auth.hook";
import { AppError } from "../../utils/appError";
import { BranchMutateSchema } from "./branches.schema";
import { branchesService } from "./branches.service";

const service = branchesService();

const responseBranch = t.Omit(Branch, ["regions", "groups", "deliverymen"]);

export const branchesRoutes = new Elysia({
  prefix: "/branches",
  detail: {
    tags: ["Branches"],
  },
})
  .use(authPlugin)
  .guard({ isAuth: true }, (app) =>
    app
      .get("/", ({ query }) => service.list(query), {
        response: {
          200: t.Object({
            data: t.Array(responseBranch),
            count: t.Number(),
          }),
        },
      })
      .onBeforeHandle(async ({ user }) => {
        if (user.role !== "ADMIN") {
          throw new AppError("Acesso negado", 401);
        }
      })
      .post("/", ({ body }) => service.create(body), {
        body: BranchMutateSchema,
        response: { 200: responseBranch },
      })
      .get("/:id", ({ params }) => service.getById(params.id), {
        response: { 200: responseBranch },
      })
      .put("/:id", ({ params, body }) => service.update(params.id, body), {
        body: BranchMutateSchema,
        response: { 200: responseBranch },
      }),
  );
