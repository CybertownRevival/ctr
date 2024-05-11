import { Request, Response} from 'express';
import {Container} from 'typedi';
import validator from 'validator';

import {
  AvatarService,
  MemberService
} from '../services';


class AvatarController {

  constructor(
    private avatarService: AvatarService,
    private memberService: MemberService,
  ) {}

  /**
   * Returns an ordered list of all avatars.
   */
  public async getResults(request: Request, response: Response): Promise<void> {
    try {
      const { apitoken } = request.headers;
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
        return;
      }
      const avatars = await this.avatarService.getResults(session.id);
      response.status(200).json({ avatars });
    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch avatars.',
      });
    }
  }

   public async add(request, response: Response): Promise<void> {
    let fileExtension;
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

    if (validator.isEmpty(request.body.name)) {
      response.status(400).json({
        error: 'Avatar name is required.',
      });
      return;
    }

    if (!request.files) {
      response.status(400).json({
        error: 'VRML file is required',
      });
      return;
    }

    if (
      typeof request.files.wrlFile === 'undefined' ||
      validator.isEmpty(request.files.wrlFile.name)
    ) {
      response.status(400).json({
        error: 'VRML file is required',
      });
      return;
    }
    fileExtension = request.files.wrlFile.name.split('.').pop();
    if (
      fileExtension !== 'wrl' ||
      !['application/octet-stream', 'model/vrml', 'x-world/x-vrml', 'application/x-world'].includes(
        request.files.wrlFile.mimetype,
      )
    ) {
      response.status(400).json({
        error: 'VRML file must be a .wrl file',
      });
      return;
    }

    if (request.files.wrlFile.size > AvatarService.WRL_FILESIZE_LIMIT) {
      response.status(400).json({
        error: 'VRML file must less than 250kb',
      });
      return;
    }

    if (
      typeof request.files.textureFile !== 'undefined' &&
      !validator.isEmpty(request.files.textureFile.name)
    ) {
      fileExtension = request.files.textureFile.name.split('.').pop();
      if (
        !['jpeg', 'jpg'].includes(fileExtension) ||
        !['image/jpeg', 'image/pjpeg'].includes(request.files.textureFile.mimetype)
      ) {
        response.status(400).json({
          error: 'Texture file must be a .jpeg or .jpg file'
        });
        return;
      }
      if (request.files.textureFile.size > AvatarService.TEXTURE_FILESIZE_LIMIT) {
        response.status(400).json({
          error: 'Texture file must less than 250kb',
        });
        return;
      }
    }

    if (
      typeof request.files.imageFile === 'undefined' ||
      validator.isEmpty(request.files.imageFile.name)
    ) {
      response.status(400).json({
        error: 'Thumbnail file is required.',
      });
      return;
    }

    fileExtension = request.files.imageFile.name.split('.').pop();
    if (
      !['jpeg', 'jpg'].includes(fileExtension) ||
      !['image/jpeg', 'image/pjpeg'].includes(request.files.imageFile.mimetype)
    ) {
      response.status(400).json({
        error: 'Thumbnail file must be a .jpeg or .jpg file',
      });
      return;
    }
    if (request.files.imageFile.size > AvatarService.IMAGE_FILESIZE_LIMIT) {
      response.status(400).json({
        error: 'Thumbnail file must less than 250kb',
      });
      return;
    }

    let gesturesString = "";
    if (
      typeof request.body.gestures !== 'undefined'|| 
      !validator.isEmpty(request.body.gestures)
    ) {
      gesturesString = JSON.stringify(request.body.gestures.split(","));
    }

    if (
      typeof request.body.private === 'undefined'|| 
      validator.isEmpty(request.body.private)
    ) {
      response.status(400).json({
        error: 'Usage access is required',
      });
      return;
    }

    try {
      await this.avatarService.create(
        request.files.wrlFile,
        request.files.imageFile,
        request.files.textureFile ?? null,
        request.body.name,
        gesturesString,
        parseInt(request.body.private),
        session.id,
      );
    } catch (e) {
      response.status(400).json({
        error: e,
      });
      return;
    }

    response.status(200).json({
      status: 'success',
    });
  }
}
const avatarService = Container.get(AvatarService);
const memberService = Container.get(MemberService);
export const avatarController = new AvatarController(avatarService, memberService);
