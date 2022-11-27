export const MockQueryBuilder = {
  first: jest.fn().mockReturnThis(),
  insert: jest.fn(),
  limit: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  whereRaw: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  toSQL: jest.fn().mockReturnThis(),
  toNative: jest.fn().mockReturnThis(),
};

export const mockDb = {
  knex: {
    transaction: jest.fn(),
  },
  avatar: MockQueryBuilder,
  mapLocation: MockQueryBuilder,
  member: MockQueryBuilder,
  message: MockQueryBuilder,
  objectInstance: MockQueryBuilder,
  place: MockQueryBuilder,
  transaction: MockQueryBuilder,
  wallet: MockQueryBuilder,
}
