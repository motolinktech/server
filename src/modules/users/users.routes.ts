import Elysia from "elysia";
import { authHook } from "../../hooks/auth.hook";

export const usersRoutes = new Elysia({
  prefix: "/users",
  detail: {
    tags: ["Users"],
  },
})
  .use(authHook)
  .post("/", () => {
    return "Create User";
  })
  .get("/me", ({ user }) => {
    console.log(user.email);
    return "Get Current User";
  });
