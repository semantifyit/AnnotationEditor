import { set, has, get } from 'lodash';

import { INode } from './Vocab';
import { jsonldMatchesQuery } from './rdfSparql';
import { clone, hasP, makeArray, notEmpty, uniqueArray } from './util';

export const removeNS = (str: string): string => {
  const lastOfUrl = str.split('/').pop();
  const lastOfNS = lastOfUrl ? lastOfUrl.split(':').pop() : '';
  return lastOfNS || '';
};

export const getNameOfNode = (node: INode) => {
  if (node['rdfs:label'] && typeof node['rdfs:label'] === 'string') {
    return node['rdfs:label'];
  }
  if (node['rdfs:label'] && node['rdfs:label']['@value']) {
    return node['rdfs:label']['@value'];
  }
  return removeNS(node['@id']);
};

export const getDescriptionOfNode = (node: INode) =>
  stripHtml(node['rdfs:comment'] ? node['rdfs:comment'] : '');

export const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const getProperties = (node: INode) =>
  Array.isArray(node['sh:property'])
    ? node['sh:property']
    : [node['sh:property']];

export const extractIds = (o: any) => makeArray(o).map((n: INode) => n['@id']);

export const isTextNode = (node: INode) =>
  !hasP.call(node, 'sh:class') || node['sh:class']['@id'] === 'schema:Text';

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

interface IIdNode {
  '@id': string;
}

export interface IShaclProp {
  'sh:path': IIdNode;
  'sh:datatype'?: IIdNode;
  'sh:class'?: IIdNode;
  'sh:pattern'?: string;
  'sh:minCount'?: number;
  'sh:minInclusive'?: number;
  'sh:maxInclusive'?: number;
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

export const cleanShaclProp = (shProp: IShaclProp): IShaclProp => {
  const shPropCpy = clone(shProp);
  // schema:path & sh:minValue - Umut's error in shapes I think?
  if (shPropCpy['schema:path']) {
    shPropCpy['sh:path'] = shProp['schema:path'];
    delete shPropCpy['schema:path'];
  }
  if (shPropCpy['sh:minValue']) {
    shPropCpy['sh:minCount'] = shProp['sh:minValue'];
    delete shPropCpy['sh:minValue'];
  }

  if (
    shPropCpy['sh:datatype'] &&
    shPropCpy['sh:datatype']['@id'].startsWith('xsd:')
  ) {
    shPropCpy['sh:class'] = toIdNode(
      xsdPropToSchemaClass(shPropCpy['sh:datatype']['@id']),
    );
    delete shPropCpy['sh:datatype'];
  }
  if (
    shPropCpy['sh:nodeKind'] &&
    shPropCpy['sh:nodeKind']['@id'] === 'sh:IRI' &&
    shPropCpy['@type'] !== 'sh:NodeShape'
  ) {
    shPropCpy['sh:class'] = toIdNode('schema:URL');
    delete shPropCpy['sh:nodeKind'];
  }
  return shPropCpy;
};

export const makePropertyRestrictionObj = (
  shProp: IShaclProp,
): IRestriction => {
  const pRangeId = shProp['sh:class'] && shProp['sh:class']['@id'];
  const pRanges: IRestrictionRange[] = [];
  if (pRangeId) {
    const pRange: IRestrictionRange = {
      nodeId: pRangeId,
    };
    if (shProp['sh:node']) {
      pRange.restrictionId = shProp['sh:node'] && shProp['sh:node']['@id'];
    } else if (shProp['sh:property']) {
      pRange.restrictionId = shProp['@id']; // add this node if it has properties and doesn't refer to a new node via sh:node
    }
    pRanges.push(pRange);
  }
  if (shProp['sh:or'] && shProp['sh:or']['@list']) {
    pRanges.push(
      ...shProp['sh:or']['@list'] // ... to not push array inside array, but keep 1d array
        .map((p: any) => ({
          nodeId: p['sh:class']['@id'],
          restrictionId: p['sh:node'] && p['sh:node']['@id'],
        }))
        .filter((p: any) => p),
    );
  }
  return {
    property: shProp['sh:path'] && shProp['sh:path']['@id'],
    propertyRanges: pRanges.length > 0 ? pRanges : undefined,
    defaultValue: shProp['sh:defaultValue'] && shProp['sh:defaultValue']['@id'],
    valueIn: shProp['sh:in'] && shProp['sh:in']['@list'],
    minCount: shProp['sh:minCount'],
    maxCount: shProp['sh:maxCount'],
    minInclusive: shProp['sh:minInclusive'],
    maxInclusive: shProp['sh:maxInclusive'],
    pattern: shProp['sh:pattern'],
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
