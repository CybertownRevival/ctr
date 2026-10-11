import { Request, Response } from 'express';
import { Container } from 'typedi';
import validator from 'validator';
import * as badwords from 'badwords-list';

import {
  DesignerHomeService,
  MemberService,
} from '../services';
import { SessionInfo } from '../types';

class DesignerHomeController {
  constructor(
    private designerHomeService: DesignerHomeService,
    private memberService: MemberService,
  ) {}

  /** Returns the session if the member can administer Designer Homes, otherwise responds 403. */
  private async adminSession(request: Request, response: Response): Promise<SessionInfo> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    if (!(await this.designerHomeService.canAdmin(session.id))) {
      response.status(403).json({ error: 'Access Denied' });
      return;
    }
    return session;
  }

  public async canAdmin(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;
    response.status(200).json({ status: 'success' });
  }

  public async getStores(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const stores = await this.designerHomeService.getStores();
      response.status(200).json({ status: 'success', stores });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching the stores.' });
    }
  }

  public async getStoreHomes(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const designerHomes = await this.designerHomeService.getForSale(
        Number.parseInt(request.params.id),
        session.id,
      );
      response.status(200).json({ status: 'success', designerHomes });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching the homes.' });
    }
  }

  public async getUploadStatus(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      response.status(200).json({
        status: 'success',
        enabled: await this.designerHomeService.isUploadEnabled(),
        banned: await this.designerHomeService.isBanned(session.id),
      });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching the upload status.' });
    }
  }

  public async upload(request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    if (!(await this.designerHomeService.isUploadEnabled())) {
      response.status(400).json({ error: 'Designer Homes uploading is currently closed.' });
      return;
    }

    if (await this.designerHomeService.isBanned(session.id)) {
      response.status(403).json({ error: 'You are banned from uploading Designer Homes.' });
      return;
    }

    const name = (request.body.name ?? '').toString().trim();
    if (validator.isEmpty(name)) {
      response.status(400).json({ error: 'Home name is required.' });
      return;
    }
    if (name.length > 64) {
      response.status(400).json({ error: 'Home name must be 64 characters or less.' });
      return;
    }
    if (name.match(badwords.regex)) {
      response.status(400).json({ error: 'This language can not be used on CTR!' });
      return;
    }

    const price = (request.body.price ?? '').toString();
    if (!validator.isInt(price)) {
      response.status(400).json({ error: 'Price must be a whole number.' });
      return;
    }
    if (Number.parseInt(price) < DesignerHomeService.MIN_PRICE) {
      response.status(400).json({
        error: `Price must be a minimum of ${DesignerHomeService.MIN_PRICE}cc.`,
      });
      return;
    }

    const storeId = Number.parseInt(request.body.storeId);
    if (Number.isNaN(storeId) || !(await this.designerHomeService.isStore(storeId))) {
      response.status(400).json({ error: 'Please choose a store for your home.' });
      return;
    }

    const files = request.files ?? {};
    const { wrlFile, imageFile } = files;

    if (!wrlFile || validator.isEmpty(wrlFile.name)) {
      response.status(400).json({ error: 'VRML file is required.' });
      return;
    }
    if (
      wrlFile.name.split('.').pop().toLowerCase() !== 'wrl' ||
      ![
        'application/octet-stream',
        'model/vrml',
        'x-world/x-vrml',
        'application/x-world',
      ].includes(wrlFile.mimetype)
    ) {
      response.status(400).json({ error: 'VRML file must be a .wrl file.' });
      return;
    }
    if (wrlFile.size > DesignerHomeService.WRL_FILESIZE_LIMIT) {
      response.status(400).json({ error: 'VRML file must be less than 1mb.' });
      return;
    }

    if (!imageFile || validator.isEmpty(imageFile.name)) {
      response.status(400).json({ error: 'Thumbnail file is required.' });
      return;
    }
    if (
      !['jpeg', 'jpg'].includes(imageFile.name.split('.').pop().toLowerCase()) ||
      !['image/jpeg', 'image/pjpeg'].includes(imageFile.mimetype)
    ) {
      response.status(400).json({ error: 'Thumbnail file must be a .jpeg or .jpg file.' });
      return;
    }
    if (imageFile.size > DesignerHomeService.IMAGE_FILESIZE_LIMIT) {
      response.status(400).json({ error: 'Thumbnail file must be less than 80kb.' });
      return;
    }

    const textureFiles = [];
    for (let i = 1; i <= DesignerHomeService.MAX_TEXTURES; i++) {
      const textureFile = files[`textureFile${i}`];
      if (!textureFile || validator.isEmpty(textureFile.name)) continue;

      // textures keep their names so the .wrl can reference them
      if (!/^[\w-]+\.(jpe?g|gif|png)$/i.test(textureFile.name)) {
        response.status(400).json({
          error: 'Texture files must be .jpeg, .jpg, .gif or .png files, ' +
            'named with letters, numbers, dashes and underscores only.',
        });
        return;
      }
      if (!['image/jpeg', 'image/pjpeg', 'image/gif', 'image/png']
        .includes(textureFile.mimetype)) {
        response.status(400).json({
          error: 'Texture files must be .jpeg, .jpg, .gif or .png files.',
        });
        return;
      }
      if (textureFile.size > DesignerHomeService.TEXTURE_FILESIZE_LIMIT) {
        response.status(400).json({ error: 'Texture files must be less than 256kb each.' });
        return;
      }
      textureFiles.push(textureFile);
    }

    try {
      await this.designerHomeService.create(
        wrlFile,
        imageFile,
        textureFiles,
        name,
        Number.parseInt(price),
        storeId,
        session.id,
      );
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while uploading your home.' });
    }
  }

  public async buy(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const error = await this.designerHomeService.buy(
        session.id,
        Number.parseInt(request.body.id),
      );
      if (error) {
        response.status(400).json({ error });
        return;
      }
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while buying this home.' });
    }
  }

  public async getPreview(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const homeDesign = await this.designerHomeService.getPreview(
        Number.parseInt(request.params.id),
        session.id,
      );
      if (!homeDesign) {
        response.status(404).json({ error: 'Home not found.' });
        return;
      }
      response.status(200).json({ status: 'success', homeDesign });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching this home.' });
    }
  }

  public async getOwned(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const homeDesigns = await this.designerHomeService.getOwnedHomeDesigns(session.id);
      response.status(200).json({ status: 'success', homeDesigns });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching your homes.' });
    }
  }

  public async getMyUploads(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const designerHomes = await this.designerHomeService.getByCreator(session.id);
      response.status(200).json({ status: 'success', designerHomes });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching your uploads.' });
    }
  }

  public async getPending(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      const designerHomes = await this.designerHomeService.getPending();
      response.status(200).json({ status: 'success', designerHomes });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching pending homes.' });
    }
  }

  public async getStocked(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      const designerHomes = await this.designerHomeService.getStocked();
      response.status(200).json({ status: 'success', designerHomes });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching stocked homes.' });
    }
  }

  public async approve(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      const id = Number.parseInt(request.body.id);
      const storeId = Number.parseInt(request.body.storeId);
      const designerHome = await this.designerHomeService.findById(id);
      if (!designerHome || designerHome.status !== DesignerHomeService.STATUS_PENDING) {
        response.status(400).json({ error: 'This home is not pending approval.' });
        return;
      }
      if (!(await this.designerHomeService.isStore(storeId))) {
        response.status(400).json({ error: 'Invalid store.' });
        return;
      }
      await this.designerHomeService.approve(id, storeId);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while approving this home.' });
    }
  }

  public async move(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      const storeId = Number.parseInt(request.body.storeId);
      if (!(await this.designerHomeService.isStore(storeId))) {
        response.status(400).json({ error: 'Invalid store.' });
        return;
      }
      await this.designerHomeService.move(Number.parseInt(request.body.id), storeId);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while moving this home.' });
    }
  }

  public async remove(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      await this.designerHomeService.remove(Number.parseInt(request.body.id));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while removing this home.' });
    }
  }

  public async getSettings(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      response.status(200).json({
        status: 'success',
        uploadEnabled: await this.designerHomeService.isUploadEnabled(),
        bans: await this.designerHomeService.getBans(),
      });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while fetching the settings.' });
    }
  }

  public async updateUploadStatus(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      await this.designerHomeService.setUploadEnabled(request.body.enabled === true);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while updating the upload status.' });
    }
  }

  public async ban(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      const username = (request.body.username ?? '').toString().trim();
      if (!(await this.designerHomeService.ban(username, session.id))) {
        response.status(400).json({ error: 'Member not found.' });
        return;
      }
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while banning this member.' });
    }
  }

  public async unban(request: Request, response: Response): Promise<void> {
    const session = await this.adminSession(request, response);
    if (!session) return;

    try {
      await this.designerHomeService.unban(Number.parseInt(request.body.memberId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'A problem occurred while removing this ban.' });
    }
  }
}

const designerHomeService = Container.get(DesignerHomeService);
const memberService = Container.get(MemberService);

export const designerHomeController = new DesignerHomeController(
  designerHomeService,
  memberService,
);
