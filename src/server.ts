import bearer from "@elysiajs/bearer";
import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { routes } from "./routes";

const app = new Elysia()
  .use(
    cors({
      credentials: true,
      origin: true,
    }),
  )
  .use(bearer())
  .use(
    openapi({
      path: "/docs",
      documentation: {
        components: {
          securitySchemes: {
            cookieAuth: {
              type: "apiKey",
              in: "cookie",
              name: "auth",
            },
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [
          {
            cookieAuth: [],
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
