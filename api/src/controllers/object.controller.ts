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
      if (
        !['jpeg', 'jpg', 'gif', 'png'].includes(fileExtension) ||
        !['image/jpeg','image/pjpeg', 'image/gif', 'image/png']
          .includes(request.files.textureFile.mimetype) 
      ) {
        response.status(400).json({
          error: 'Texture file must be a .jpeg, .jpg, .gif, or .png file',
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
    if (
      !['jpeg', 'jpg'].includes(fileExtension) ||
      !['image/jpeg', 'image/pjpeg'].includes(request.files.imageFile.mimetype)
    ) {
      response.status(400).json({
        error: 'Thumbnail file must be a .jpeg or .jpg file',
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

  public async getObject(request: Request, response: Response): Promise<any> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);

    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    try{
      const object = await this.objectService.findById(parseInt(request.params.id));
      response.status(200).json({
        status: 'success',
        object: object,
      });
    } catch(error) {
      console.error(error);
      response.status(400).json({'error': error.message});
    }
  }

  public async increaseQuantity(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    try{
      const object = await this.objectService.findById(request.body.objectId);
      const increase = request.body.qty;
      const member = await this.memberService.find({ id: session.id });
      const wallet = await this.walletService.findById(member.wallet_id);
      const sellerFee = this.objectService.getSellerFee(increase, object.price);
      if (object.member_id !== session.id) {
        throw new Error('You do not own this object!');
      }
      if (sellerFee > wallet.balance) {
        throw new Error('You do not have enough CCs.');
      }
      if (object.limit && object.quantity + increase > object.limit){
        throw new Error('You can not upload more than what the object is limited to.');
      }
      await this.objectService.performObjectRestockTransaction(session.id, sellerFee);
      await this.objectService.increaseQuantity(object.id, object.quantity + increase, object.status);
      response.status(200).json({
        status: 'success',
      });
    } catch(error) {
      console.error(error);
      response.status(400).json({'error': error.message});
    }
  }
}
const memberService = Container.get(MemberService);
const objectService = Container.get(ObjectService);
const walletService = Container.get(WalletService);
export const objectController = new ObjectController(memberService, objectService, walletService);
