import { Request, Response } from 'express';
import crypto from 'crypto';
import { Container } from 'typedi';
import { MemberService, ObjectService } from '../services';
import validator from 'validator';
//import { ObjectInstanceService } from '../services';

class ObjectController {
  constructor(private memberService: MemberService, private objectService: ObjectService) {}

  /** Validates and uploads an object for approval **/
  public async add(request, response: Response): Promise<void> {
    let wrlFileSizeLimit = 250000;
    let textureFileSizeLimit = 250000;
    let imageFileSizeLimit = 250000;
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
        error: 'Object name is required.',
      });
      return;
    }

    if (!validator.isInt(request.body.price)) {
      response.status(400).json({
        error: 'Price must be a whole number.',
      });
      return;
    } else if (parseInt(request.body.price) < 100) {
      response.status(400).json({
        error: 'Price must be a minimum of 10cc.',
      });
      return;
    }

    if (!validator.isInt(request.body.quantity)) {
      response.status(400).json({
        error: 'Quantity must be a whole number.',
      });
      return;
    } else if (parseInt(request.body.quantity) < 130) {
      response.status(400).json({
        error: 'Quantity must be a minimum of 10.',
      });
      return;
    }

    // TODO: validate user has enough funds for upload

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
    if (fileExtension !== 'wrl' || request.files.wrlFile.mimetype !== 'application/octet-stream') {
      response.status(400).json({
        error: 'VRML file must be a .wrl file',
      });
      return;
    }
    if (request.files.wrlFile.size > wrlFileSizeLimit) {
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
      if (fileExtension !== 'jpeg' || request.files.textureFile.mimetype !== 'image/jpeg') {
        response.status(400).json({
          error: 'Texture file must be a .jpeg file',
        });
        return;
      }
      if (request.files.textureFile.size > textureFileSizeLimit) {
        response.status(400).json({
          error: 'Texture file must less than 250kb',
        });
        return;
      }
    }

    if (
      typeof request.files.imageFile === 'undefined' &&
      validator.isEmpty(request.files.imageFile.name)
    ) {
      response.status(400).json({
        error: 'Thumbnail file is required.',
      });
      return;
    }

    fileExtension = request.files.imageFile.name.split('.').pop();
    if (fileExtension !== 'jpeg' || request.files.imageFile.mimetype !== 'image/jpeg') {
      response.status(400).json({
        error: 'Thumbnail file must be a .jpeg file',
      });
      return;
    }
    if (request.files.imageFile.size > imageFileSizeLimit) {
      response.status(400).json({
        error: 'Thumbnail file must less than 250kb',
      });
      return;
    }

    let uuid = crypto.randomUUID();

    // TODO: generate a uuid for this object
    this.objectService.uploadObjectFiles(
      uuid,
      request.files.wrlFile,
      request.files.imageFile,
      request.files.textureFile ?? null,
    );

    response.status(200).json({ uuid: uuid });

    // TODO: upload wrlfile (renaming)

    // TODO: upload texture file (don't rename)

    // TODO: upload image file (renaming)

    // TODO: insert object

    // TODO: deduct funds from uploader

    // TODO: return

    //

    response.status(200).json({ status: 'happ' });
  }
}
const memberService = Container.get(MemberService);
const objectService = Container.get(ObjectService);
export const objectController = new ObjectController(memberService, objectService);
