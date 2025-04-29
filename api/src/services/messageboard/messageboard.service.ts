import { Service } from 'typedi';

import {
  MessageboardRepository,
  ColonyRepository,
} from '../../repositories';
import sanitizeHtml from 'sanitize-html';
import {forEach} from "lodash";

/** Service for dealing with messages on message boards */
@Service()
export class MessageboardService {
  public static readonly MAX_QUERY_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id','date'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];
  
  constructor(
   private messageboardRepository: MessageboardRepository,
  ) {}
  
  public async changeMessageboardIntro(
    placeId,
    Intro,
  ): Promise<any> {
    console.log(`Service${  placeId}`);
    return await this.messageboardRepository.changeMessageboardIntro(placeId, Intro);
  }
  public async deleteMessageboardMessage(
    messageId,
  ): Promise<any> {
    return await this
      .messageboardRepository
      .deleteMessageboardMessage(messageId);
  }
  
  public async getAdminInfo(
    placeId,
    memberId,
  ): Promise<any> {
    return await this.messageboardRepository.getAdminInfo(placeId, memberId);
  }
  public async getInfo(
    placeId: number,
  ): Promise<any> {
    return await this.messageboardRepository.getInfo(placeId);
  }
  
  public async getMessageboardMessages(
    placeId: number,
  ): Promise<any> {
    return await this.messageboardRepository.getMessageboardMessages(placeId);
  }
  
  public async postMessageboardMessage(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
  ): Promise<any> {
    return await this
      .messageboardRepository
      .postMessageboardMessage(memberId, placeId, subject, message);
  }
  
  public async postMessageAllMessage(
    memberId: number,
    locations: object,
    subject: string,
    message: string,
  ): Promise<any> {
    forEach(locations, async (id) => {
      await this
        .messageboardRepository
        .postMessageboardMessage(memberId, id, subject, message);
    });
    return;
  }
  
  public async postMessageboardReply(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
    parentId: number,
  ): Promise<any>{
    return await this
      .messageboardRepository
      .postMessageboardReply(memberId, placeId, subject, message, parentId);
  }
  
  public async sanitize(
    uncleanInfo: string,
  ): Promise<any>{
    const cleanInfo = sanitizeHtml(uncleanInfo, {
      allowedTags: [
        'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4',
        'h5', 'h6', 'hgroup', 'main', 'nav', 'section', 'blockquote', 'dd', 'div',
        'dl', 'dt', 'figcaption', 'figure', 'hr', 'li', 'main', 'marquee', 'ol', 'p', 'pre',
        'ul', 'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
        'em', 'i', 'kbd', 'mark', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp',
        'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'caption',
        'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'img',
        'font', 'center', 'map', 'area',
      ],
      disallowedTagsMode: 'discard',
      allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: [ 'src', 'srcset', 'alt', 'title', 'width', 'height', 'usemap' ],
        font: [ 'color', 'size' ],
        map: [ 'name' ],
        area: [ 'alt', 'title', 'href', 'coords', 'shape', 'target', 'class' ],
        marquee: ['width', 'height', 'direction'],
      },
    });
    return cleanInfo;
  }
  public async getMessage(
    messageId: number,
  ): Promise<void>{
    return await this
      .messageboardRepository
      .getMessage(messageId);
    console.log('Service');
  }
}
