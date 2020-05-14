import express from 'express';

import WebApis, { WebApiLeanDoc as WebApi } from '../models/WebApi';
import { getActionById } from '../util/action';
import { filterUndef } from '../../../client/src/util/utils';

const router = express.Router();

router.get('/webapi/:id', async (req, res) => {
  const webAPI: WebApi = await WebApis.findById(req.params.id).lean();
  if (!webAPI) {
    res.status(404).json({ err: `WebAPI ${req.params.id} not found` });
    return;
  }
  res.json(webAPI.annotationSrc);
});

router.get('/action/:id', async (req, res) => {
  try {
    const action = await getActionById(req.params.id);
    res.json(action.annotationSrc);
  } catch {
    res.status(404).json({ err: `Action ${req.params.id} not found` });
    return;
  }
});

export default router;
