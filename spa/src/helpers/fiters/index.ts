export * from './date-format.filter';

/** Interface combining all of our custom filters, used to extend the Vue prototype */
export interface VueWithCustomFilters {
  dateFormatFilter: (value: string) => string,
}