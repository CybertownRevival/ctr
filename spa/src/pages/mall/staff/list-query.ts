/**
 * Canonical URL state for the Mall staff lists.
 *
 * Page, limit and sort are kept in the URL so a review session survives
 * navigation, a browser Back, and the round trip out to the checker and back.
 * They do not need to be *written* when they are the defaults: a first visit to
 * the Warehouse produced
 *
 *     #/mall/warehouse?page=1&limit=10&order=ASC
 *
 * which is three parameters saying "no change from normal" and makes a shared
 * or bookmarked link look like a filtered view when it is not.
 *
 * Only what differs from the list's own defaults is written. Explicit values
 * are still read back, so every URL that already exists keeps working.
 */

export interface ListDefaults {
  limit: number;
  order: string;
}

export interface ListState {
  page: number;
  limit: number;
  order: string;
}

/** The page sizes the lists offer. Anything else in a URL is ignored. */
export const LIST_LIMITS = [10, 20, 50, 100];

/**
 * Each staff list's own defaults.
 *
 * Deliberately not one shared constant: Stocked shows newest first, the others
 * oldest first, and collapsing that would silently re-sort one of them.
 */
export const LIST_DEFAULTS: { [list: string]: ListDefaults } = {
  pending: { limit: 10, order: "ASC" },
  warehouse: { limit: 10, order: "ASC" },
  stocked: { limit: 10, order: "DESC" },
  soldout: { limit: 10, order: "ASC" },
};

/** The defaults for a named list, or the common ones for an unknown name. */
export function listDefaults(list: string): ListDefaults {
  return LIST_DEFAULTS[list] || { limit: 10, order: "ASC" };
}

/**
 * The query to put in the URL: only what is not already the default.
 *
 * Values are strings because that is what they will be when they are read back
 * out of a URL, and a route whose query is `{page: 2}` and one whose query is
 * `{page: '2'}` are not equal to vue-router's duplicate-navigation check.
 */
export function canonicalListQuery(
  state: ListState,
  defaults: ListDefaults,
): { [key: string]: string } {
  const query: { [key: string]: string } = {};
  if (state.page > 1) {
    query.page = String(state.page);
  }
  if (state.limit !== defaults.limit) {
    query.limit = String(state.limit);
  }
  if (state.order !== defaults.order) {
    query.order = state.order;
  }
  return query;
}

/**
 * Reads list state back out of a URL, falling back to the list's defaults.
 *
 * Anything malformed is ignored rather than rejected: a hand-edited or
 * truncated link should land the checker on a sane list, not an error.
 */
export function readListState(
  query: { [key: string]: unknown },
  defaults: ListDefaults,
): ListState {
  const limit = Number.parseInt(String(query.limit || ""), 10);
  const page = Number.parseInt(String(query.page || ""), 10);
  const order = String(query.order || "");
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: LIST_LIMITS.indexOf(limit) !== -1 ? limit : defaults.limit,
    order: order === "ASC" || order === "DESC" ? order : defaults.order,
  };
}
