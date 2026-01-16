export const periodEnum = {
  DAYTIME: "daytime",
  NIGHTTIME: "nighttime",
} as const;

export type PeriodType = (typeof periodEnum)[keyof typeof periodEnum];

export const periodsArr = Object.values(periodEnum);
