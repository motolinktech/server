import { t } from "elysia";

export const CookieSchema = t.Object({
  sessionId: t.String(),
  sessionExpiresAt: t.String(),
  currentBranch: t.String(),
});
