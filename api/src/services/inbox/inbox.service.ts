import { Service } from 'typedi';

import { InboxRepository, ColonyRepository, RoleRepository } from '../../repositories';
import sanitizeHtml from 'sanitize-html';
import { stringify } from 'ts-jest';

/** Service for dealing with messages on message boards */
@Service()
export class InboxService {
  public static readonly MAX_QUERY_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id', 'date'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];

  constructor(
    private inboxRepository: InboxRepository,
    private roleRepository: RoleRepository) {}

  public async changeInboxIntro(placeId, Intro): Promise<any> {
    console.log(`Service${placeId}`);
    return await this.inboxRepository.changeInboxIntro(placeId, Intro);
  }
  public async deleteInboxMessage(messageId): Promise<any> {
    return await this.inboxRepository.deleteInboxMessage(messageId);
  }

  public async getAdminInfo(placeId, memberId): Promise<any> {
    const securityCode = this.roleRepository.roleMap.SecurityChief;
    return await this.inboxRepository.getAdminInfo(placeId, memberId, securityCode);
  }
  public async getInfo(placeId: number): Promise<any> {
    return await this.inboxRepository.getInfo(placeId);
  }

  public async getInboxMessages(placeId: number): Promise<any> {
    return await this.inboxRepository.getInboxMessages(placeId);
  }

  public async postInboxMessage(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
  ): Promise<any> {
    return await this.inboxRepository.postInboxMessage(memberId, placeId, subject, message);
  }

  public async postInboxReply(
    senderMemberId: number,
    receiverMemberId: number,
    subject: string,
    message: string,
    parentId: number,
  ): Promise<any> {
    const [placeId] = await this.inboxRepository.getHomeId(receiverMemberId);
    if (placeId === undefined) {
      throw Error('User does not have an inbox setup.');
    }
    return await this.inboxRepository.postInboxReply(
      senderMemberId,
      placeId.id,
      subject,
      message,
      parentId,
    );
  }

  public async sanitize(uncleanInfo: string): Promise<any> {
    const cleanInfo = sanitizeHtml(uncleanInfo, {
      allowedTags: [
        'address',
        'article',
        'aside',
        'footer',
        'header',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hgroup',
        'main',
        'nav',
        'section',
        'blockquote',
        'dd',
        'div',
        'dl',
        'dt',
        'figcaption',
        'figure',
        'hr',
        'li',
        'main',
        'ol',
        'p',
        'pre',
        'ul',
        'a',
        'abbr',
        'b',
        'bdi',
        'bdo',
        'br',
        'cite',
        'code',
        'data',
        'dfn',
        'em',
        'i',
        'kbd',
        'mark',
        'q',
        'rb',
        'rp',
        'rt',
        'rtc',
        'ruby',
        's',
        'samp',
        'small',
        'span',
        'strong',
        'sub',
        'sup',
        'time',
        'u',
        'var',
        'wbr',
        'caption',
        'col',
        'colgroup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'tr',
        'img',
        'font',
        'center',
        'map',
        'area',
      ],
      disallowedTagsMode: 'discard',
      allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height'],
        font: ['color', 'size'],
        map: [ 'name' ],
        area: [ 'alt', 'title', 'href', 'coords', 'shape', 'target' ],
      },
    });
    return cleanInfo;
  }
  public async getMessage(messageId: number): Promise<any> {
    return await this.inboxRepository.getMessage(messageId);
  }
}
