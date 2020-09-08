import jsonld from 'jsonld';

import * as p from './rdfProperties';
import {
  extractIds,
  uniqueArray,
  stringSortFn,
  memoize,
  clone,
  filterUndef,
  flatten3DArr,
  flatten2DArr,
  isUri,
} from './utils';

type Node = {
  '@id': string;
  '@type'?: string[];
} & {
  [key: string]: ValueNode[] | RefNode[];
};

interface ValueNode {
  '@id'?: string;
  '@value': string;
  '@language'?: string;
  '@type'?: string;
  '@list'?: ValueNode[];
}

interface RefNode {
  '@id': string;
}

export const haveCommon = (a: any[], b: any[]) => a.some((ele) => b.includes(ele));

const isValNode = (node: ValueNode | RefNode): node is ValueNode => '@value' in node;
const isRefNode = (node: ValueNode | RefNode): node is RefNode => '@id' in node;

const valNodesToString = (valNodes: ValueNode[], delim = ', '): string =>
  valNodes
    .filter((n) => isValNode(n))
    .map((n) => n['@value'])
    .join(delim);

const getPropertyValues = (node: Node, properties: string[]): string[] =>
  extractIds(
    Object.entries(node)
      .filter(([key]) => properties.includes(key))
      .map(([key, val]) => val)
      .flat(),
  );
export const getRanges = (node: Node): string[] => getPropertyValues(node, p.ranges);

export const getDomains = (node: Node): string[] => getPropertyValues(node, p.domains);

export const makePropertyRestrictionObj = (shProp: Node): Restriction => {
  const pRanges: RestrictionRange[] = [];

  const nodeClass: ValueNode[] = (shProp[p.shClass] as ValueNode[]) || [];
  const nodeDatatype: ValueNode[] = (shProp[p.shDatatype] as ValueNode[]) || [];
  const nodeRanges = nodeClass.concat(nodeDatatype);
  if (nodeRanges.length > 0) {
    const pRangeIds = extractIds(nodeRanges);
    pRangeIds.forEach((pRangeId) => {
      const pRange: RestrictionRange = {
        nodeId: pRangeId,
        restrictionIds: extractIds(shProp[p.shNode]) || (shProp['sh:property'] && shProp['@id']) || undefined,
      };
      pRanges.push(pRange);
    });
  }

  const nodeOrs = shProp[p.shOr] as ValueNode[] | undefined;
  if (nodeOrs && nodeOrs.length > 0) {
    const orRestrNodes = filterUndef(
      nodeOrs
        .map((n) => n['@list'])
        .filter((n) => n && typeof n[0] !== 'string')
        .map((n) =>
          filterUndef(
            (n || [])
              .map((listItem) => makePropertyRestrictionObj((listItem as unknown) as Node))
              .map((listItemRestr) => listItemRestr.propertyRanges),
          ),
        ),
    );
    if (orRestrNodes) {
      pRanges.push(...flatten3DArr(orRestrNodes));
    }
  }

  const minCount = shProp[p.shMinCount] as ValueNode[];
  const maxCount = shProp[p.shMaxCount] as ValueNode[];
  const maxInclusive = shProp[p.shMaxInclusive] as ValueNode[];
  const minInclusive = shProp[p.shMinInclusive] as ValueNode[];
  const valueIn = shProp[p.shIn] as ValueNode[];
  const defaultValue = shProp[p.shDefaultValue] as ValueNode[];
  const path = shProp[p.shPath] as Node[]; // since it must have an @id prop
  const pattern = shProp[p.shPattern] as ValueNode[];
  let valueInValues: string[] = [];
  if (valueIn && Array.isArray(valueIn)) {
    valueInValues = filterUndef(
      flatten2DArr(
        valueIn
          .filter((v) => v['@list'])
          .map((v) => v['@list'])
          .map((v) => (v as ValueNode[]).map((i: ValueNode) => i['@value'])),
      ),
    );
  }

  return {
    id: shProp['@id'],
    rangeIsIdNode: extractIds(shProp[p.shNodeKind]).includes(p.shIRI),
    property: path && path[0] && path[0]['@id'],
    propertyRanges: pRanges.length > 0 ? pRanges : undefined,
    defaultValue:
      defaultValue &&
      defaultValue[0] &&
      (defaultValue[0]['@id'] ? defaultValue[0]['@id'] : defaultValue[0]['@value']),
    valueIn: valueInValues.length > 0 ? valueInValues : undefined,
    minCount: (minCount && minCount[0]['@value'] && parseInt(minCount[0]['@value'], 10)) || undefined, // or undef since the value can be and empty string
    maxCount: (maxCount && maxCount[0]['@value'] && parseInt(maxCount[0]['@value'], 10)) || undefined,
    minInclusive:
      (minInclusive && minInclusive[0]['@value'] && parseInt(minInclusive[0]['@value'], 10)) || undefined,
    maxInclusive:
      (maxInclusive && maxInclusive[0]['@value'] && parseInt(maxInclusive[0]['@value'], 10)) || undefined,
    pattern: pattern && pattern[0]['@value'],
  };
};

const isReplaceable = (obj: any): boolean => {
  const entries = Object.entries(obj);
  return (
    entries.length === 1 &&
    entries[0][0] === '@id' &&
    typeof entries[0][1] === 'string' &&
    entries[0][1].startsWith('_:')
  );
};

export interface NodeDetails {
  id: string;
  name: string;
  description: string;
}

interface PropObjDetail {
  [type: string]: { type: NodeDetails; props: NodeDetails[] };
}

export interface Restriction {
  id: string;
  property: string;
  propertyRanges?: RestrictionRange[];
  rangeIsIdNode: boolean;
  // propertyRangeIn: IRestrictionRange[];
  defaultValue?: string;
  valueIn?: string[];
  minCount?: number;
  maxCount?: number;
  pattern?: string;
  minInclusive?: number;
  maxInclusive?: number;
}
export interface RestrictionRange {
  nodeId: string;
  restrictionIds?: string[];
}

const isBlankNode = (nodeId: string): boolean => nodeId.startsWith('_:');

let blankNodePrefixCounter = 0;
const cleanBlankNodes = (nodes: Node[]): Node[] => {
  const bNodeIds = Object.fromEntries(
    nodes
      .filter((n) => isBlankNode(n['@id']))
      .map((n) => [n['@id'], `_:${blankNodePrefixCounter}_${n['@id'].slice(2)}`]),
  );

  nodes.forEach((node) => {
    if (isBlankNode(node['@id'])) {
      node['@id'] = bNodeIds[node['@id']]; // eslint-disable-line no-param-reassign
    }
    Object.entries(node)
      .filter(([key]) => key !== '@id' && key !== '@type')
      .forEach(([key, values]) => {
        values.forEach((value: any) => {
          if (value['@list']) {
            value['@list'].forEach((listVal: any) => {
              if (isRefNode(listVal) && isBlankNode(listVal['@id'])) {
                listVal['@id'] = bNodeIds[listVal['@id']]; // eslint-disable-line no-param-reassign
              }
            });
          }
          if (isRefNode(value) && isBlankNode(value['@id'])) {
            value['@id'] = bNodeIds[value['@id']]; // eslint-disable-line no-param-reassign
          }
        });
      });
  });

  blankNodePrefixCounter += 1;
  return nodes;
};

export const usePrefixWith = (prefix: Record<string, string>) => (nodeId: string) =>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  usePrefix(nodeId, prefix);

// prefix[''] same as @vocab
export const usePrefix = (nodeId: string, prefix: Record<string, string>): string => {
  if (nodeId.startsWith(prefix[''])) {
    return nodeId.replace(prefix[''], '');
  }
  for (const [pref, uri] of Object.entries(prefix)) {
    if (nodeId.startsWith(uri)) {
      return nodeId.replace(uri, `${pref}:`);
    }
  }
  return nodeId;
};

export const unUsePrefix = (nodeId: string, prefix: Record<string, string>): string => {
  for (const [pref, uri] of Object.entries(prefix)) {
    if (nodeId.startsWith(pref)) {
      return nodeId.replace(`${pref}:`, uri);
    }
  }
  if (!isUri(nodeId) && prefix['']) {
    return `${prefix['']}${nodeId}`;
  }
  return nodeId;
};

export const sortNodeDetails = (desc: NodeDetails[]): NodeDetails[] =>
  desc.sort((a, b) => a.name.localeCompare(b.name));

export default class VocabHandler {
  nodes: Node[];

  prefixes: Record<string, string>;

  constructor(vocabStr: string | string[], prefixes: Record<string, string>) {
    this.prefixes = prefixes;
    if (Array.isArray(vocabStr)) {
      this.nodes = vocabStr.flatMap((str) => cleanBlankNodes(JSON.parse(str)));
      // merging nodes done by jsonld flatten, only needed when mult vocabs
      jsonld.flatten(this.nodes).then((newNodes: any) => {
        this.nodes = newNodes;
        this.clearCaches();
      });
    } else {
      this.nodes = JSON.parse(vocabStr);
    }
  }

  // caching:
  private caches: { [functionName: string]: { [key: string]: any } } = {};

  private cacheCounter = 0;

  private memoize = <T, U>(fn: (...args: U[]) => T): ((...args: U[]) => T) => {
    // console.log('memo here');
    this.caches[this.cacheCounter] = {};
    this.cacheCounter += 1;
    return memoize(fn, this.caches[this.cacheCounter - 1]);
  };

  private clearCaches = () => {
    // eslint-disable-next-line guard-for-in
    for (const k in this.caches) {
      // eslint-disable-next-line guard-for-in
      for (const i in this.caches[k]) {
        delete this.caches[k][i];
      }
    }
  };

  usePrefix = (nodeId: string): string => usePrefix(nodeId, this.prefixes);

  unUsePrefix = (nodeId: string): string => unUsePrefix(nodeId, this.prefixes);

  getDescForNode = (node: Node): NodeDetails => ({
    id: node['@id'],
    name: this.usePrefix(node['@id']),
    description: valNodesToString((node[p.rdfsComment] as ValueNode[]) || []),
  });

  getNodesDetailsWithType = (types: string[]): NodeDetails[] =>
    this.getAllOfType(types).map(this.getDescForNode);

  getClassesDescr = (): NodeDetails[] => this.getNodesDetailsWithType(p.classes);

  getPropertiesDescr = (): NodeDetails[] => this.getNodesDetailsWithType(p.properties);

  getAllOfType = this.memoize((types: string[]) =>
    this.nodes.filter((node) => haveCommon(node['@type'] || [], types)),
  );

  getClasses = () => this.getAllOfType(p.classes);

  getProperties = () => this.getAllOfType(p.properties);

  getRestrictionNodes = () => this.getAllOfType([p.shNodeShape]);

  getNodesObj = this.memoize((): {
    [nodeId: string]: Node;
  } => Object.fromEntries(this.nodes.map((n) => [n['@id'], n])));

  getNode = (nodeId: string, nodes = this.nodes) => {
    const node = this.getNodesObj()[nodeId];
    if (!node) {
      throw new Error(
        `Cound not find node: "${nodeId}". Make sure it is presend in your selected vocabularies`,
      );
    }
    return node;
  };

  /* getNode2 = this.memoize((nodeId: string) => (nodes: Node[] = this.nodes) => {
    const node = nodes.find((n) => n['@id'] === nodeId);
    if (!node) {
      throw new Error(
        `Cound not find node: "${nodeId}". Make sure it is presend in your selected vocabularies`,
      );
    }
    return node;
  }); */

  getNodes = (nodeIds: string[], nodes = this.nodes) => nodeIds.map((nodeId) => this.getNode(nodeId, nodes));

  getDescrOfTypeNodes = (nodeIds: string[]) =>
    this.getNodes(nodeIds, this.getClasses()).map(this.getDescForNode);

  getDescrOfPropNode = (nodeId: string) => this.getDescForNode(this.getNode(nodeId));

  getSubClasses = this.memoize((nodeId: string): string[] => {
    let types = [nodeId];
    const directSubClasses = this.getClasses()
      .filter((n) => n[p.rdfsSubClassOf] && extractIds(n[p.rdfsSubClassOf]).includes(nodeId))
      .map((n) => n['@id']);

    types = types.concat(directSubClasses);
    types = types.concat(...directSubClasses.map((c) => this.getSubClasses(c)));

    return uniqueArray(types);
  });

  getSuperClasses = (nodeId: string): string[] => {
    let types = [nodeId];
    const node = this.getNode(nodeId, this.getClasses());

    const superClassesOfNode = node[p.rdfsSubClassOf];
    if (superClassesOfNode) {
      const superClasses = extractIds(superClassesOfNode);
      types = types.concat(superClasses);
      types = types.concat(...superClasses.map((c) => this.getSuperClasses(c)));
    }
    return uniqueArray(types);
  };

  getSuperClassesForTypes = (nodeIds: string[]): string[] =>
    uniqueArray(nodeIds.flatMap((nodeId) => this.getSuperClasses(nodeId)));

  getDescOfSubClassesOfNodes = (nodeIds: string[]) =>
    this.getNodes(uniqueArray(nodeIds.flatMap((nodeId) => this.getSubClasses(nodeId)))).map(
      this.getDescForNode,
    );

  getDescOfSubClasses = (nodeId: string) =>
    this.getNodes(this.getSubClasses(nodeId)).map(this.getDescForNode);

  getDirectPropertiesForType = (type: string): Node[] =>
    this.getProperties().filter((prop) => getDomains(prop).includes(type));

  getAllPropertiesForType = (type: string): [string, Node[]][] =>
    this.getSuperClasses(type).map((superType) => [superType, this.getDirectPropertiesForType(superType)]);

  getPropertiesForTypes = (types: string[]): [string, Node[]][] =>
    types.flatMap((type) => this.getAllPropertiesForType(type));

  getPropetyObjForTypes = this.memoize(
    (types: string[]): PropObjDetail => {
      const obj: PropObjDetail = {};
      for (const [type, props] of this.getPropertiesForTypes(types).sort((a, b) =>
        a[0].localeCompare(b[0]),
      )) {
        obj[type] = {
          type: this.getDescForNode(this.getNode(type)),
          props: props.map((pr) => this.getDescForNode(pr)).sort((p1, p2) => p1.name.localeCompare(p2.name)),
        };
      }
      return obj;
    },
  );

  getRanges = (propId: string): string[] => getRanges(this.getNode(propId)).sort(stringSortFn);

  getDefaultRange = (propId: string): string => this.getRanges(propId)[0];

  getEnumNode = (nodeId: string): false | NodeDetails[] =>
    this.getSuperClasses(nodeId).includes(p.schemaEnumeration)
      ? this.getAllOfType([nodeId]).map(this.getDescForNode)
      : false;

  public replaceBlankNodes = <T>(obj: T): T =>
    // eslint-disable-next-line no-nested-ternary
    typeof obj === 'object'
      ? isReplaceable(obj)
        ? this.replaceBlankNodes(this.getNode((obj as any)['@id']))
        : Object.entries(obj).reduce((acc, [k, v]) => {
            if (typeof v === 'object') {
              if (Array.isArray(v)) {
                acc[k] = v.map((vi) => this.replaceBlankNodes(vi));
              } else {
                acc[k] = this.replaceBlankNodes(v);
              }
            } else {
              acc[k] = v;
            }
            return acc;
          }, {} as any)
      : obj;

  getRestrictionsForTypes = (nodeIds: string[], additionalRestrictions?: string[]): Restriction[] => {
    const superTypes = this.getSuperClassesForTypes(nodeIds);
    const restrictNodes = this.getRestrictionNodes().filter(
      (n) => n[p.shTargetClass] && haveCommon(extractIds(n[p.shTargetClass]), superTypes),
    );
    if (additionalRestrictions) {
      restrictNodes.push(...additionalRestrictions.map((n) => this.getNode(n)));
    }
    // console.log(restrictNodes);
    return this.makeRestrictions(restrictNodes);
  };

  makeRestrictions = (restrictNodes: Node[]): Restriction[] =>
    flatten2DArr(
      restrictNodes
        .filter((n) => n[p.shProperty])
        .map((shNodeShape) => {
          const populatedNote = this.replaceBlankNodes(shNodeShape);
          const propertyRestrictionNodes = (populatedNote[p.shProperty] as unknown) as Node;
          if (!propertyRestrictionNodes || !Array.isArray(propertyRestrictionNodes)) {
            return [];
          }
          const nodeKind = populatedNote[p.shNodeKind];
          if (nodeKind && nodeKind[0] && nodeKind[0]['@id'] === p.shIRI) {
            propertyRestrictionNodes.push({
              [p.shPath]: [{ '@id': '@id' }],
              [p.shMinCount]: [{ '@value': '1' }],
            } as Node);
          }

          return propertyRestrictionNodes.map((n: Node) =>
            // we clone to remove undefined fields
            clone(makePropertyRestrictionObj(n)),
          );
        }),
    );

  haveCommonSuperTypes = (types: string[], commons: string[]): boolean =>
    this.getSuperClassesForTypes(types).some((type) => commons.includes(type));

  isTerminalNode = (nodeId: string) => p.terminalNodes.includes(nodeId) || this.getEnumNode(nodeId);
}

// export const isTerminalNode = (nodeId: string) =>
//   p.terminalNodes.includes(nodeId);
