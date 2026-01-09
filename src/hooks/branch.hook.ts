import Elysia, { t } from "elysia";

export const branchHook = new Elysia({
  name: "branch-hook",
}).macro("validateBranch", {
  headers: t.Object({
    currentBranch: t.String(),
  }),
  beforeHandle: async ({ headers: { currentBranch } }) => {},
});
// .guard({
//   headers: t.Object({
//     currentBranch: t.String().optional(),
//   }),
//   user: User,
//   beforeHandle: async ({ headers: { currentBranch }, store, user }) => {
//     store.branchId = currentBranch || null;
//   },
// });
