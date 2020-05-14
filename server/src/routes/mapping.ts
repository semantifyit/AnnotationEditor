import express from 'express';
import got from 'got';

import { lowering, lifting } from '../mapping';
import { addPotentialActions, consumeFullAction, doFn, validateHeaders, validateUrl } from '../util/action';

const router = express.Router();

router.post('/lowering', async (req, res) => {
  const { prefixes, action } = req.body;

  const doLowering = doFn(lowering, action, prefixes);

  const resp: any = {
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
  try {
    const { prefixes, input, links } = req.body;

    const doLifting = doFn(lifting, input, prefixes);

    const liftOut = await doLifting(req.body.body);

    if (liftOut.success) {
      const rdf = await addPotentialActions(liftOut.value, links, prefixes);

      res.json({
        body: { value: rdf, success: true },
      });
    } else {
      res.json({
        body: liftOut,
      });
    }
  } catch (e) {
    console.log(e.stack);
    res.json({
      body: { value: e.toString(), success: false },
    });
  }
});

router.post('/full', async (req, res) => {
  const { prefixes, action, method, links, url, headers, body, response } = req.body;

  try {
    const responseAction = await consumeFullAction(
      action,
      { method, url: url, headers: headers, body: body },
      { body: response },
      prefixes,
      links,
    );
    res.json({ success: true, value: responseAction });
  } catch (e) {
    res.json({ success: false, value: e.toString() });
  }
});

export default router;
