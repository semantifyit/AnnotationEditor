import { set, has, get } from 'lodash';

import { INode } from './Vocab';
import { jsonldMatchesQuery } from './rdfSparql';
import { clone, hasP, makeArray, notEmpty, uniqueArray } from './util';
import * as p from './properties';

export type Namespace = 'xsd' | 'rdf' | 'rdfs' | 'owl' | 'schema' | 'sh';

const commonNamespaces = {
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  schema: 'http://schema.org/',
  sh: 'http://www.w3.org/ns/shacl#',
};

export const joinNS = (namespace: Namespace, nodeId: string): string =>
  commonNamespaces[namespace] + nodeId;

export const makeIdArr = (...str: string[]) => str.map((s) => ({ '@id': s }));

export const removeNS = (str: string): string => {
  const lastOfUrl = str.split('/').pop();
  const lastOfURLHash = lastOfUrl ? lastOfUrl.split('#').pop() : '';
  const lastOfNS = lastOfURLHash ? lastOfURLHash.split(':').pop() : '';
  return lastOfNS || '';
};

export const getNameOfNode = (node: INode): string => {
  const label = node[p.rdfsLabel];
  if (label && label[0]['@value']) {
    return label[0]['@value'];
  }
  return removeNS(node['@id']);
};

export const getDescriptionOfNode = (node: INode): string => {
  const comment = node[p.rdfsComment];
  if (comment && comment[0] && comment[0]['@value']) {
    return stripHtml(comment[0]['@value']);
  }
  return '';
};

export const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const extractIds = (o: any) => makeArray(o).map((n: INode) => n['@id']);

export const isTextNode = (node: INode) => {
  const shClass = node[p.shClass];
  return shClass && shClass[0] && shClass[0]['@id'] === p.schemaText;
};

export const setProp = (object: any, property: string, value: string) => {
  const old = get(object, property);
  if (notEmpty(old)) {
    if (Array.isArray(old)) {
      old.push(value);
      set(object, property, old);
    } else if (typeof old === 'string' || typeof old === 'object') {
      set(object, property, [old, value]);
    }
  } else {
    set(object, property, value);
  }
};

export const joinPaths = (pathArr: string[]): string => pathArr.join('.');

export const isReplaceable = (obj: any): boolean => {
  const entries = Object.entries(obj);
  return (
    entries.length === 1 &&
    entries[0][0] === '@id' &&
    typeof entries[0][1] === 'string' &&
    entries[0][1].startsWith('_:')
  );
};

export interface IRestrictionRange {
  nodeId: string;
  restrictionId?: string;
}

export interface IRestriction {
  property: string;
  propertyRanges?: IRestrictionRange[];
  // propertyRangeIn: IRestrictionRange[];
  defaultValue?: string;
  valueIn?: string[];
  minCount?: number;
  maxCount?: number;
  pattern?: string;
  minInclusive?: number;
  maxInclusive?: number;
}

const xsdPropToSchemaClass = (prop: string) =>
  ({
    'xsd:string': 'schema:Text',
    'xsd:decimal': 'schema:Float',
    'xsd:integer': 'schema:Integer',
    'xsd:boolean': 'schema:Boolean',
    'xsd:date': 'schema:Date',
    'xsd:time': 'schema:Time',
  }[prop]);

const toIdNode = (str: string) => ({
  '@id': str,
});

const toIdNodeArr = (str: string) => [
  {
    '@id': str,
  },
];

export const cleanShaclProp = (shProp: INode): INode => {
  const shPropCpy = clone(shProp);
  const nodeDatatype = shPropCpy[p.shDatatype];
  if (
    nodeDatatype &&
    nodeDatatype[0] &&
    nodeDatatype[0]['@id'].startsWith(commonNamespaces.xsd)
  ) {
    shPropCpy[p.shClass] = toIdNodeArr(
      xsdPropToSchemaClass(nodeDatatype[0]['@id']),
    );
    delete shPropCpy[p.shDatatype];
  }
  const nodekind = shPropCpy[p.shNodeKind];
  if (
    nodekind &&
    nodekind['@id'] === p.shIRI &&
    (shPropCpy['@type'] && !shPropCpy['@type'].includes(p.shNodeShape))
  ) {
    shPropCpy['sh:class'] = toIdNodeArr(p.schemaURL);
    delete shPropCpy['sh:nodeKind'];
  }
  return shPropCpy;
};

export const makePropertyRestrictionObj = (shProp: INode): IRestriction => {
  const nodeClass = shProp[p.shClass];
  const pRangeId = nodeClass && nodeClass['@id'];
  const pRanges: IRestrictionRange[] = [];
  if (pRangeId) {
    const pRange: IRestrictionRange = {
      nodeId: pRangeId,
    };
    if (shProp[p.shNode]) {
      const nodeNode = shProp[p.shNode];
      pRange.restrictionId = nodeNode && nodeNode['@id'];
    } else if (shProp['sh:property']) {
      pRange.restrictionId = shProp['@id']; // add this node if it has properties and doesn't refer to a new node via sh:node
    }
    pRanges.push(pRange);
  }
  const nodeOr = shProp[p.shOr];
  if (nodeOr && nodeOr['@list']) {
    pRanges.push(
      ...nodeOr['@list'] // ... to not push array inside array, but keep 1d array
        .map((pr: any) => ({
          nodeId: pr[pr.shClass]['@id'],
          restrictionId: pr[pr.shNode] && p[p.shNode]['@id'],
        }))
        .filter((pr: any) => pr),
    );
  }
  const minCount = shProp[p.shMinCount];
  const maxCount = shProp[p.shMaxCount];
  const maxInclusive = shProp[p.shMaxInclusive];
  const minInclusive = shProp[p.shMinInclusive];
  const valueIn = shProp[p.shIn];
  const defaultValue = shProp[p.shDefaultValue];
  const path = shProp[p.shPath];
  const pattern = shProp[p.shPattern];
  return {
    property: path && path['@id'],
    propertyRanges: pRanges.length > 0 ? pRanges : undefined,
    defaultValue: defaultValue && defaultValue['@id'],
    valueIn: valueIn && valueIn['@list'],
    minCount:
      minCount && minCount[0]['@value'] && parseInt(minCount[0]['@value'], 10),
    maxCount:
      maxCount && maxCount[0]['@value'] && parseInt(maxCount[0]['@value'], 10),
    minInclusive:
      minInclusive &&
      minInclusive[0]['@value'] &&
      parseInt(minInclusive[0]['@value'], 10),
    maxInclusive:
      maxInclusive &&
      maxInclusive[0]['@value'] &&
      parseInt(maxInclusive[0]['@value'], 10),
    pattern: pattern && pattern[0]['@value'],
  };
};

const removeDashIO = (str: string): string => str.split('-')[0];

export const isEqProp = (a: string, b: string): boolean =>
  removeDashIO(a) === removeDashIO(b);

export const generateJSONLD = (docEle: HTMLElement): any => {
  const jsonld = {
    '@context': {
      '@vocab': 'http://schema.org/',
      webapi: 'http://actions.semantify.it/vocab/',
    },
  };
  const terminals = docEle.querySelectorAll('[data-path]');
  terminals.forEach((t: HTMLElement) => {
    const { path, value } = t.dataset;
    if (path && value) {
      const schemaNSPath = path.replace(/schema:/g, '');
      const schemaNSValue = value.replace(/^schema:/g, '');
      set(jsonld, schemaNSPath, schemaNSValue);
    }
  });
  return jsonld;
};
