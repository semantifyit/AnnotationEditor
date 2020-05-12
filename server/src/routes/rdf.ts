import express from 'express';

import WebApis, { WebApiLeanDoc as WebApi } from '../models/WebApi';

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
  const webAPI: WebApi = await WebApis.findOne({ 'action.id': req.params.id }).lean();
  if (!webAPI) {
    res.status(404).json({ err: `Action ${req.params.id} not found` });
    return;
  }
  const action = webAPI.actions.find(({ id }) => id === req.params.id);
  if (!action) {
    res.status(404).json({ err: `Action ${req.params.actionPath} not found` });
    return;
  }
  res.json(action.annotationSrc);
});

export default router;
