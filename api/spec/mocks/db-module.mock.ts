/**
 * A stand-in for the `Db` class, for specs that have to import a controller.
 *
 * Controllers import the services barrel, which instantiates every repository at
 * module load. `RoleRepository`'s constructor issues a query straight away, so
 * merely importing a controller opens a MySQL connection and an unhandled
 * rejection when no database is running. Mocking the module keeps controller
 * specs pure and runnable without a database.
 *
 * Usage, at the top of a spec file:
 *
 *   jest.mock('../db/db.class', () => require('@spec/mocks/db-module.mock').mockDbModule());
 */

/**
 * A query builder that is both awaitable (resolving to an empty result set) and
 * infinitely chainable, so any repository call shape works without each spec
 * having to enumerate knex's API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeBuilder(): any {
  // Untyped on purpose: `Proxy`'s target must be a real awaitable object here,
  // and every property this mock's `get` trap can return is another
  // infinitely-chainable builder -- there is no knex type this could satisfy.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolved: any = Promise.resolve([]);
  return new Proxy(resolved, {
    get(target, property) {
      if (property === 'then' || property === 'catch' || property === 'finally') {
        return target[property].bind(target);
      }
      return () => makeBuilder();
    },
  });
}

export function mockDbModule(): { Db: unknown } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Service } = require('typedi');

  class MockDb {
    constructor() {
      return new Proxy({}, { get: () => makeBuilder() });
    }
  }

  // The repositories are typedi services whose constructors ask the container for
  // `Db`, so the replacement has to be registered exactly as the real class is.
  Service()(MockDb);

  return { Db: MockDb };
}
