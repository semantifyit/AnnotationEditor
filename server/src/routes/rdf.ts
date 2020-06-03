import express from 'express';

import WebApis, { WebApiLeanDoc as WebApi } from '../models/WebApi';
import { getActionById } from '../util/action';

const router = express.Router();

router.get('/webapi/:id', async (req, res) => {
  const webAPI: WebApi = await WebApis.findOne({ id: req.params.id }).lean();
  if (!webAPI) {
    res.status(404).json({ err: `WebAPI ${req.params.id} not found` });
    return;
  }
  res.setHeader('content-type', 'application/ld+json');
  res.send(webAPI.annotation);
});

router.get('/action/:id', async (req, res) => {
  try {
    const action = await getActionById(req.params.id);
    res.setHeader('content-type', 'application/ld+json');
    res.send(action.annotation);
  } catch {
    res.status(404).json({ err: `Action ${req.params.id} not found` });
    return;
  }
});

export default router;
