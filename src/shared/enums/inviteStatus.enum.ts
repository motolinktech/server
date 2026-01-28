export const inviteStatusEnum = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;

export type InviteStatusType =
  (typeof inviteStatusEnum)[keyof typeof inviteStatusEnum];

export const inviteStatusesArr = Object.values(inviteStatusEnum);
