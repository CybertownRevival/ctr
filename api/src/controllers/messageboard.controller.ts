import {Request, response, Response} from 'express';
import validator from 'validator';
import { Container } from 'typedi';
import { MemberService, MessageboardService } from '../services';
import sanitizeHtml from 'sanitize-html';

class MessageboardController {
  
  constructor(
   private memberService: MemberService,
   private messageboardService: MessageboardService,
  ) {
  }
  
  public async getAdminInfo(request: Request, response: Response): Promise<any> {
    const placeId = Number.parseInt(request.body.place_id);
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    try {
      const admin = await this.messageboardService.getAdminInfo(
        placeId,
        id,
      );
      response.status(200).json({admin});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        error: 'An error occurred while getting admin information',
      });
    }
  }
  public async getInfo(request: Request, response: Response): Promise<void> {
    const placeId = Number.parseInt(request.body.place_id);
    if (placeId <= 0) {
      response.status(400).json({
        error: 'placeId is required.',
      });
      return;
    }
    try {
      const placeinfo = await this.messageboardService.getInfo(placeId);
      response.status(200).json({placeinfo});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch place information.',
      });
    }
  }
  
  public async getMessageboardMessages(request: Request, response: Response): Promise<void> {
    const placeId = Number.parseInt(request.body.place_id);
    if (placeId <= 0) {
      response.status(400).json({
        error: 'placeId is required.',
      });
      return;
    }
    try {
      const messageboardmessages = await this.messageboardService.getMessageboardMessages(placeId);
      response.status(200).json({messageboardmessages});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch message board messages.',
      });
    }
  }
  
  public async getMessage(request: Request, response: Response): Promise<void> {
    const messageId = Number.parseInt(request.body.message_id);
    try {
      const getmessage = await this.messageboardService.getMessage(messageId);
      response.status(200).json({getmessage});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        err: 'A problems occurred when getting the message',
      });
    }
  }
  
  public async postMessageboardMessage(request: Request, response: Response): Promise<any> {
    const placeId = Number.parseInt(request.body.place_id);
    const subject = request.body.subject;
    let body = request.body.body;
    body = sanitizeHtml(body, {
      allowedTags: [
        "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
        "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
        "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
        "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
        "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
        "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
        "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "img",
        "font",
      ],
      disallowedTagsMode: 'discard',
      allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: [ 'src', 'srcset', 'alt', 'title', 'width', 'height' ],
        font: [ 'color', 'size' ],
      },
    });
    if (subject === '') {
      response.status(400).json({
        error: 'A subject is required',
      });
      return;
    }
    if (body === '') {
      response.status(400).json({
        error: 'A message is required',
      });
      return;
    }
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        err: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    try{
      const data = await this
        .messageboardService
        .postMessageboardMessage(id, placeId, subject, body);
      response.status(200).json({data});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        err: 'An error occurred when trying to post message',
      });
    }
  }
  
  public async postMessageboardReply(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    const placeId = Number.parseInt(request.body.place_id);
    const subject = request.body.subject;
    let body = request.body.body;
    body = sanitizeHtml(body, {
      allowedTags: [
        "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
        "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
        "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
        "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
        "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
        "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
        "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "img",
        "font",
      ],
      disallowedTagsMode: 'discard',
      allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: [ 'src', 'srcset', 'alt', 'title', 'width', 'height' ],
        font: [ 'color', 'size' ],
      },
    });
    const parentId = request.body.parent_id;
    try {
      const  data = await this
        .messageboardService
        .postMessageboardReply(id, placeId, subject, body, parentId);
      response.status(200).json({data});
    } catch (error){
      console.log(error);
      response.status(400).json({
        error: 'An error occurred when trying to post reply',
      });
    }
  }
  
  public async deleteMessageboardMessage(request: Request, response: Response): Promise<void> {
    const placeId = Number.parseInt(request.body.place_id);
    const messageId = Number.parseInt(request.body.message_id);
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    try {
      await this.messageboardService.deleteMessageboardMessage(placeId, id, messageId);
      response.status(200).json({success: 'deleted'});
    } catch (error) {
      console.log(error);
      if (error.message === 'not authorized') {
        response.status(403).json({
          error: 'You are not authorized to delete messages on this board.'
        });
      } else {
        response.status(400).json({
          error: 'An error occurred when trying to delete message',
        });
        return;
      }
    }
  }
  
  public async changeMessageboardIntro(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    const placeId = Number.parseInt(request.body.place_id);
    let intro = request.body.intro;
    intro = sanitizeHtml(intro, {
      allowedTags: [
        "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
        "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
        "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
        "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
        "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
        "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
        "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "img",
        "font",
      ],
      disallowedTagsMode: 'discard',
      allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: [ 'src', 'srcset', 'alt', 'title', 'width', 'height' ],
        font: [ 'color', 'size' ],
      },
    });
    try {
      console.log('Controller' + placeId);
      console.log(id);
      await this.messageboardService.changeMessageboardIntro(id, placeId, intro);
      response.status(200).json({
        success: 'intro updated',
      });
    } catch (error) {
      console.log(error);
      if (error.message === 'not authorized') {
        response.status(403).json({
          error: 'You are not authorized to make that change',
        });
      }
      response.status(400).json({
        error: 'An error occurred when updating message board intro',
      });
    }
  }
}
const memberService = Container.get(MemberService);
const messageboardService = Container.get(MessageboardService);
export const messageboardController = new MessageboardController(
  memberService,
  messageboardService);