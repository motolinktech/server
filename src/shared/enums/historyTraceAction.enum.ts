export const historyTraceActionsEnum = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  DELETE: "DELETE",
} as const;

export type HistoryTraceActionType =
  (typeof historyTraceActionsEnum)[keyof typeof historyTraceActionsEnum];
