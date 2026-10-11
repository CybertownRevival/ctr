import { Container } from 'typedi';
import { createSpyObj } from 'jest-createspyobj';

import { DesignerHomeService } from './designer-home.service';
import {
  DesignerHomeRepository,
  MemberRepository,
  PlaceRepository,
  RoleAssignmentRepository,
  RoleRepository,
  SettingRepository,
} from '../../repositories';

describe('DesignerHomeService', () => {
  let designerHomeRepository: jest.Mocked<DesignerHomeRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let roleAssignmentRepository: jest.Mocked<RoleAssignmentRepository>;
  let roleRepository: jest.Mocked<RoleRepository>;
  let settingRepository: jest.Mocked<SettingRepository>;
  let service: DesignerHomeService;

  const designerHome: any = {
    id: 7,
    member_id: 2,
    place_id: 3,
    name: 'Sea Castle',
    price: 500,
    directory: 'abc-123',
    filename: 'f00.wrl',
    image: 'f00.jpg',
    status: DesignerHomeService.STATUS_ACTIVE,
  };

  beforeEach(() => {
    designerHomeRepository = createSpyObj(DesignerHomeRepository);
    memberRepository = createSpyObj(MemberRepository);
    roleAssignmentRepository = createSpyObj(RoleAssignmentRepository);
    roleRepository = createSpyObj(RoleRepository);
    roleRepository.roleMap = { Admin: 1, HomebuilderManager: 20 };
    settingRepository = createSpyObj(SettingRepository);
    Container.reset();
    Container.set(DesignerHomeRepository, designerHomeRepository);
    Container.set(MemberRepository, memberRepository);
    Container.set(PlaceRepository, createSpyObj(PlaceRepository));
    Container.set(RoleAssignmentRepository, roleAssignmentRepository);
    Container.set(RoleRepository, roleRepository);
    Container.set(SettingRepository, settingRepository);
    service = Container.get(DesignerHomeService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('canAdmin', () => {
    it('allows Homebuilder Managers', async () => {
      roleAssignmentRepository.getByMemberId.mockResolvedValue([{ role_id: 20 }] as any);
      expect(await service.canAdmin(1)).toBe(true);
    });

    it('denies other roles', async () => {
      roleAssignmentRepository.getByMemberId.mockResolvedValue([{ role_id: 5 }] as any);
      expect(await service.canAdmin(1)).toBe(false);
    });
  });

  describe('isUploadEnabled', () => {
    it('is enabled unless switched OFF', async () => {
      settingRepository.get.mockResolvedValue(null);
      expect(await service.isUploadEnabled()).toBe(true);
      settingRepository.get.mockResolvedValue('OFF');
      expect(await service.isUploadEnabled()).toBe(false);
    });
  });

  describe('buy', () => {
    it('rejects homes that are not for sale', async () => {
      designerHomeRepository.findById.mockResolvedValue({
        ...designerHome,
        status: DesignerHomeService.STATUS_PENDING,
      });
      expect(await service.buy(1, 7)).toBe('This home is no longer available.');
      expect(designerHomeRepository.purchase).not.toHaveBeenCalled();
    });

    it('rejects homes the member already owns', async () => {
      designerHomeRepository.findById.mockResolvedValue(designerHome);
      designerHomeRepository.isOwned.mockResolvedValue(true);
      expect(await service.buy(1, 7)).toBe('You already own this home.');
      expect(designerHomeRepository.purchase).not.toHaveBeenCalled();
    });

    it('pays the creator', async () => {
      designerHomeRepository.findById.mockResolvedValue(designerHome);
      designerHomeRepository.isOwned.mockResolvedValue(false);
      designerHomeRepository.purchase.mockResolvedValue(true);
      memberRepository.findById.mockImplementation(async id => ({ id, wallet_id: id * 10 } as any));

      expect(await service.buy(1, 7)).toBeNull();
      expect(designerHomeRepository.purchase).toHaveBeenCalledWith(1, 10, 20, 7, 500);
    });

    it('reports insufficient funds', async () => {
      designerHomeRepository.findById.mockResolvedValue({ ...designerHome, member_id: null });
      designerHomeRepository.isOwned.mockResolvedValue(false);
      designerHomeRepository.purchase.mockResolvedValue(false);
      memberRepository.findById.mockResolvedValue({ id: 1, wallet_id: 10 } as any);

      expect(await service.buy(1, 7)).toBe('Not enough funds to buy this home.');
      expect(designerHomeRepository.purchase).toHaveBeenCalledWith(1, 10, null, 7, 500);
    });
  });

  describe('findHomeDesign', () => {
    it('maps a Designer Home to a free home design with its own world path', async () => {
      designerHomeRepository.findById.mockResolvedValue(designerHome);
      expect(await service.findHomeDesign('deshome-7')).toEqual({
        id: 'deshome-7',
        price: 0,
        name: 'Sea Castle',
        assets_dir: 'deshomes/abc-123/',
        world_filename: 'f00.wrl',
        image: '/assets/worlds/deshomes/abc-123/f00.jpg',
      });
    });

    it('requires ownership when a member is given', async () => {
      designerHomeRepository.isOwned.mockResolvedValue(false);
      expect(await service.findHomeDesign('deshome-7', 1)).toBeUndefined();
      expect(designerHomeRepository.findById).not.toHaveBeenCalled();
    });
  });

  it('recognises Designer Home design ids', () => {
    expect(service.isHomeDesignId('deshome-7')).toBe(true);
    expect(service.isHomeDesignId('003')).toBe(false);
    expect(service.isHomeDesignId(null)).toBe(false);
  });
});
