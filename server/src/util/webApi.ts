import { WebApiLeanDoc as WebApi, Annotation } from '../models/WebApi';
import config from '../config';
import GraphDB from './graphdb';
import { clone } from './utils';

export const preProcessWebAPI = (webApiObj: WebApi): void => {
  // webapi documentation url points to action list
  const actionListUrl = `${config.url}/api/action/${webApiObj.id}/actions`;
  if (Array.isArray(webApiObj.annotation.documentation)) {
    // eslint-disable-next-line no-param-reassign
    webApiObj.annotation.documentation = webApiObj.annotation.documentation.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc.url = actionListUrl;
      return doc;
    });
  } else if (typeof webApiObj.annotation.documentation === 'object') {
    // eslint-disable-next-line no-param-reassign
    webApiObj.annotation.documentation.url = actionListUrl;
  }

  const actionTargetUrl = `${config.url}/api/action/${webApiObj.id}/`;

  // eslint-disable-next-line no-param-reassign
  webApiObj.actions = webApiObj.actions.map((action) => {
    // eslint-disable-next-line no-param-reassign
    action.annotation.target.urlTemplate = actionTargetUrl + action.id;
    return action;
  });
};

export const webAPIToGN = (webApi: WebApi): string => GraphDB.getGraphName(webApi.id);

export const webAPIToAnn = (webApiObj: WebApi): [string, Annotation[]] => {
  const webApi = clone(webApiObj);
  preProcessWebAPI(webApi);
  const graphName = webAPIToGN(webApi);
  const graphAnnotation = ([webApi.annotation] as Annotation[]).concat(
    webApi.actions.map(({ annotation }) => annotation),
  );
  return [graphName, graphAnnotation];
};

export interface EnrichedWebApi extends Omit<WebApi, 'actions'> {
  actionStats: {
    count: number;
    short: {
      type: string | string[];
      name: string | string[];
    }[];
  };
}

export const enrichWebApi = (webApi: WebApi): EnrichedWebApi => {
  const enrichedWebAPI = {
    actionStats: {
      count: webApi.actions.length,
      short: webApi.actions.map(({ annotation }) => ({
        type: annotation['@type'],
        name: annotation.name,
      })),
    },
  };
  return { ...webApi, ...enrichedWebAPI };
};
