/**
 * Row shapes that are not models.
 *
 * Aggregate queries return rows that no table owns, and typing them here keeps
 * the repositories honest without inventing a fake model for each one.
 */

/** What `count('<column> as count')` yields. */
export interface CountRow {
  count: number;
}
