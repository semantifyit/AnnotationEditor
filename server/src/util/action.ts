import { isOneLevelStringJSON } from './utils';
import isURL from 'validator/lib/isURL';
import WebApis, { Action, PotentialActionLink, WebApi } from '../models/WebApi';
import { lifting, lowering } from '../mapping';
import got from 'got';
import {
  SPPEvaluator,
  fromJsonLD,
  evalPath,
  Literal,
  NamedNode,
  takeAll,
  toTerm,
} from 'sparql-property-paths';

export const doFn = (fn: any, input: string, prefixes: any) => async (mapping: {
  value: string;
  type: string;
}): Promise<{ value: string; success: boolean }> => {
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
  potentialActionLinks: PotentialActionLink[],
): Promise<void | string> => {
  const doLowering = doFn(lowering, action, prefixes);

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

  const doLifting = doFn(lifting, resp.body, prefixes);

  const liftOut = await doLifting(responseMapping.body);
  if (!liftOut.success) {
    throw new Error(liftOut.value);
  }

  // add potential action links
  const out = await addPotentialActions(liftOut.value, potentialActionLinks, prefixes);

  return liftOut.value;
};

export const getActionById = async (id: string): Promise<Action> => {
  const webAPI: WebApi = await WebApis.findOne({ 'actions.id': id }).lean();

  if (!webAPI) {
    throw new Error(`Action ${id} not found`);
  }

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

const getNodeIdOfCompletedAction = (graph: any) => {
  const actionIds = [
    ...takeAll(
      evalPath(graph, [
        undefined,
        new NamedNode('http://schema.org/actionStatus'),
        new Literal('http://schema.org/CompletedActionStatus'),
      ]),
    ),
    ...takeAll(
      evalPath(graph, [
        undefined,
        new NamedNode('http://schema.org/actionStatus'),
        new Literal('http://schema.org/FailedActionStatus'),
      ]),
    ),
  ];

  if (actionIds.length !== 1 || !actionIds?.[0]?.[0]?.value) {
    throw new Error(
      'Action has no or more than 1 schema:actionStatus CompletedActionStatus/FailedActionStatus',
    );
  }

  const actionId = actionIds[0][0].value;
  return actionId;
};

const baseUrl = 'http://actions.semantify.it/rdf';

const pathToSPP = (path: string[]): string => path.map((p) => `<${p}>`).join('/');

export const addPotentialActions = async (
  rdf: string,
  potentialActionLinks: PotentialActionLink[],
  prefixes: Record<string, string>,
): Promise<string> => {
  const [spp, graph] = await SPPEvaluator(rdf, 'jsonld');

  const actionNodeId = getNodeIdOfCompletedAction(graph);
  console.log(actionNodeId);

  // console.log(await graph.serialize({ format: 'jsonld', prefixes, replaceNodes: true }));

  for (const link of potentialActionLinks) {
    const linkingAction = await getActionById(link.actionId);
    const likingActionNodeId = `${baseUrl}/action/${linkingAction.id}`;
    await fromJsonLD(linkingAction.annotation, graph);

    const pathToIterator = pathToSPP(link.iterator.path);

    let baseIds = [actionNodeId];
    if (pathToIterator !== '') {
      const idOfIterator = spp(actionNodeId, pathToIterator);
      baseIds = idOfIterator;
    }

    for (const baseId of baseIds) {
      // add potentialAction link
      graph.add([
        toTerm(baseId),
        new NamedNode('http://schema.org/potentialAction'),
        new NamedNode(likingActionNodeId),
      ]);

      for (const pMap of link.propertyMaps) {
        const fromSPP = pathToSPP(pMap.from.path);
        const inputs = spp(baseId, fromSPP.replace(new RegExp(`^${pathToIterator}/`), '')); // replace iterator path
        const toPath = pMap.to.path;
        // TODO add to topath
      }
    }

    // TODO add property maps
  }

  return graph.serialize({ format: 'jsonld', prefixes, replaceNodes: false });
};
