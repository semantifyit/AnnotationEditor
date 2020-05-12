import express from 'express';
import got from 'got';

import { lowering, lifting } from '../mapping';
import { consumeFullAction, doFn, validateHeaders, validateUrl } from '../util/action';

const router = express.Router();

router.post('/lowering', async (req, res) => {
  const { prefixes, action } = req.body;

  const doLowering = doFn(lowering, action, prefixes);

  const resp = {
    url: await doLowering(req.body.url),
    headers: await doLowering(req.body.headers),
    body: await doLowering(req.body.body),
  };

  resp.url.valid = validateUrl(resp.url.value);
  resp.headers.valid = validateHeaders(resp.headers.value);

  res.json(resp);
});

router.post('/request', async (req, res) => {
  const { method, url, headers, body: reqBody } = req.body;
  let body = reqBody;
  if (method !== 'POST' || method !== 'PATH' || method !== 'PUT') {
    body = undefined;
  }

  try {
    const resp = await got({
      method,
      url,
      body,
      headers: JSON.parse(headers),
    });
    res.json({ statusCode: resp.statusCode, headers: JSON.stringify(resp.headers), body: resp.body });
  } catch (e) {
    res.json({ error: e.toString() });
  }
});

router.post('/lifting', async (req, res) => {
  const { prefixes, input } = req.body;

  const doLifting = doFn(lifting, input, prefixes);

  const resp = {
    body: await doLifting(req.body.body),
  };

  res.json(resp);
});

router.post('/full', async (req, res) => {
  const { prefixes, action, method } = req.body;

  const response = await consumeFullAction(
    action,
    { method, url: req.body.url, headers: req.body.headers, body: req.body.body },
    { body: req.body.response },
    prefixes,
    (e) => {
      res.json({ success: false, value: e });
    },
  );

  res.json({ success: true, value: response });
});

export default router;
