import { Container } from 'typedi';
import { MemberService } from '../services';

module.exports = () => {
  console.log('Todo: interface with role services to dish out income');
  const memberService = Container.get(MemberService);
  memberService.giveRoleIncome();
};
