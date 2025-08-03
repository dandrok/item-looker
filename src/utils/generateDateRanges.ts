import { addDays, format, isBefore } from "date-fns";

export function generateDateRanges(
  start: Date,
  end: Date,
  tripLengths: number[] // e.g. [10, 12, 14, 16, 18]
) {
  const departureDates: string[] = [];
  const returnDatesMap: { [key: string]: string[] } = {};

  let current = new Date(start);

  while (isBefore(current, end)) {
    const departStr = format(current, "MMMM d yyyy");
    departureDates.push(departStr);

    returnDatesMap[departStr] = tripLengths
      .map((len) => {
        const ret = addDays(current, len);
        return format(ret, "MMMM d yyyy");
      })
      .filter((retStr) => new Date(retStr) <= end);

    current = addDays(current, 1);
  }

  return { departureDates, returnDatesMap };
}
