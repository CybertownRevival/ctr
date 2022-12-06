import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(advancedFormat);

/** Vue filter for formatting dates */
export function dateFormatFilter(value: string): string {
  if (value) {
    return dayjs(String(value)).format('dddd, MMMM Do YYYY')
  }
};
