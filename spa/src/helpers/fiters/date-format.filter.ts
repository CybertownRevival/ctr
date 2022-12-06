import moment from 'moment';

/** Vue filter for formatting dates */
export function dateFormatFilter(value: string): string {
  if (value) {
    return moment(String(value)).format('dddd, MMMM Do YYYY')
  }
};
