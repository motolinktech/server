export const workShiftSlotStatusEnum = {
  OPEN: "OPEN",
  INVITED: "INVITED",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  ABSENT: "ABSENT",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
} as const;

export type WorkShiftSlotStatusType =
  (typeof workShiftSlotStatusEnum)[keyof typeof workShiftSlotStatusEnum];

export const workShiftSlotStatusesArr = Object.values(workShiftSlotStatusEnum);

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [workShiftSlotStatusEnum.OPEN]: [
    workShiftSlotStatusEnum.INVITED,
    workShiftSlotStatusEnum.CONFIRMED,
    workShiftSlotStatusEnum.CANCELLED,
  ],
  [workShiftSlotStatusEnum.INVITED]: [
    workShiftSlotStatusEnum.CONFIRMED,
    workShiftSlotStatusEnum.OPEN,
    workShiftSlotStatusEnum.CANCELLED,
    workShiftSlotStatusEnum.REJECTED,
  ],
  [workShiftSlotStatusEnum.CONFIRMED]: [
    workShiftSlotStatusEnum.CHECKED_IN,
    workShiftSlotStatusEnum.ABSENT,
    workShiftSlotStatusEnum.CANCELLED,
  ],
  [workShiftSlotStatusEnum.CHECKED_IN]: [
    workShiftSlotStatusEnum.COMPLETED,
    workShiftSlotStatusEnum.ABSENT,
  ],
  [workShiftSlotStatusEnum.COMPLETED]: [],
  [workShiftSlotStatusEnum.ABSENT]: [],
  [workShiftSlotStatusEnum.CANCELLED]: [],
  [workShiftSlotStatusEnum.REJECTED]: [],
};

export function isValidStatusTransition(
  fromStatus: string,
  toStatus: string,
): boolean {
  const validTargets = VALID_STATUS_TRANSITIONS[fromStatus];
  if (!validTargets) return false;
  return validTargets.includes(toStatus);
}
