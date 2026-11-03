import { createSpyObj } from 'jest-createspyobj';
import { ObjectWithUsername } from '../../repositories/object/object.repository';

/**
 * The fixtures carry only the columns decoration reads, not whole object rows,
 * so the helper takes what the tests actually build.
 */
type FixtureObject = Partial<ObjectWithUsername> & { id: number };
import { StoreRow } from '../../repositories/mall-object/mall-object.repository';
import { Member } from '../../types/models';

import { MallService } from './mall.service';
import {
  MallRepository,
  MemberRepository,
  ObjectInstanceRepository,
  ObjectRepository,
  PlaceRepository,
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';

/**
 * The per-object loop these tests replace, transcribed from the previous
 * implementation. Every batched result is checked against it so the change is
 * provably output-preserving rather than merely plausible.
 */
async function legacyDecorate(
  objects: FixtureObject[],
  members: { [id: number]: Pick<Member, 'id' | 'username'> },
  stores: { [id: number]: Partial<StoreRow> },
  counts: { [id: number]: number },
): Promise<FixtureObject[]> {
  const decorated = [];
  for (const object of objects) {
    const user = object.member_id ? members[object.member_id] : null;
    const store = stores[object.id] ? [stores[object.id]] : [];
    decorated.push({
      ...object,
      username: user?.username || 'Deleted User',
      store: store[0],
      instances: counts[object.id] || 0,
    });
  }
  return decorated;
}

const OBJECTS = [
  { id: 10, member_id: 100, name: 'Lamp', quantity: 25, limit: null, status: 1 },
  { id: 11, member_id: 101, name: 'Chair', quantity: 25, limit: 25, status: 1 },
  { id: 12, member_id: null, name: 'Orphan', quantity: 5, limit: null, status: 1 },
  { id: 13, member_id: 100, name: 'Unsold', quantity: 30, limit: null, status: 1 },
];

const MEMBERS = {
  100: { id: 100, username: 'BassMekanik' },
  101: { id: 101, username: 'Morning.star' },
};

const STORES = {
  10: { id: 1205, name: 'Toy Store', object_id: 10 },
  11: { id: 1191, name: 'Furniture Store', object_id: 11 },
  12: { id: 1193, name: 'General Store', object_id: 12 },
};

const COUNTS = { 10: 25, 11: 25, 12: 5 };

describe('MallService - batched list decoration', () => {
  let roleAssignmentRepository: jest.Mocked<RoleAssignmentRepository>;
  let roleRepository: jest.Mocked<RoleRepository>;
  let objectRepository: jest.Mocked<ObjectRepository>;
  let objectInstanceRepository: jest.Mocked<ObjectInstanceRepository>;
  let placeRepository: jest.Mocked<PlaceRepository>;
  let mallRepository: jest.Mocked<MallRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let service: MallService;

  beforeEach(() => {
    roleAssignmentRepository = createSpyObj(RoleAssignmentRepository);
    roleRepository = createSpyObj(RoleRepository);
    objectRepository = createSpyObj(ObjectRepository);
    objectInstanceRepository = createSpyObj(ObjectInstanceRepository);
    placeRepository = createSpyObj(PlaceRepository);
    mallRepository = createSpyObj(MallRepository);
    memberRepository = createSpyObj(MemberRepository);

    memberRepository.findByIds.mockResolvedValue(MEMBERS as never);
    mallRepository.getStoresByObjectIds.mockResolvedValue(STORES as never);
    objectInstanceRepository.countByObjectIds.mockResolvedValue(COUNTS as never);

    service = new MallService(
      roleAssignmentRepository,
      roleRepository,
      objectRepository,
      objectInstanceRepository,
      placeRepository,
      mallRepository,
      memberRepository,
    );
  });

  describe('findSoldOut', () => {
    beforeEach(() => {
      objectRepository.findMallSoldOut.mockResolvedValue(
        OBJECTS.map(object => ({ ...object })) as never,
      );
    });

    it('produces exactly what the previous per-object loop produced', async () => {
      const result = await service.findSoldOut();
      const expected = await legacyDecorate(OBJECTS, MEMBERS, STORES, COUNTS);

      expect(result.objects).toEqual(expected);
    });

    it('preserves object order', async () => {
      const result = await service.findSoldOut();

      expect(result.objects.map((object: FixtureObject) => object.id)).toEqual([10, 11, 12, 13]);
    });

    it('keeps the "Deleted User" placeholder for an object with no creator', async () => {
      const result = await service.findSoldOut();
      const orphan = result.objects.find((object: FixtureObject) => object.id === 12);

      expect(orphan.username).toBe('Deleted User');
    });

    it('defaults an object with no instances to a sold count of zero', async () => {
      const result = await service.findSoldOut();
      const unsold = result.objects.find((object: FixtureObject) => object.id === 13);

      expect(unsold.instances).toBe(0);
      expect(unsold.store).toBeUndefined();
    });

    it('asks for the creators, stores and counts once each, not once per object',
      async () => {
        await service.findSoldOut();

        expect(memberRepository.findByIds).toHaveBeenCalledTimes(1);
        expect(mallRepository.getStoresByObjectIds).toHaveBeenCalledTimes(1);
        expect(objectInstanceRepository.countByObjectIds).toHaveBeenCalledTimes(1);
        expect(memberRepository.findById).not.toHaveBeenCalled();
        expect(mallRepository.getStore).not.toHaveBeenCalled();
        expect(objectInstanceRepository.countByObjectId).not.toHaveBeenCalled();
      });

    it('does not query at all for an empty result set', async () => {
      objectRepository.findMallSoldOut.mockResolvedValue([] as never);

      const result = await service.findSoldOut();

      expect(result.objects).toEqual([]);
      expect(memberRepository.findByIds).not.toHaveBeenCalled();
    });

    it('excludes null creator ids from the member lookup', async () => {
      await service.findSoldOut();

      expect(memberRepository.findByIds).toHaveBeenCalledWith([100, 101, 100]);
    });
  });

  describe('searchMallObjects', () => {
    it('now carries the store, which the search page could not show before',
      async () => {
        objectRepository.searchMallObjects.mockResolvedValue(
          [{ ...OBJECTS[0] }] as never,
        );
        objectRepository.getTotal.mockResolvedValue([{ count: 1 }] as never);

        const result = await service.searchMallObjects('lamp', 10, 0);

        expect(result.objects[0].store).toEqual(STORES[10]);
        expect(result.objects[0].instances).toBe(25);
        expect(result.objects[0].username).toBe('BassMekanik');
      });
  });

  describe('getAllObjects', () => {
    it('decorates a page the same way, in one round of queries', async () => {
      objectRepository.findAllObjects.mockResolvedValue(
        OBJECTS.map(object => ({ ...object })) as never,
      );
      objectRepository.total.mockResolvedValue([{ count: 4 }] as never);

      const result = await service.getAllObjects('status', '=', '1', 10, 0, 'ASC');
      const expected = await legacyDecorate(OBJECTS, MEMBERS, STORES, COUNTS);

      expect(result.objects).toEqual(expected);
      expect(objectInstanceRepository.countByObjectIds).toHaveBeenCalledTimes(1);
    });
  });
});
