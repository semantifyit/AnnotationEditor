import { allButFist, clone, isOneLevelStringJSON } from './utils';
import isURL from 'validator/lib/isURL';
import WebApis, { Action, WebApi } from '../models/WebApi';
import { lifting, lowering } from '../mapping';
import got from 'got';
import { validateAction } from './verification/verification';

export const doFn = (fn: any, input: string, prefixes: any, config: any) => async (mapping: {
  value: string;
  type: string;
}): Promise<{ value: string; success: boolean }> => {
  let typeForFn = mapping.type;
  if (typeForFn === 'yarrrml') {
    typeForFn = 'rml';
  }
  const functions = config[typeForFn].functions;

  try {
    const out = await fn(input, mapping.value, {
      type: mapping.type,
      functions,
      prefixes,
      xpathLib: config.rml.xpathLib,
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
  config: WebApi['config'],
  templates: WebApi['templates'],
  potAction: Action['annotationSrc'],
): Promise<void | string> => {
  if (config.enableVerification) {
    const verificationReport = await validateAction(action, potAction, templates, 'input');
    if (verificationReport.length > 0) {
      throw new Error(`Verification of active Action failed`);
    }
  }

  const doLowering = doFn(lowering, action, prefixes, config);

  const urlOut = await doLowering(requestMapping.url);
  if (!urlOut.success) {
    throw new Error(urlOut.value);
  }
  const urlValid = validateUrl(urlOut.value);
  if (urlValid) {
    throw new Error(urlValid);
  }

  const headersOut = await doLowering(requestMapping.headers);
  if (!headersOut.success) {
    throw new Error(headersOut.value);
  }
  const headersInvalid = validateHeaders(headersOut.value);
  if (headersInvalid) {
    throw new Error(headersInvalid);
  }

  const bodyOut = await doLowering(requestMapping.body);
  if (!bodyOut.success) {
    throw new Error(bodyOut.value);
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

  const doLifting = doFn(lifting, resp.body, prefixes, config);

  const liftOut = await doLifting(responseMapping.body);
  if (!liftOut.success) {
    throw new Error(liftOut.value);
  }

  if (config.enableVerification) {
    const verificationReport = await validateAction(liftOut.value, potAction, templates, 'output');
    if (verificationReport.length > 0) {
      throw new Error(`Verification of completed/failed Action failed`);
    }
  }

  return liftOut.value;
};

export const getActionById = async (id: string, unsavedActions?: Action[]): Promise<Action> => {
  if (unsavedActions) {
    const unsavedAction = unsavedActions.find((a) => a.id === id);
    if (unsavedAction) {
      return unsavedAction;
    }
  }
  const webAPI: WebApi = await WebApis.findOne({ 'actions.id': id }).lean();

  if (!webAPI) {
    throw new Error(`Action ${id} not found`);
  }

  const action = webAPI.actions.find((a) => a.id === id);
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
