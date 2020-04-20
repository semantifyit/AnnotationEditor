import express from 'express';
import isURL from 'validator/lib/isURL';
import got from 'got';

import { lowering, lifting } from '../mapping';
import { isOneLevelStringJSON } from '../util/utils';

const router = express.Router();

const preparePrefixes = (pref: any) => {
  if (pref['@vocab']) {
    // eslint-disable-next-line no-param-reassign
    pref[''] = pref['@vocab'];
    // eslint-disable-next-line no-param-reassign
    delete pref['@vocab'];
  }
  return pref;
};

const doFn = (fn: any, input: string, prefixes: any) => async (mapping: {
  value: string;
  type: string;
}): Promise<{ value: string; success: boolean; valid?: string }> => {
  try {
    const out = await fn(input, mapping.value, {
      type: mapping.type,
      prefixes,
    });
    return { value: out, success: true };
  } catch (e) {
    // console.log('Error');
    // console.log(e);
    return { value: e.toString(), success: false };
  }
};

const validateUrl = (url: string): string | undefined => (isURL(url) ? undefined : 'Url is not valid!');
const validateHeaders = (headers: string): string | undefined =>
  isOneLevelStringJSON(headers)
    ? undefined
    : 'Headers could not be parsed, please provide an object of strings!';

router.post('/lowering', async (req, res) => {
  const { prefixes, action } = req.body;
  const pref = preparePrefixes(prefixes);

  const doLowering = doFn(lowering, action, pref);

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
  const pref = preparePrefixes(prefixes);

  const doLifting = doFn(lifting, input, pref);

  const resp = {
    body: await doLifting(req.body.body),
  };

  res.json(resp);
});

router.post('/full', async (req, res) => {
  const { prefixes, action, method } = req.body;
  const pref = preparePrefixes(prefixes);

  const doLowering = doFn(lowering, action, pref);

  const urlOut = await doLowering(req.body.url);
  if (!urlOut.success) {
    res.json({ success: false, value: urlOut.value });
    return;
  }
  const urlValid = validateUrl(urlOut.value);
  if (urlValid) {
    res.json({ success: false, value: urlValid });
    return;
  }

  const headersOut = await doLowering(req.body.headers);
  if (!headersOut.success) {
    res.json({ success: false, value: headersOut.value });
    return;
  }
  const headersValid = validateHeaders(headersOut.value);
  if (headersValid) {
    res.json({ success: false, value: headersValid });
    return;
  }

  const bodyOut = await doLowering(req.body.body);
  if (!bodyOut.success) {
    res.json({ success: false, value: bodyOut.value });
    return;
  }

  const url = urlOut.value;
  const headers = JSON.parse(headersOut.value);
  const body = bodyOut.value;

  try {
    let bdy = body;
    if (method !== 'POST' || method !== 'PATH' || method !== 'PUT') {
      bdy = undefined;
    }

    const resp = await got({
      method,
      url,
      headers,
      body: bdy,
    });

    const doLifting = doFn(lifting, resp.body, pref);

    const liftOut = await doLifting(req.body.response);
    if (!liftOut.success) {
      res.json({ success: false, value: liftOut.value });
      return;
    }

    res.json({ success: true, value: liftOut.value });
  } catch (e) {
    res.json({ success: false, value: e.toString() });
  }
});

export default router;
