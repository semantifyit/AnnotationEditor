import express from 'express';

import WebApis, { WebApiLeanDoc as WebApi } from '../models/WebApi';
import { consumeFullAction, getActionLinkById } from '../util/action';

const router = express.Router();

router.post('/:id', async (req, res) => {
  try {
    const { body } = req;

    const { action, webApi } = await getActionLinkById(req.params.id);

    const actionInput = typeof body === 'object' ? JSON.stringify(body) : body;
    const resp = await consumeFullAction(
      actionInput,
      action.requestMapping,
      action.responseMapping,
      webApi.prefixes,
      action.potentialActionLinks,
    );

    res.json(resp);
  } catch (e) {
    //console.log(e.stack);
    // req.body.actionStatus = 'FailedActionStatus';
    // req.body.error = e.toString();
    // res.json(req.body);
    res.status(400).json({ err: e.toString() });
  }
});

export default router;
