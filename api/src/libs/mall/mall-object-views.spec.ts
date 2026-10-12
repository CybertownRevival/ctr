import {
  ctrViewsFor,
  isOutOfStock,
  MALL_OBJECT_STATUS,
  statusLabel,
  statusName,
} from './mall-object-views';

/**
 * The reference implementation, transcribed from
 * spa/src/pages/mall/staff/soldout.vue as it stands today. Every out-of-stock
 * assertion below is checked against BOTH implementations, so this helper is
 * provably a faithful description of the current view rather than a guess.
 */
function soldOutVuePredicate(object: {
  instances: number;
  quantity: number;
  limit: number | null;
}): boolean {
  return object.instances === object.quantity
    && (object.limit === object.quantity
      || ['0', 'Unlimited', null].indexOf(object.limit as never) !== -1);
}

function expectAgreesWithVue(object: { sold: number; quantity: number; limit: number | null }) {
  const ours = isOutOfStock({ status: MALL_OBJECT_STATUS.ACTIVE, ...object });
  const theirs = soldOutVuePredicate({
    instances: object.sold,
    quantity: object.quantity,
    limit: object.limit,
  });

  expect(ours).toBe(theirs);
  return ours;
}

describe('statusName / statusLabel', () => {
  it('names every status the object table uses', () => {
    expect(statusName(0)).toBe('DELETED');
    expect(statusName(1)).toBe('ACTIVE');
    expect(statusName(2)).toBe('PENDING');
    expect(statusName(3)).toBe('APPROVED');
    expect(statusName(4)).toBe('INACTIVE');
  });

  it('labels statuses the way the staff panel does', () => {
    expect(statusLabel(1)).toBe('Stocked');
    expect(statusLabel(2)).toBe('Pending');
    expect(statusLabel(3)).toBe('Warehouse');
  });

  it('does not throw on an unknown status', () => {
    expect(statusName(99)).toBe('UNKNOWN');
    expect(statusLabel(99)).toBe('Unknown');
  });
});

describe('isOutOfStock - agrees with the current soldout.vue filter', () => {
  it('is true when everything sold and the limit is NULL', () => {
    expect(expectAgreesWithVue({ sold: 25, quantity: 25, limit: null })).toBe(true);
  });

  it('is true when everything sold and the limit equals the quantity', () => {
    expect(expectAgreesWithVue({ sold: 25, quantity: 25, limit: 25 })).toBe(true);
  });

  it('is false when stock remains', () => {
    expect(expectAgreesWithVue({ sold: 10, quantity: 25, limit: null })).toBe(false);
  });

  it('is false when the limit is above the quantity, so more can be stocked', () => {
    expect(expectAgreesWithVue({ sold: 25, quantity: 25, limit: 40 })).toBe(false);
  });

  it('preserves the limit = 0 exclusion the current view has', () => {
    // The Update Limit prompt calls 0 "Unlimited", but soldout.vue compares
    // against the STRING '0' while MySQL returns the NUMBER 0, so this object is
    // excluded today. Reported as a follow-up; deliberately reproduced here.
    expect(expectAgreesWithVue({ sold: 25, quantity: 25, limit: 0 })).toBe(false);
  });

  it('is false for anything that is not stocked, whatever its counts', () => {
    [
      MALL_OBJECT_STATUS.DELETED,
      MALL_OBJECT_STATUS.PENDING,
      MALL_OBJECT_STATUS.APPROVED,
      MALL_OBJECT_STATUS.INACTIVE,
    ].forEach(status => {
      expect(isOutOfStock({ status, sold: 25, quantity: 25, limit: null })).toBe(false);
    });
  });
});

describe('ctrViewsFor', () => {
  it('places a pending object in exactly one view', () => {
    const views = ctrViewsFor({
      status: MALL_OBJECT_STATUS.PENDING,
      sold: 0,
      quantity: 25,
      limit: null,
    });

    expect(views).toEqual({
      pending: true,
      warehouse: false,
      stocked: false,
      outOfStock: false,
      removed: false,
      inactive: false,
    });
  });

  it('places a sold-out object in BOTH stocked and outOfStock', () => {
    const views = ctrViewsFor({
      status: MALL_OBJECT_STATUS.ACTIVE,
      sold: 25,
      quantity: 25,
      limit: null,
    });

    // The overlap is the point: these are staff-panel views, not stored states.
    expect(views.stocked).toBe(true);
    expect(views.outOfStock).toBe(true);
  });

  it('places a stocked object with remaining quantity in stocked only', () => {
    const views = ctrViewsFor({
      status: MALL_OBJECT_STATUS.ACTIVE,
      sold: 1,
      quantity: 25,
      limit: null,
    });

    expect(views.stocked).toBe(true);
    expect(views.outOfStock).toBe(false);
  });

  it('treats an undefined limit as no limit', () => {
    const views = ctrViewsFor({
      status: MALL_OBJECT_STATUS.ACTIVE,
      sold: 5,
      quantity: 5,
      limit: undefined as never,
    });

    expect(views.outOfStock).toBe(true);
  });
});
