import crypto from 'crypto';
const fs = require('fs');
import { Service } from 'typedi';
import { Avatar } from 'models';

import {
  AvatarRepository,
} from '../../repositories';

/** Service for dealing with avatars */
@Service()
export class AvatarService {
  constructor(
    private avatarRepository: AvatarRepository,
  ) {}

  public static readonly WRL_FILESIZE_LIMIT = 250000;
  public static readonly TEXTURE_FILESIZE_LIMIT = 250000;
  public static readonly IMAGE_FILESIZE_LIMIT = 250000;

  public static readonly STATUS_DELETED = 0;
  public static readonly STATUS_ACTIVE = 1;
  public static readonly STATUS_PENDING = 2;


  /**
   * Finds all avatars
   * @returns promise resolving all avatars object, or rejecting on error
   */
  public async findAll(): Promise<Avatar[]> {
    return await this.avatarRepository.findAll();
  }

  /**
   * Finds all avatars a member id can access
   * @returns promise resolving all avatars object, or rejecting on error
   */
  public async getResults(memberId : number): Promise<Avatar[]> {
    return await this.avatarRepository.findAllForMemberId(memberId);
  }

  /**
   * create an avatar (file upload and record)
   * @param wrlFile
   * @param imageFile
   * @param textureFile
   * @param name
   * @param gestures
   * @param privateStatus
   * @param memberId
   */
  public async create(wrlFile, imageFile, textureFile, name, gestures, privateStatus, memberId) {
    let uuid = crypto.randomUUID();
    let fileName = crypto.randomBytes(8).toString('hex');

    const assets = await this.uploadAvatarFiles(
      uuid,
      fileName,
      wrlFile,
      imageFile,
      textureFile ?? null,
    );

    this.avatarRepository.create(
      uuid,
      assets.filename,
      assets.image,
      name,
      gestures,
      privateStatus,
      memberId,
      AvatarService.STATUS_PENDING
    );
  }

  public async uploadAvatarFiles(
    directoryName,
    fileName,
    wrlFile,
    imageFile,
    textureFile?,
  ): Promise<any> {
    let uploadPath = process.env.ASSETS_DIR + '/avatars/' + directoryName;
    const response = {
      filename: null,
      image: null,
      texture: null,
    };

    fs.mkdirSync(uploadPath);
    wrlFile.mv(uploadPath + '/' + fileName + '.wrl');
    response.filename = fileName + '.wrl';

    let imageExtension = imageFile.name.split('.').pop();
    imageFile.mv(uploadPath + '/' + fileName + '.' + imageExtension);
    response.image = fileName + '.' + imageExtension;

    if (textureFile) {
      textureFile.mv(uploadPath + '/' + textureFile.name);
      response.texture = textureFile.name;
    }
    return response;
  }
}
