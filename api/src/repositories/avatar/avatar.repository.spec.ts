import { Container } from 'typedi';

import { mockDb } from '@spec/mocks';
import { Db } from '../../db/db.class';
import { Avatar } from 'models';
import { AvatarRepository} from './avatar.repository';

describe('AvatarRepository', () => {
  const fakeAvatar: Partial<Avatar> = {
    id: 11,
  };
  let repository: AvatarRepository;

  beforeEach(() => {
    mockDb.avatar.where.mockResolvedValue([fakeAvatar]);
    Container.reset();
    Container.set(Db, mockDb);
    repository = Container.get(AvatarRepository);
  });

  it('should create', () => {
    expect(repository).toBeTruthy();
  });
});
