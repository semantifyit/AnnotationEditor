import { set, has, get } from 'lodash';

import { INode, INodeValue } from './Vocab';
import { jsonldMatchesQuery } from './rdfSparql';
import { clone, hasP, makeArray, notEmpty, uniqueArray } from './util';
import * as p from './properties';

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

export const extractIds = (o: any) =>
  makeArray(o)
    .filter((n) => n && n['@id'])
    .map((n: INode) => n['@id']);

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
  restrictionIds?: string[];
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
    nodeDatatype[0]['@id'].startsWith(p.commonNamespaces.xsd)
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
  const pRanges: IRestrictionRange[] = [];
  const nodeClass = shProp[p.shClass] as INodeValue[];
  if (nodeClass) {
    const pRangeIds = extractIds(nodeClass);
    pRangeIds.forEach((pRangeId) => {
      const pRange: IRestrictionRange = {
        nodeId: pRangeId,
        restrictionIds:
          extractIds(shProp[p.shNode]) ||
          (shProp['sh:property'] && shProp['@id']) ||
          undefined,
      };
      pRanges.push(pRange);
    });
  }

  const nodeOrs = shProp[p.shOr] as INodeValue[];
  if (nodeOrs.length > 0) {
    nodeOrs
      .filter((n) => n['@list'])
      .forEach((nodeOr) => {
        pRanges.push(
          ...(nodeOr['@list'] as INode[]) // ... to not push array inside array, but keep 1d array
            .map((n) => ({
              nodeId: extractIds(n[p.shClass])[0],
              restrictionIds: extractIds(n[p.shNode]),
            }))
            .filter((n) => n),
        );
      });
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
    property: path && path[0] && path[0]['@id'],
    propertyRanges: pRanges.length > 0 ? pRanges : undefined,
    defaultValue: defaultValue && defaultValue[0] && defaultValue[0]['@id'],
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
