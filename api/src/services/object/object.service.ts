import { text } from 'body-parser';
const fs = require('fs');
import { Service } from 'typedi';

//import { ObjectInstanceRepository } from '../../repositories';
//import { ObjectInstancePosition, ObjectInstanceRotation } from 'models';

/** Service for dealing with blocks */
@Service()
export class ObjectService {
  //constructor(private objectInstanceRepository: ObjectInstanceRepository) {}

  public async uploadObjectFiles(directoryName, wrlFile, imageFile, textureFile?) {
    let uploadPath = process.env.ASSETS_DIR + '/object/' + directoryName;

    fs.mkdirSync(uploadPath);
    wrlFile.mv(uploadPath + '/' + wrlFile.name);
    imageFile.mv(uploadPath + '/' + imageFile.name);
    if (textureFile) {
      textureFile.mv(uploadPath + '/' + textureFile.name);
    }
    return true;
  }
}
