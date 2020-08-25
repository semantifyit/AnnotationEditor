import { WebApiLeanDoc as WebApi } from '../models/WebApi';
import config from '../config';

export interface EnrichedWebApi extends Omit<WebApi, 'actions'> {
  actionStats: {
    count: number;
    short: {
      type: string[];
      name: string[];
    }[];
  };
}

export const enrichWebApi = (webApi: WebApi): EnrichedWebApi => {
  const enrichedWebAPI = {
    actionStats: {
      count: webApi.actions.length,
      short: webApi.actions.map(({ annotationSrc }) => ({
        type: annotationSrc.types,
        name: annotationSrc.props
          .filter((p) => p.path === 'http://schema.org/name' && typeof p.val === 'string')
          .map((p) => p.val as string),
      })),
    },
  };
  return { ...webApi, ...enrichedWebAPI };
};

export const webApiToGN = (webApi: WebApi): string => `${config.baseUrl}/graphs/${webApi.id}`;

export const webApiToRdf = (webApi: WebApi) => [
  JSON.parse(webApi.annotation),
  ...webApi.actions.map((a) => JSON.parse(a.annotation)),
];
