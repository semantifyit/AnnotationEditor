import { ActionLink } from '../models/WebApi';

// copied from client TODO better way to handle shared code

const baseUrl = 'http://actions.semantify.it/api/rdf';

export type Namespace = 'xsd' | 'rdf' | 'rdfs' | 'owl' | 'schema' | 'sh' | 'wasa';

export const commonNamespaces = {
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  schema: 'http://schema.org/',
  sh: 'http://www.w3.org/ns/shacl#',
  wasa: 'https://vocab.sti2.at/wasa/',
};

type PropertyObj<T extends string> = { [P in T]: string };

const toProperties = <T extends string>(prefix: string, properties: T[]): PropertyObj<T> =>
  Object.fromEntries(properties.map((p) => [p, prefix + p])) as any;

export const wasa = toProperties(commonNamespaces.wasa, [
  'source',
  'target',
  'propertyMapping',
  'from',
  'to',
  'iterator',
  'potentialActionLink',
  'precedingActionLink',
  'actionShape',
  'Input',
  'Output',
  'PotentialActionLink',
  'PrecedingActionLink',
  'PropertyMap',
]);

const idNode = (s: string) => ({ '@id': s });

const pathToSPP = (path: string[]): string => path.map((p) => `<${p}>`).join('/');

export const potentialActionLinkId = (link: ActionLink) => `${baseUrl}/actionlink/${link.id}`;

export const potentialActionLinkToAnn = (
  link: ActionLink,
  actionId: string,
  opt: { withSource: boolean },
) => {
  const iterator = link.iterator && link.iterator.path.length > 0 ? pathToSPP(link.iterator.path) : undefined;

  const ann = {
    '@id': potentialActionLinkId(link),
    '@type': wasa.PotentialActionLink,
    [wasa.target]: idNode(`${baseUrl}/action/${link.actionId}`),
    [wasa.propertyMapping]: propertyMappingToAnn(link.propertyMaps, iterator),
    [wasa.iterator]: iterator,
  };

  if (!opt.withSource === false) {
    ann[wasa.source] = idNode(`${baseUrl}/action/${actionId}`);
  }

  return ann;
};

export const precedingActionLinkToAnn = (link: ActionLink, actionId: string) => ({
  '@id': `${baseUrl}/actionlink/${link.id}`,
  '@type': wasa.PrecedingActionLink,
  [wasa.source]: idNode(`${baseUrl}/action/${link.actionId}`),
  [wasa.target]: idNode(`${baseUrl}/action/${actionId}`),
  [wasa.propertyMapping]: propertyMappingToAnn(link.propertyMaps),
});

const propertyMappingToAnn = (pmaps: ActionLink['propertyMaps'], iteratorPath?: string) =>
  pmaps.map((pmap) => ({
    '@id': `${baseUrl}/pmap/${pmap.id}`,
    '@type': wasa.PropertyMap,
    [wasa.from]: pathToSPP(pmap.from.path).replace(new RegExp(`^${iteratorPath}/`), ''),
    [wasa.to]: pathToSPP(pmap.to.path),
  }));
