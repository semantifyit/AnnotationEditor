import express from 'express';

import WebApis, { WebApiLeanDoc as WebApi } from '../models/WebApi';
import { consumeFullAction } from '../util/action';

const router = express.Router();

router.post('/:id', async (req, res) => {
  try {
    const { body } = req;

    const webAPI: WebApi = await WebApis.findOne({
      'actions.id': req.params.id,
    }).lean();
    if (!webAPI) {
      res.status(404).json({ err: `Action ${req.params.webApiPath} not found` });
      return;
    }

    const action = webAPI.actions.find(({ id }) => id === req.params.id);
    if (!action) {
      res.status(404).json({ err: `Action ${req.params.actionPath} not found` });
      return;
    }

    const actionInput = typeof body === 'object' ? JSON.stringify(body) : body;
    const resp = await consumeFullAction(
      actionInput,
      action.requestMapping,
      action.responseMapping,
      webAPI.prefixes,
      (e) => {
        res.status(400).json({ err: e });
      },
    );

    res.json(resp);
  } catch (e) {
    console.log(e.stack);
    // req.body.actionStatus = 'FailedActionStatus';
    // req.body.error = e.toString();
    // res.json(req.body);
    res.json({ err: e.toString() });
  }
});

export default router;
