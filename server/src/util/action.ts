import { allButFist, clone, isOneLevelStringJSON } from './utils';
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
import { isEmptyIterable } from 'sparql-property-paths/dist/utils';
import { potentialActionLinkId, potentialActionLinkToAnn, wasa } from './toAnnotation';
import { BlankNode } from 'sparql-property-paths/dist/term';

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
  potentialActionLinks: PotentialActionLink[],
  unsavedActions?: Action[],
): Promise<void | string> => {
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

  // add potential action links
  const out = await addPotentialActions(liftOut.value, potentialActionLinks, prefixes, unsavedActions);

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

const baseUrl = 'http://actions.semantify.it/api/rdf';

const pathToSPP = (path: string[]): string => path.map((p) => `<${p}>`).join('/');

const WITH_CONSUME_SPP = false;
const WITH_ADD_ACTION_LINKS = true;

export const addPotentialActions = async (
  rdf: string,
  potentialActionLinks: PotentialActionLink[],
  prefixes: Record<string, string>,
  unsavedActions?: Action[],
): Promise<string> => {
  const [spp, graph] = await SPPEvaluator(rdf, 'jsonld');

  const actionNodeId = getNodeIdOfCompletedAction(graph);

  // console.log(await graph.serialize({ format: 'jsonld', prefixes, replaceNodes: true }));
  if (WITH_CONSUME_SPP) {
    for (const link of potentialActionLinks) {
      const linkingAction = await getActionById(link.actionId, unsavedActions);
      // console.log(linkingAction.id);
      // console.log(link.actionId);
      // console.log(linkingAction.annotation);

      const pathToIterator = pathToSPP(link.iterator.path);

      let baseIds = [actionNodeId];
      if (pathToIterator !== '') {
        const idOfIterator = spp(actionNodeId, pathToIterator);
        baseIds = idOfIterator;
      }

      for (const baseId of baseIds) {
        const linkingAnnotation: any = JSON.parse(linkingAction.annotation);
        linkingAnnotation['@id'] += `/${baseId}`;
        const likingActionNodeId = linkingAnnotation['@id'];
        await fromJsonLD(JSON.stringify(linkingAnnotation), graph);

        // add potentialAction link
        graph.add([
          toTerm(baseId),
          new NamedNode('http://schema.org/potentialAction'),
          new NamedNode(likingActionNodeId),
        ]);
        for (const pMap of link.propertyMaps) {
          const fromSPP = pathToSPP(pMap.from.path);
          let inputs: string[];
          if (fromSPP.startsWith(pathToIterator)) {
            inputs = spp(baseId, fromSPP.replace(new RegExp(`^${pathToIterator}/`), ''));
          } else {
            inputs = spp(actionNodeId, fromSPP);
          }

          const toPath = pMap.to.path;
          let toNodeId = likingActionNodeId;
          let remainingPath = clone(toPath);
          while (remainingPath.length > 1) {
            const matchingTriplesIterator = graph.triples([
              toTerm(toNodeId),
              toTerm(remainingPath[0]),
              undefined,
            ]);
            const matchingTriples = takeAll(matchingTriplesIterator);
            if (matchingTriples.length === 0) {
              const newBNodeId = graph.bNodeIssuer();
              graph.add([toTerm(toNodeId), toTerm(remainingPath[0]), toTerm(newBNodeId)]);
              toNodeId = newBNodeId;
            } else {
              toNodeId = matchingTriples[0][2].value;
            }
            remainingPath = allButFist(remainingPath);
          }

          for (const inputVal of inputs) {
            graph.add([toTerm(toNodeId), toTerm(remainingPath[0]), new Literal(inputVal)]); // TODO not literal
          }

          // console.log(inputs);
          // console.log(toPath);
        }
      }
    }
  } else if (WITH_ADD_ACTION_LINKS) {
    for (const link of potentialActionLinks) {
      const annotation = potentialActionLinkToAnn(link, actionNodeId, { withSource: false });
      await fromJsonLD(JSON.stringify(annotation), graph);
      graph.add([
        new NamedNode(potentialActionLinkId(link)),
        new NamedNode(wasa.source),
        new (actionNodeId.startsWith('_:') ? BlankNode : NamedNode)(actionNodeId),
      ]);
      graph.add([
        toTerm(actionNodeId),
        new NamedNode(wasa.potentialActionLink),
        new NamedNode(potentialActionLinkId(link)),
      ]);
    }
  }
  return graph.serialize({ format: 'jsonld', prefixes, replaceNodes: true });
};
