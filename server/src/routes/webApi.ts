import express from 'express';

import WebApi, { WebApiLeanDoc, WebApiLeanDoc as IWebApi } from '../models/WebApi';
import GraphDB from '../util/graphdb';
import { enrichWebApi, webApiToGN, webApiToRdf } from '../util/webApi';
import { withTryCatch } from '../util/utils';
import config from '../config';

const router = express.Router();

const withGraphdb = config.graphdb.enabled;

router.get('/actions', (req, res) => {
  withTryCatch(res, async () => {
    const webApis: IWebApi[] = await WebApi.find(
      {},
      { 'actions.id': 1, 'actions.name': 1, id: 1, name: 1, _id: 0 },
    ).lean();
    res.json(webApis);
  });
});

router.get('/actions/:ids', (req, res) => {
  const ids = req.params.ids.split(',');
  withTryCatch(res, async () => {
    const webApis: IWebApi[] = await WebApi.find(
      { 'actions.id': { $in: ids } },
      {
        'actions.id': 1,
        'actions.name': 1,
        'actions.annotationSrc': 1,
        id: 1,
        name: 1,
        templates: 1,
        prefixes: 1,
        _id: 0,
      },
    ).lean();
    res.json(
      webApis.map((webApi) => ({
        ...webApi,
        actions: webApi.actions.filter((act) => ids.includes(act.id)),
      })),
    );
  });
});

router.get('/', async (req, res) => {
  const result = await WebApi.find({}).lean();
  res.json(result.map((webAPI: any) => enrichWebApi(webAPI)));
});

router.get('/:id', async (req, res) => {
  try {
    const result = await WebApi.findById(req.params.id).lean();
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

router.get('/:id/export', async (req, res) => {
  try {
    const result: WebApiLeanDoc = await WebApi.findById(req.params.id).lean();
    if (!result) {
      res.status(404).json({ err: `WebApi with id ${req.params.id} not found` });
      return;
    }
    res.setHeader('Content-disposition', `attachment; filename=webapiExport.json`);
    delete result['_id'];
    delete result['__v'];
    result.vocabs = [];
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

    if (withGraphdb) {
      const rdf = webApiToRdf(result);
      await GraphDB.post(webApiToGN(result), rdf);
    }

    res.json(enrichWebApi(result.toObject()));
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

    const newResult: WebApiLeanDoc = await WebApi.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).lean();

    if (withGraphdb) {
      const oldGN = webApiToGN(oldResult);
      const newGN = webApiToGN(newResult);
      const rdf = webApiToRdf(newResult);

      await GraphDB.upsert(newGN === oldGN ? newGN : { old: oldGN, new: newGN }, rdf);
    }

    res.json(newResult);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result: WebApiLeanDoc = await WebApi.findByIdAndDelete(req.params.id).lean();

    if (!result) {
      res.status(404).json({ err: `WebApi with id ${req.params.id} not found` });
      return;
    }

    if (withGraphdb) {
      await GraphDB.delete(webApiToGN(result));
    }

    res.json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ err: e.toString() });
  }
});

export default router;
