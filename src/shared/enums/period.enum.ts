export const periodEnum = {
  DIURNO: "diurno",
  NOTURNO: "noturno",
} as const;

export type PeriodType = (typeof periodEnum)[keyof typeof periodEnum];

export const periodsArr = Object.values(periodEnum);
