import { Request, Response } from 'express';
import { Container } from 'typedi';
import { MemberService, ObjectService, WalletService } from '../services';
import validator from 'validator';
//import { ObjectInstanceService } from '../services';

class ObjectController {
  constructor(
    private memberService: MemberService,
    private objectService: ObjectService,
    private walletService: WalletService,
  ) {}

  /** Validates and uploads an object for approval **/
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
        error: 'Object name is required.',
      });
      return;
    }

    if (!validator.isInt(request.body.price)) {
      response.status(400).json({
        error: 'Price must be a whole number.',
      });
      return;
    } else if (parseInt(request.body.price) < 10) {
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
    } else if (parseInt(request.body.quantity) < 10) {
      response.status(400).json({
        error: 'Quantity must be a minimum of 10.',
      });
      return;
    }

    const member = await this.memberService.find({ id: session.id });
    const wallet = await this.walletService.findById(member.wallet_id);
    const sellerFee = this.objectService.getSellerFee(request.body.quantity, request.body.price);
    if (sellerFee > wallet.balance) {
      response.status(400).json({
        error: 'Not enough funds to cover seller fee: ' + sellerFee + 'cc',
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
      fileExtension !== 'wrl' 
      || ![
        'application/octet-stream',
        'model/vrml',
        'x-world/x-vrml',
        'application/x-world'
      ].includes(request.files.wrlFile.mimetype) 
    ) {
      response.status(400).json({
        error: 'VRML file must be a .wrl file',
      });
      return;
    }

    if (request.files.wrlFile.size > ObjectService.WRL_FILESIZE_LIMIT) {
      response.status(400).json({
        error: 'VRML file must less than 80kb',
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
      if (request.files.textureFile.size > ObjectService.TEXTURE_FILESIZE_LIMIT) {
        response.status(400).json({
          error: 'Texture file must less than 80kb',
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
    if (fileExtension !== 'jpeg' || request.files.imageFile.mimetype !== 'image/jpeg') {
      response.status(400).json({
        error: 'Thumbnail file must be a .jpeg file',
      });
      return;
    }
    if (request.files.imageFile.size > ObjectService.IMAGE_FILESIZE_LIMIT) {
      response.status(400).json({
        error: 'Thumbnail file must less than 80kb',
      });
      return;
    }

    try {
      await this.objectService.create(
        request.files.wrlFile,
        request.files.imageFile,
        request.files.textureFile ?? null,
        request.body.name,
        request.body.quantity,
        request.body.price,
        session.id,
      );
    } catch (e) {
      response.status(400).json({
        error: e,
      });
      return;
    }

    await this.objectService.performObjectUploadTransaction(session.id, sellerFee);

    response.status(200).json({
      status: 'success',
    });
  }
}
const memberService = Container.get(MemberService);
const objectService = Container.get(ObjectService);
const walletService = Container.get(WalletService);
export const objectController = new ObjectController(memberService, objectService, walletService);
