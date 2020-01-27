import express from 'express';

import WebApi, { WebApiLeanDoc as IWebApi } from '../models/WebApi';
import GraphDB from '../util/graphdb';
import { webAPIToAnn, webAPIToGN, enrichWebApi } from '../util/webApi';

const router = express.Router();

router.get('/', async (req, res) => {
  const result = (await WebApi.find({}).lean()) as IWebApi[];
  res.json(result.map((webAPI) => enrichWebApi(webAPI)));
});

router.get('/:id', async (req, res) => {
  try {
    const result = (await WebApi.findById(req.params.id).lean()) as IWebApi;
    if (!result) {
      res.status(404).json({ err: `WebApi with id ${req.params.id} not found` });
      return;
    }
    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await WebApi.create(req.body);

    if (!result) {
      res.status(404).json({ err: 'error creating document' });
      return;
    }

    /*
    await GraphDB.post(...webAPIToAnn(result));
    */

    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const oldResult = await WebApi.findById(req.params.id);

    if (!oldResult) {
      res.status(404).json({ err: `WebApi with id ${req.params.id} not found` });
      return;
    }

    const newResult = await WebApi.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).lean();

    /*
    const oldGN = webAPIToGN(oldResult);
    const [newGN, webAPI] = webAPIToAnn(newResult);

    await GraphDB.upsert(
      newGN === oldGN ? newGN : { old: oldGN, new: newGN },
      webAPI,
    );
    */

    res.json(newResult);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await WebApi.findByIdAndDelete(req.params.id).lean();

    if (!result) {
      res.status(404).json({ err: `WebApi with id ${req.params.id} not found` });
      return;
    }

    await GraphDB.delete(webAPIToGN(result));

    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

export default router;
