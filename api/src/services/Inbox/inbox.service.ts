import { Service } from 'typedi';

import {
  InboxRepository,
  ColonyRepository,
} from '../../repositories';
import sanitizeHtml from 'sanitize-html';

/** Service for dealing with messages on message boards */
@Service()
export class InboxService {
  public static readonly MAX_QUERY_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id','date'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];
  
  constructor(
   private inboxRepository: InboxRepository,
  ) {}
  
  public async changeInboxIntro(
    placeId,
    Intro,
  ): Promise<any> {
    console.log(`Service${  placeId}`);
    return await this.inboxRepository.changeInboxIntro(placeId, Intro);
  }
  public async deleteInboxMessage(
    messageId,
  ): Promise<any> {
    return await this
      .inboxRepository
      .deleteInboxMessage(messageId);
  }
  
  public async getAdminInfo(
    placeId,
    memberId,
  ): Promise<any> {
    return await this.inboxRepository.getAdminInfo(placeId, memberId);
  }
  public async getInfo(
    placeId: number,
  ): Promise<any> {
    return await this.inboxRepository.getInfo(placeId);
  }
  
  public async getInboxMessages(
    placeId: number,
  ): Promise<any> {
    return await this.inboxRepository.getInboxMessages(placeId);
  }
  
  public async postInboxMessage(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
  ): Promise<any> {
    return await this
      .inboxRepository
      .postInboxMessage(memberId, placeId, subject, message);
  }
  
  public async postInboxReply(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
    parentId: number,
  ): Promise<any>{
    return await this
      .inboxRepository
      .postInboxReply(memberId, placeId, subject, message, parentId);
  }
  
  public async sanitize(
    uncleanInfo: string,
  ): Promise<any>{
    const cleanInfo = sanitizeHtml(uncleanInfo, {
      allowedTags: [
        'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4',
        'h5', 'h6', 'hgroup', 'main', 'nav', 'section', 'blockquote', 'dd', 'div',
        'dl', 'dt', 'figcaption', 'figure', 'hr', 'li', 'main', 'ol', 'p', 'pre',
        'ul', 'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
        'em', 'i', 'kbd', 'mark', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp',
        'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'caption',
        'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'img',
        'font', 'center',
      ],
      disallowedTagsMode: 'discard',
      allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: [ 'src', 'srcset', 'alt', 'title', 'width', 'height' ],
        font: [ 'color', 'size' ],
      },
    });
    return cleanInfo;
  }
  public async getMessage(
    messageId: number,
  ): Promise<void>{
    return await this
      .inboxRepository
      .getMessage(messageId);
    console.log('Service');
  }
}
