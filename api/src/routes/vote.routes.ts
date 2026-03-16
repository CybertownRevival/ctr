import Router from 'express';

import { voteController } from '../controllers/vote.controller';

const voteRoutes = Router();

voteRoutes.post('/castmayorvote', (request, response) =>
  voteController.castMayorVote(request, response));

voteRoutes.get('/checkifeligible', (request, response) =>
  voteController.checkIfEligibleToVote(request, response));

voteRoutes.get('/checkifvoted/:voteId', (request, response) =>
  voteController.checkIfVoted(request, response));

export { voteRoutes };
