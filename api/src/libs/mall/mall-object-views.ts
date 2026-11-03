/**
 * The Mall staff panel's six views, expressed once so the checker, the lists and
 * the export all agree on what "stocked" or "out of stock" means.
 *
 * These are CURRENT CTR VIEW MEMBERSHIPS, not stored states. Nothing in the
 * database records "out of stock"; it is derived. They also OVERLAP by design -
 * a sold-out object is in both `stocked` and `outOfStock` - so they must never be
 * collapsed into a single status label.
 */

/** Mirrors the STATUS_* constants on ObjectService. */
export const MALL_OBJECT_STATUS = {
  DELETED: 0,
  ACTIVE: 1,
  PENDING: 2,
  APPROVED: 3,
  INACTIVE: 4,
};

const STATUS_NAMES: { [status: number]: string } = {
  0: 'DELETED',
  1: 'ACTIVE',
  2: 'PENDING',
  3: 'APPROVED',
  4: 'INACTIVE',
};

/** The staff-facing wording for each status, as the panel labels them. */
const STATUS_LABELS: { [status: number]: string } = {
  0: 'Removed',
  1: 'Stocked',
  2: 'Pending',
  3: 'Warehouse',
  4: 'Destocked',
};

export function statusName(status: number): string {
  return STATUS_NAMES[status] || 'UNKNOWN';
}

export function statusLabel(status: number): string {
  return STATUS_LABELS[status] || 'Unknown';
}

export interface CtrViewInput {
  status: number;
  /** Number of object_instance rows, i.e. how many have sold. */
  sold: number;
  quantity: number;
  limit: number | null;
}

export interface CtrViews {
  pending: boolean;
  warehouse: boolean;
  stocked: boolean;
  outOfStock: boolean;
  removed: boolean;
  inactive: boolean;
}

/**
 * The SQL-equivalent predicate behind each view, published in the export so a
 * downstream importer never has to guess what a membership list meant.
 */
export const CTR_VIEW_DEFINITIONS = {
  pending: 'object.status = 2',
  warehouse: 'object.status = 3',
  stocked: 'object.status = 1',
  outOfStock:
    'object.status = 1 AND sold = quantity AND (limit = quantity OR limit IS NULL)',
  removed: 'object.status = 0',
  inactive: 'object.status = 4',
};

/**
 * Reproduces `spa/src/pages/mall/staff/soldout.vue` exactly, including a quirk
 * that is deliberately preserved rather than fixed here.
 *
 * That page tests `['0', 'Unlimited', null].includes(obj.limit)`, but `limit` is
 * an INT column, so MySQL returns the NUMBER 0 and `0 !== '0'`. An object whose
 * limit was explicitly set to 0 - which the Update Limit prompt calls
 * "Unlimited" - is therefore excluded from Out of Stock today.
 *
 * Changing that would change which objects staff see in that view, which is a
 * Mall policy decision rather than a refactor. It is reported as a follow-up and
 * left alone here so this helper stays a faithful description of current CTR.
 */
export function isOutOfStock(input: CtrViewInput): boolean {
  if (input.status !== MALL_OBJECT_STATUS.ACTIVE) {
    return false;
  }
  if (input.sold !== input.quantity) {
    return false;
  }
  const limit = input.limit === undefined ? null : input.limit;
  return limit === input.quantity || limit === null;
}

export function ctrViewsFor(input: CtrViewInput): CtrViews {
  return {
    pending: input.status === MALL_OBJECT_STATUS.PENDING,
    warehouse: input.status === MALL_OBJECT_STATUS.APPROVED,
    stocked: input.status === MALL_OBJECT_STATUS.ACTIVE,
    outOfStock: isOutOfStock(input),
    removed: input.status === MALL_OBJECT_STATUS.DELETED,
    inactive: input.status === MALL_OBJECT_STATUS.INACTIVE,
  };
}
