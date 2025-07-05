import dayjs from "dayjs";

export function standardDateFormat(date: string | Date) {
  return dayjs(date).format("DD MMM [at] HH:mm");
}
