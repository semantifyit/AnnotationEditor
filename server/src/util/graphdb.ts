import got from 'got';

import config from '../config';
import { withTries, clone, toArray } from './utils';

const graphDbBaseUrl = `${config.graphdb.url}/repositories/${config.graphdb.repo}/statements`;

const toBase64 = (str: string) => Buffer.from(str).toString('base64');

if (config.graphdb.enabled) {
  console.log(`Graphdb enabled with url: ${config.graphdb.url}`);
}

let client = got.extend();
if (config.graphdb.username && config.graphdb.password) {
  console.log(`Graphdb authorization: user <${config.graphdb.username}> pw <${config.graphdb.password}>`);
  const auth = `Basic ${toBase64(`${config.graphdb.username}:${config.graphdb.password}`)}`;
  client = got.extend({
    headers: {
      Authorization: auth,
    },
  });
}

const postData = async (graphName: string, jsonLd: any): Promise<void> => {
  const encodedGraphName = encodeURIComponent(`<${graphName}>`);
  const url = `${graphDbBaseUrl}?baseUri=${encodedGraphName}&context=${encodedGraphName}`;

  await client.post(url, {
    body: JSON.stringify(jsonLd),
    headers: { 'Content-Type': 'application/ld+json' },
  });
};

const deleteGraph = async (graphName: string): Promise<void> => {
  const body = `update=${encodeURIComponent(`DROP GRAPH <${graphName}>;`)}`;
  const url = graphDbBaseUrl;

  await client.post(url, {
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

const update = async (graphName: string | { old: string; new: string }, jsonLd: any): Promise<void> => {
  await deleteGraph(typeof graphName === 'string' ? graphName : graphName.old);
  return postData(typeof graphName === 'string' ? graphName : graphName.new, jsonLd);
};

const graphDB = {
  post: withTries(postData, 3, 1000),
  upsert: withTries(update, 3, 1000),
  delete: withTries(deleteGraph, 3, 1000),
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
