import { Request, Response } from 'express';
import { Container } from 'typedi';
//import { ObjectInstanceService } from '../services';

class ObjectController {
  //constructor(private objectInstanceService: ObjectInstanceService) {}
  /** Stores the position of an object instance in the database */
  public async add(request: Request, response: Response): Promise<void> {
    /*
    try {
      if (
        !request.body?.position.x ||
        !request.body?.position.y ||
        !request.body?.position.z ||
        !request.body?.rotation.x ||
        !request.body?.rotation.y ||
        !request.body?.rotation.z ||
        !request.body?.rotation.angle
      ) {
        throw new Error('Invalid position or rotation.');
      }

      const id = Number.parseInt(request.params.id);

      await this.objectInstanceService.updateObjectPlacement(
        id,
        request.body.position,
        request.body.rotation,
      );

      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  */
  }
}
//const objectInstanceService = Container.get(ObjectInstanceService);
export const objectController = new ObjectController(/*objectInstanceService*/);
