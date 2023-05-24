import { db } from '../../src/db';
import { MemberRepository } from '../../src/repositories/member/member.repository';

const members = new MemberRepository(db);

(async () => {
  console.log('Creating admin user');
  await members.create({
    admin: true,
    email: 'admin@admin',
    password: 'admin',
    username: 'admin',
  });
  console.log('Creating dev user');
  await members.create({
    email: 'dev@dev',
    password: 'dev',
    username: 'dev',
  });
})();
