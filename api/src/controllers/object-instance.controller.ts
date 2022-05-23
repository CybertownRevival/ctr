import { Request, Response} from 'express';

import { db } from '../db';

class ObjectInstanceController {

  constructor() {}

  /** Stores the position of an object instance in the database */
  public async updateObjectInstancePosition(request: Request, response: Response): Promise<void> {
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
      const position = JSON.stringify({
        x: Number.parseFloat(request.body.position.x),
        y: Number.parseFloat(request.body.position.y),
        z: Number.parseFloat(request.body.position.z),
      });
      const rotation = JSON.stringify({
        x: Number.parseFloat(request.body.rotation.x),
        y: Number.parseFloat(request.body.rotation.y),
        z: Number.parseFloat(request.body.rotation.z),
        angle: Number.parseFloat(request.body.rotation.angle),
      });
  
      await db.objectInstance
        .where({ id })
        .update({ position, rotation });
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
}
export const objectInstanceController = new ObjectInstanceController();
