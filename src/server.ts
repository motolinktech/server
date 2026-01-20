import bearer from "@elysiajs/bearer";
import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { routes } from "./routes";
import { AppError } from "./utils/appError";

const isProd = process.env.NODE_ENV === "production";

const app = new Elysia()
  .onError(({ error, status }) => {
    if (error instanceof AppError) return status(error.code, error.message);

    return status(400, "Bad Request");
  })
  .use(
    cors({
      origin: isProd
        ? "https://webapp-motolink-d9a92e605d18.herokuapp.com"
        : true,
      credentials: true,
    }),
  )
  .use(bearer())
  .use(
    openapi({
      path: "/docs",
      documentation: {
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      scalar: {
        credentials: "include",
      },
    }),
  )
  .use(routes)
  // .onAfterHandle(({}) => {

  // })
  .listen(process.env.PORT || 8888);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
