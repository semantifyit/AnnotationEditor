import { set, has, get } from 'lodash';

import { getAllNodes, getRestrictionNodes, INode } from './vocabs';
import { jsonldMathesQuery } from './rdfSparql';

const hasP = Object.prototype.hasOwnProperty;

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

export const getAnyNode = (id: string): INode | undefined =>
  getAllNodes().find((o: any) => o['@id'] === id);

export const getIONode = (
  nodeId: string,
  ioType: string,
): INode | undefined => {
  const node = getAnyNode(nodeId.split('-')[0]);
  if (!node) {
    return undefined;
  }
  const cpy = clone(node);
  cpy['@id'] = `${node['@id']}-${ioType}`;
  cpy['rdfs:label'] = `${node['rdfs:label']}-${ioType}`;
  cpy['schema:rangeIncludes'] = [
    {
      '@id': 'schema:Text',
    },
    {
      '@id': 'schema:PropertyValueSpecification',
    },
  ];
  return cpy;
};

export const getNode = (id: string): INode | undefined => {
  let node;
  if (id.endsWith('-input')) {
    node = getIONode(id, 'input');
  } else if (id.endsWith('-output')) {
    node = getIONode(id, 'output');
  } else {
    node = getAnyNode(id);
  }
  return node;
};

export const getProperties = (node: INode) =>
  Array.isArray(node['sh:property'])
    ? node['sh:property']
    : [node['sh:property']];

export const makeArray = (o: any) => (Array.isArray(o) ? o : [o]);

export const extractIds = (o: any) => makeArray(o).map((n: INode) => n['@id']);

export const isTextNode = (node: INode) =>
  !hasP.call(node, 'sh:class') || node['sh:class']['@id'] === 'schema:Text';

export const uniqueArray = <T>(arr: T[]): T[] => [...new Set(arr)];

export const getSuperClasses = (nodeId: string): string[] => {
  let types = [nodeId];
  const node = getNode(nodeId);
  if (!node) {
    return [];
  }
  if (node['rdfs:subClassOf']) {
    const superClasses = extractIds(node['rdfs:subClassOf']);
    types = types.concat(superClasses);
    types = types.concat(...superClasses.map((c) => getSuperClasses(c)));
  }
  return uniqueArray(types);
};

export const getSubClasses = (nodeId: string) => {
  let types = [nodeId];

  const directSubClasses = getAllNodes()
    .filter(
      (n) =>
        n['rdfs:subClassOf'] &&
        extractIds(n['rdfs:subClassOf']).includes(nodeId),
    )
    .map((n) => n['@id']);
  if (directSubClasses.length !== 0) {
    types = types.concat(directSubClasses);
    types = types.concat(...directSubClasses.map((c) => getSubClasses(c)));
  }
  return uniqueArray(types);
};

interface IPropNodes {
  [key: string]: INode[];
}

export const getTypePropertyNodeForType = (type: string): INode[] =>
  getAllNodes()
    .filter(
      (n: any) =>
        n['@type'] === 'rdf:Property' &&
        n['schema:domainIncludes'] &&
        extractIds(n['schema:domainIncludes']).includes(type),
    )
    .sort((a, b) => removeNS(a['@id']).localeCompare(removeNS(b['@id'])));

export const getPropertyNodeForType = (
  type: string,
  canUseIOProps: boolean,
): IPropNodes =>
  getSuperClasses(type).reduce((acc, cur) => {
    acc[cur] = getTypePropertyNodeForType(cur);
    return acc;
  }, {});

export const getPropertyNodeForTypes = (
  types: string[],
  canUseIOProps: boolean,
): IPropNodes =>
  types.reduce(
    (acc, cur) =>
      Object.assign(acc, getPropertyNodeForType(cur, canUseIOProps)),
    {},
  );

const mergeArrays = (arr: any[]) => [].concat.apply([], arr);

export const specialCaseTerminals = ['schema:Enumeration', 'schema:Quantity'];

export const isEnumNode = (node: INode) =>
  getSuperClasses(node['@id']).includes('schema:Enumeration');

export const isSpecialTerminalNode = (node: INode) =>
  getSuperClasses(node['@id']).some((c) => specialCaseTerminals.includes(c));

export const isTerminalNode = (node: INode) => {
  const superClasses = getSuperClasses(node['@id']);
  let isTerminal = false;
  superClasses.forEach((c) => {
    const n = getNode(c);
    if (!n) {
      return;
    }
    if (makeArray(n['@type']).includes('schema:DataType')) {
      isTerminal = true;
    }
    if (specialCaseTerminals.includes(c)) {
      isTerminal = true;
    }
  });
  return isTerminal;
};

export const getEnumValues = (nodeId: string) =>
  getAllNodes().filter((n) => n['@type'] === nodeId);

const notEmpty = (p: any) =>
  !(p === null || p === undefined || p.toString().trim() === '');

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

export const typeCanUseIOProps = (nodeId: string): boolean =>
  getSuperClasses(nodeId).includes('schema:Action');

export const nodesCanUseIOProps = (nodes: INode[]) =>
  nodes.reduce((acc, cur) => acc || typeCanUseIOProps(cur['@id']), false);

const getSuperClassesForTypes = (nodeIds: string[]): string[] =>
  uniqueArray(
    nodeIds.reduce(
      (acc, cur) => acc.concat(getSuperClasses(cur)),
      [] as string[], // without as, typescript does know the type of the content of the array
    ),
  );

export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

const haveCommon = <T>(arr1: T[], arr2: T[]): boolean =>
  arr1.filter((e) => arr2.includes(e)).length !== 0;

const flatten2DArr = <T>(arr: T[][]): T[] =>
  arr.reduce((a, b) => a.concat(b), []);

const isReplaceable = (obj: any): boolean => {
  const entries = Object.entries(obj);
  return (
    entries.length === 1 &&
    entries[0][0] === '@id' &&
    typeof entries[0][1] === 'string' &&
    entries[0][1].startsWith('_:')
  );
};

const replaceBlankNodes = (obj: any): any =>
  typeof obj === 'object'
    ? isReplaceable(obj)
      ? replaceBlankNodes(getNode(obj['@id']))
      : Object.entries(obj).reduce(
          (acc, [k, v]) => {
            if (typeof v === 'object') {
              if (Array.isArray(v)) {
                acc[k] = v.map((vi) => replaceBlankNodes(vi));
              } else {
                acc[k] = replaceBlankNodes(v);
              }
            } else {
              acc[k] = v;
            }
            return acc;
          },
          {} as any,
        )
    : obj;

const isEnumJSONLD = (prop: string): boolean => {
  const propNode = getNode(prop);
  if (!propNode) {
    return false;
  }
  return getSuperClasses(propNode['schema:rangeIncludes']['@id']).includes(
    'schema:Enumeration',
  );
};

const replaceEnums = (obj: any): any =>
  typeof obj === 'object'
    ? Object.entries(obj).reduce(
        (acc, [k, v]) => {
          if (typeof v === 'object') {
            if (Array.isArray(v)) {
              acc[k] = v.map((vi) => replaceEnums(vi));
            } else {
              acc[k] = replaceEnums(v);
            }
          } else if (isEnumJSONLD(`schema:${k}`)) {
            acc[k] = { '@id': `http://schema.org/${v}` };
          } else {
            acc[k] = v;
          }
          return acc;
        },
        {} as any,
      )
    : obj;

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

interface IShaclProp {
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
    shPropCpy['sh:nodeKind']['@id'] === 'sh:IRI'
  ) {
    shPropCpy['sh:class'] = toIdNode('schema:URL');
    delete shPropCpy['sh:nodeKind'];
  }
  return shPropCpy;
};

const makePropertyRestrictionObj = (shProp: IShaclProp): IRestriction => {
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

const makeRestrictions = (restrictNodes: INode[]): IRestriction[] =>
  flatten2DArr(
    restrictNodes.filter((n) => n['sh:property']).map((shNodeShape) => {
      const populatedNote = replaceBlankNodes(shNodeShape);
      const propertyRestrictionNodes = makeArray(populatedNote['sh:property']);

      return propertyRestrictionNodes.map(
        (n: INode) =>
          clone(makePropertyRestrictionObj((n as unknown) as IShaclProp)), // we clone to remove undefined fields; double as because error otherwise
      );
    }),
  );

export const getRestrictionsForTypes = (
  nodeIds: string[],
  additionalRestrictions: string[] | undefined, // set default empty array
): IRestriction[] => {
  const superTypes = getSuperClassesForTypes(nodeIds);
  const restrictNodes = getRestrictionNodes().filter(
    (n) =>
      n['sh:targetClass'] &&
      haveCommon(extractIds(n['sh:targetClass']), superTypes),
  );
  if (additionalRestrictions) {
    restrictNodes.push(
      ...(additionalRestrictions
        .map((n) => getNode(n))
        .filter((n) => n) as INode[]),
    );
  }
  // console.log(restrictNodes);

  const restrictions = makeRestrictions(restrictNodes);
  return restrictions;
};

export const getSparqlRestrictionsForTypes = async (
  nodeIds: string[],
  additionalRestrictions: string[] | undefined,
  jsonld: any,
): Promise<IRestriction[]> => {
  const superTypes = getSuperClassesForTypes(nodeIds);
  const sparqlRestrictionNodes: INode[] = getRestrictionNodes()
    .filter((n) => n['sh:target'])
    .map((n) => replaceBlankNodes(n))
    .map((n) => {
      const nodeCpy = clone(n);
      nodeCpy['sh:target'].node = getNode(n['sh:target']['@type']);
      return replaceBlankNodes(nodeCpy);
    });

  const jsonldToMatch = replaceEnums(jsonld);

  const restrictions = await Promise.all(
    sparqlRestrictionNodes.map(async (restrictionNode) => {
      let sparqlQuery = `PREFIX schema: <http://schema.org/>
    ${restrictionNode['sh:target'].node['sh:select']}`;
      const params = Object.entries(restrictionNode['sh:target']).filter(
        ([k]) => !['@id', '@type', 'node'].includes(k),
      );
      params.forEach(([k, v]) => {
        sparqlQuery = sparqlQuery.replace(`$${removeNS(k)}`, v['@id']);
      });

      // console.log(params);
      const matches = await jsonldMathesQuery(jsonldToMatch, sparqlQuery);
      if (matches) {
        return restrictionNode;
      }
      return null;
    }),
  );
  const filteredRestrictions = restrictions.filter((n) => n) as INode[];

  const restrictionObjs = makeRestrictions(filteredRestrictions);

  return restrictionObjs;
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

export const arraysAreEquals = <T>(arr1: T[], arr2: T[]): boolean =>
  JSON.stringify(arr1.sort()) === JSON.stringify(arr2.sort());
