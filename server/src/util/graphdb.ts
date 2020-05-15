import got from 'got';

import config from '../config';
import { withTries, clone, toArray } from './utils';

type Annotation = any;

const graphDbBaseUrl = `${config.graphdb.url}/repositories/${config.graphdb.repo}/statements`;

const cleanContext = (jsonLd: Annotation | Annotation[]): Annotation[] =>
  toArray(clone(jsonLd)).map((ann) => {
    if (ann['@context'] && typeof ann['@context'] === 'string') {
      // eslint-disable-next-line no-param-reassign
      ann['@context'] = { '@vocab': ann['@context'] };
    }
    return ann;
  });

const postData = async (graphName: string, jsonLd: Annotation | Annotation[]): Promise<void> => {
  const encodedGraphName = encodeURIComponent(`<${graphName}>`);
  const url = `${graphDbBaseUrl}?baseUri=${encodedGraphName}&context=${encodedGraphName}`;

  await got.post(url, {
    body: JSON.stringify(cleanContext(jsonLd)),
    headers: { 'Content-Type': 'application/ld+json' },
  });
};

const deleteGraph = async (graphName: string): Promise<void> => {
  const body = `update=${encodeURIComponent(`DROP GRAPH <${graphName}>;`)}`;
  const url = graphDbBaseUrl;

  await got.post(url, {
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

const update = async (
  graphName: string | { old: string; new: string },
  jsonLd: Annotation | Annotation[],
): Promise<void> => {
  await deleteGraph(typeof graphName === 'string' ? graphName : graphName.old);
  return postData(typeof graphName === 'string' ? graphName : graphName.new, jsonLd);
};

const graphDB = {
  post: withTries(postData, 10, 10000),
  upsert: withTries(update, 10, 10000),
  delete: withTries(deleteGraph, 10, 10000),
  getGraphName: (webApiPath: string): string => `${config.url}/graphs/${webApiPath}`,
};

export default graphDB;

// post(
//   { '@context': { '@vocab': 'http://schema.org/' }, name: 'Test' },
//   'http://test.com/test',
// );

// pushRdf(
//   { '@context': { '@vocab': 'http://schema.org/' }, name: 'Test' },
//   'http://test.com/test',
// );

// deleteGraph('http://test.com/test');
