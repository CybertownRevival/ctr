import { Request, Response } from 'express';
import { Container } from 'typedi';
import validator from 'validator';

import {
  FundboxService,
  MemberService,
} from '../services';
import { TransactionRepository } from '../repositories';

class FundboxController {
  constructor(
    private memberService: MemberService,
    private fundboxService: FundboxService,
    private transactionRepository: TransactionRepository,
  ) { }

    /**
   * Returns the Fundboxes available through the member's global audit role.
   */
  public async getAuditFundboxes(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);

    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

    try {
      const member = await this.memberService.find({ id: session.id });

      if (!member) {
        response.status(400).json({
          error: 'Member not found.',
        });
        return;
      }

      const fundboxes =
        await this.fundboxService.getAuditFundboxes(member.id);

      if (fundboxes.length === 0) {
        response.status(403).json({
          error: 'You do not have permission to audit Fundboxes.',
        });
        return;
      }

      response.status(200).json(fundboxes);
    } catch (error) {
      console.log(error);

      response.status(400).json({
        error:
          error.message ||
          'A problem occurred while loading Fundboxes.',
      });
    }
  }

    /**
   * Returns a Fundbox and its current balance when the member has permission
   * to view it.
   */
  public async getFundbox(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);

    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

    const fundboxId = String(request.params.id);

    if (!validator.isInt(fundboxId, { min: 1 })) {
      response.status(400).json({
        error: 'Invalid Fundbox.',
      });
      return;
    }

    try {
      const member = await this.memberService.find({ id: session.id });

      if (!member) {
        response.status(400).json({
          error: 'Member not found.',
        });
        return;
      }

      const parsedFundboxId = parseInt(fundboxId, 10);

      const fundbox =
        await this.fundboxService.findByIdWithBalance(parsedFundboxId);

      if (!fundbox) {
        response.status(404).json({
          error: 'Fundbox not found.',
        });
        return;
      }

      const canView = await this.fundboxService.canView(
        parsedFundboxId,
        member.id,
      );

      if (!canView) {
        response.status(403).json({
          error: 'You do not have permission to view this Fundbox.',
        });
        return;
      }

      response.status(200).json(fundbox);
    } catch (error) {
      console.log(error);

      response.status(400).json({
        error: error.message || 'A problem occurred while loading the Fundbox.',
      });
    }
  }

  /**
   * Returns the transaction history for a Fundbox when the member has
   * permission to view it.
   */
  public async getTransactions(
    request: Request,
    response: Response,
  ): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);

    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

    const fundboxId = String(request.params.id);

    if (!validator.isInt(fundboxId, { min: 1 })) {
      response.status(400).json({
        error: 'Invalid Fundbox.',
      });
      return;
    }

    try {
      const member = await this.memberService.find({ id: session.id });

      if (!member) {
        response.status(400).json({
          error: 'Member not found.',
        });
        return;
      }

      const parsedFundboxId = parseInt(fundboxId, 10);

      const fundbox = await this.fundboxService.findById(parsedFundboxId);

      if (!fundbox) {
        response.status(404).json({
          error: 'Fundbox not found.',
        });
        return;
      }

      const canView = await this.fundboxService.canView(
        parsedFundboxId,
        member.id,
      );

      if (!canView) {
        response.status(403).json({
          error: 'You do not have permission to view this Fundbox.',
        });
        return;
      }

      const transactions =
        await this.fundboxService.getTransactions(parsedFundboxId);

      response.status(200).json(transactions);
    } catch (error) {
      console.log(error);

      response.status(400).json({
        error:
          error.message ||
          'A problem occurred while loading Fundbox transactions.',
      });
    }
  }

  /**
   * Donates CCs from the logged-in member to a Fundbox.
   */
  public async donate(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);

    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

    const fundboxId = String(request.body.fundboxId);
    const amount = String(request.body.amount);

    if (!validator.isInt(fundboxId, { min: 1 })) {
      response.status(400).json({
        error: 'Invalid Fundbox.',
      });
      return;
    }

    if (!validator.isInt(amount, { min: 1 })) {
      response.status(400).json({
        error: 'Donation must be a positive whole number of CCs.',
      });
      return;
    }

    try {
      const member = await this.memberService.find({ id: session.id });

      if (!member) {
        response.status(400).json({
          error: 'Member not found.',
        });
        return;
      }

      const fundbox = await this.fundboxService.findById(
        parseInt(fundboxId, 10),
      );

      if (!fundbox) {
        response.status(404).json({
          error: 'Fundbox not found.',
        });
        return;
      }

      const transaction =
        await this.transactionRepository.createFundboxDonationTransaction(
          member.wallet_id,
          fundbox.wallet_id,
          parseInt(amount, 10),
          member.id,
        );

      response.status(200).json({
        success: 'Donation completed.',
        transaction,
      });
    } catch (error) {
      console.log(error);

      response.status(400).json({
        error: error.message || 'A problem occurred while making the donation.',
      });
    }
  }

    /**
   * Awards CCs from a Fundbox to a member.
   */
  public async award(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);

    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

    const fundboxId = String(request.body.fundboxId);
    const recipientId = String(request.body.recipientId);
    const amount = String(request.body.amount);

    if (!validator.isInt(fundboxId, { min: 1 })) {
      response.status(400).json({
        error: 'Invalid Fundbox.',
      });
      return;
    }

    if (!validator.isInt(recipientId, { min: 1 })) {
      response.status(400).json({
        error: 'Invalid recipient.',
      });
      return;
    }

    if (!validator.isInt(amount, { min: 1 })) {
      response.status(400).json({
        error: 'Award must be a positive whole number of CCs.',
      });
      return;
    }

    try {
      const authorizer = await this.memberService.find({ id: session.id });

      if (!authorizer) {
        response.status(400).json({
          error: 'Member not found.',
        });
        return;
      }

      const parsedFundboxId = parseInt(fundboxId, 10);

      const fundbox = await this.fundboxService.findById(parsedFundboxId);

      if (!fundbox) {
        response.status(404).json({
          error: 'Fundbox not found.',
        });
        return;
      }

      const canAward = await this.fundboxService.canAward(
        parsedFundboxId,
        authorizer.id,
      );

      if (!canAward) {
        response.status(403).json({
          error: 'You do not have authority to award CCs from this Fundbox.',
        });
        return;
      }

      const recipient = await this.memberService.find({
        id: parseInt(recipientId, 10),
      });

      if (!recipient) {
        response.status(404).json({
          error: 'Recipient not found.',
        });
        return;
      }

      const transaction =
        await this.transactionRepository.createFundboxAwardTransaction(
          fundbox.wallet_id,
          recipient.wallet_id,
          parseInt(amount, 10),
          authorizer.id,
        );

      response.status(200).json({
        success: 'CCs awarded successfully.',
        transaction,
      });
    } catch (error) {
      console.log(error);

      response.status(400).json({
        error: error.message || 'A problem occurred while awarding CCs.',
      });
    }
  }
}

const memberService = Container.get(MemberService);
const fundboxService = Container.get(FundboxService);
const transactionRepository = Container.get(TransactionRepository);

export const fundboxController = new FundboxController(
  memberService,
  fundboxService,
  transactionRepository,
);
