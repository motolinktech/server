import { dayjs } from "./dayjs";

interface DateRangeOptions {
  month?: number;
  week?: number;
}

export function getDateRange(options?: DateRangeOptions) {
  if (options?.month) {
    const year = dayjs().year();
    const startDate = dayjs()
      .year(year)
      .month(options.month - 1)
      .startOf("month");
    const endDate = dayjs()
      .year(year)
      .month(options.month - 1)
      .endOf("month");

    return {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    };
  }

  if (options?.week) {
    const year = dayjs().year();
    const startDate = dayjs()
      .year(year)
      .isoWeek(options.week)
      .startOf("isoWeek");
    const endDate = dayjs().year(year).isoWeek(options.week).endOf("isoWeek");

    return {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    };
  }

  const today = dayjs();
  const dayOfWeek = today.day();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startDate = today.subtract(daysToSubtract, "day").startOf("day");
  const endDate = startDate.add(6, "day").endOf("day");

  return {
    startDate: startDate.toDate(),
    endDate: endDate.toDate(),
  };
}
