import { isOneLevelStringJSON } from './utils';
import isURL from 'validator/lib/isURL';
import WebApis, { Action, WebApi } from '../models/WebApi';
import { lifting, lowering } from '../mapping';
import got from 'got';

export const doFn = (fn: any, input: string, prefixes: any) => async (mapping: {
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

export const validateUrl = (url: string): string | undefined =>
  isURL(url) ? undefined : 'Url is not valid!';
export const validateHeaders = (headers: string): string | undefined =>
  isOneLevelStringJSON(headers)
    ? undefined
    : 'Headers could not be parsed, please provide an object of strings!';

export const consumeFullAction = async (
  action: string,
  requestMapping: Pick<Action['requestMapping'], 'method' | 'url' | 'headers' | 'body'>,
  responseMapping: Pick<Action['responseMapping'], 'body'>,
  prefixes: WebApi['prefixes'],
  failFn: (s: string) => void,
): Promise<void | string> => {
  try {
    const doLowering = doFn(lowering, action, prefixes);

    const urlOut = await doLowering(requestMapping.url);
    if (!urlOut.success) {
      fail(urlOut.value);
      return;
    }
    const urlValid = validateUrl(urlOut.value);
    if (urlValid) {
      fail(urlValid);
      return;
    }

    const headersOut = await doLowering(requestMapping.headers);
    if (!headersOut.success) {
      fail(headersOut.value);
      return;
    }
    const headersInvalid = validateHeaders(headersOut.value);
    if (headersInvalid) {
      fail(headersInvalid);
      return;
    }

    const bodyOut = await doLowering(requestMapping.body);
    if (!bodyOut.success) {
      fail(bodyOut.value);
      return;
    }

    const url = urlOut.value;
    const headers = JSON.parse(headersOut.value);
    const body = bodyOut.value;

    let bdy = body;
    if (!['POST', 'PUT', 'PATCH'].includes(requestMapping.method)) {
      bdy = undefined;
    }

    const resp = await got({
      method: requestMapping.method as any,
      url,
      headers,
      body: bdy,
    });

    const doLifting = doFn(lifting, resp.body, prefixes);

    const liftOut = await doLifting(responseMapping.body);
    if (!liftOut.success) {
      fail(liftOut.value);
      return;
    }

    return liftOut.value;
  } catch (e) {
    fail(e.toString());
  }
};

export const getActionById = async (id: string): Promise<Action> => {
  const webAPI: WebApi = await WebApis.findOne({ 'action.id': id }).lean();

  const action = webAPI.actions.find(({ id }) => id === id);
  if (!action) {
    throw new Error(`Action ${id} not found`);
  }

  return action;
};

export const getActionLinkById = async (id: string): Promise<{ action: Action; webApi: WebApi }> => {
  const webApi: WebApi = await WebApis.findOne({ 'action.': id }).lean();

  const action = webApi.actions.find(({ id }) => id === id);
  if (!action) {
    throw new Error(`Action ${id} not found`);
  }

  return { action, webApi };
};
