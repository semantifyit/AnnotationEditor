import N3 from 'n3';
import jsonld from 'jsonld';
import axios from 'axios';

import * as p from './properties';
import { clone, flatten2DArr, haveCommon, uniqueArray } from './util';
import { jsonldMatchesQuery } from './rdfSparql';
import {
  cleanShaclProp,
  extractIds,
  getNameOfNode,
  IRestriction,
  isReplaceable,
  makeIdArr,
  makePropertyRestrictionObj,
  removeNS,
} from './helper';

export const defaultVocabs = {
  schema: 'Schema.org',
  'schema-pending': 'Schema.org Pending',
  'schema-bib': 'Schema.org Bibliographic',
  'schema-health-lifesci': 'Schema.org Health and Lifesciences',
  'schema-auto': 'Schema.org Auto',
};

export const specialCaseTerminals = [p.schemaEnumeration, p.schemaQuantity];

export interface INode {
  '@id': string;
  '@type'?: string[];
  [key: string]: INodeValue[] | string | string[] | undefined;
  // any other property, we need the other types for typescript (https://github.com/Microsoft/TypeScript/issues/17867)
}
export interface INodeValue {
  '@id'?: string;
  '@value'?: string;
  '@type'?: string;
  '@language'?: string;
}

interface ISingleVocab {
  [nodeid: string]: INode;
}
interface IVocab {
  [vocabname: string]: ISingleVocab;
}
interface IPropNodes {
  [key: string]: INode[];
}

interface INodeTarget {
  node: INode;
  target: INode | undefined;
}

const quadsToJsonLD = async (nquads: string): Promise<object[]> =>
  jsonld.fromRDF(nquads, { format: 'application/n-quads' });

const turtleToJsonLD = (turtleString: string): Promise<object[]> =>
  new Promise((resolve, reject) => {
    const parser = new N3.Parser();
    const writer = N3.Writer({ format: 'N-Triples' });
    parser.parse(turtleString, (error: any, quad: any) => {
      if (error) {
        reject(error);
      } else if (quad) {
        writer.addQuad(quad);
      } else {
        writer.end((writerError: any, quadsString: string) => {
          if (writerError) {
            reject(writerError);
          } else {
            resolve(quadsToJsonLD(quadsString));
          }
        });
      }
    });
  });

export default class Vocab {
  public vocabs: IVocab = {};
  public currentVocabs: string[] = [];

  public addVocab = async (
    vocabName: string,
    vocabData: string | object,
    format: string,
  ): Promise<any | true> => {
    try {
      switch (format) {
        case 'application/ld+json': {
          const jsonldObj =
            typeof vocabData === 'string' ? JSON.parse(vocabData) : vocabData;
          const expandedVocab = await jsonld.expand(jsonldObj);
          const flattenedVocab = await jsonld.flatten(expandedVocab);
          if (Array.isArray(flattenedVocab)) {
            this.addVocabJsonLD(vocabName, expandedVocab);
          } else if (
            flattenedVocab['@graph'] &&
            Array.isArray(flattenedVocab['@graph'])
          ) {
            console.log('here');
            this.addVocabJsonLD(vocabName, flattenedVocab['@graph']);
          } else {
            alert('Error parsing document');
          }
          break;
        }
        case 'text/turtle': {
          const jsonldObj = await turtleToJsonLD(vocabData as string);
          this.addVocabJsonLD(vocabName, jsonldObj as INode[]);
          break;
        }
        default: {
          return `format "${format}" not supported`;
        }
      }
    } catch (e) {
      console.log(e);
      return e;
    }
    return true;
  };

  public addVocabJsonLD = (vocabName: string, nodes: INode[]): void => {
    if (!this.vocabs[vocabName]) {
      this.vocabs[vocabName] = {};
    }
    nodes.forEach((node) => {
      if (this.vocabs[vocabName][node['@id']]) {
        this.vocabs[vocabName][node['@id']] = Object.assign(
          this.vocabs[vocabName][node['@id']],
          node,
        );
      } else {
        this.vocabs[vocabName][node['@id']] = node;
      }
    });
  };

  public addDefaultVocabs = async (
    ...vocabNames: string[]
  ): Promise<boolean> => {
    try {
      this.currentVocabs = vocabNames;
      await Promise.all(
        vocabNames.map(async (vocabName) => {
          const response = await axios.get(
            `/annotation/api/vocabs/${vocabName}`,
          );
          const vocab = response.data;
          if (vocabName === 'webapi') {
            vocab['@graph'] = vocab['@graph'].map((n: any) =>
              cleanShaclProp(n),
            );
            return this.addVocab('webapi', vocab, 'application/ld+json');
          }
          // schema vocabs are missing the schema namespace
          // instead of adding to the vocab file we add them here - could be changed later on
          // additionally we remove the top level @id, which screws up jsonld expanding
          vocab['@context'] = Object.assign(vocab['@context'], {
            schema: 'http://schema.org/',
          });
          delete vocab['@id'];
          return this.addVocab('schema', vocab, 'application/ld+json');
        }),
      );
      return true;
    } catch (e) {
      return false;
    }
  };

  public getCurrentVocabs = (): string[] => this.currentVocabs;

  public getAllNodes = (): INode[] =>
    flatten2DArr(Object.values(this.vocabs).map((v) => Object.values(v)));

  public getAllNodesFromVocab = (vocabName: string): INode[] =>
    Object.values(this.vocabs[vocabName]);

  public getRestrictionNodes = (): INode[] =>
    this.getAllNodes().filter((n) =>
      haveCommon(['sh:NodeShape', 'sh:SPARQLTargetType'], n['@type'] || []),
    );

  public getAnyNode = (id: string): INode | undefined =>
    this.getAllNodes().find((o) => o['@id'] === id);

  public getIONode = (nodeId: string, ioType: string): INode | undefined => {
    const node = this.getAnyNode(nodeId.replace(`-${ioType}`, ''));
    if (!node) {
      return undefined;
    }
    const cpy = clone(node);
    cpy['@id'] = `${node['@id']}-${ioType}`;
    cpy[p.rdfsLabel] = makeIdArr(`${node['rdfs:label']}-${ioType}`);
    cpy[p.schemaRangeIncludes] = makeIdArr(
      p.schemaText,
      p.schemaPropertyValueSpecification,
    );
    return cpy;
  };

  public getNodeFromNS = (ns: p.Namespace, id: string): INode | undefined =>
    this.getNode(p.joinNS(ns, id));

  public getNode = (nodeId: string): INode | undefined => {
    let node;
    if (nodeId.endsWith('-input')) {
      node = this.getIONode(nodeId, 'input');
    } else if (nodeId.endsWith('-output')) {
      node = this.getIONode(nodeId, 'output');
    } else {
      node = this.getAnyNode(nodeId);
    }
    return node;
  };

  public getSuperClasses = (nodeId: string): string[] => {
    let types = [nodeId];
    const node = this.getNode(nodeId);
    if (!node) {
      return [];
    }
    const subClassOfNode = node[p.rdfsSubClassOf];
    if (subClassOfNode) {
      const superClasses = extractIds(subClassOfNode);
      types = types.concat(superClasses);
      types = types.concat(...superClasses.map((c) => this.getSuperClasses(c)));
    }
    return uniqueArray(types);
  };

  public getSubClasses = (nodeId: string): string[] => {
    let types = [nodeId];
    const directSubClasses = this.getAllNodes()
      .filter(
        (n) =>
          n[p.rdfsSubClassOf] &&
          extractIds(n[p.rdfsSubClassOf]).includes(nodeId),
      )
      .map((n) => n['@id']);
    if (directSubClasses.length !== 0) {
      types = types.concat(directSubClasses);
      types = types.concat(
        ...directSubClasses.map((c) => this.getSubClasses(c)),
      );
    }
    return uniqueArray(types);
  };

  public getTypePropertyNodeForType = (type: string): INode[] =>
    this.getAllNodes()
      .filter(
        (n) =>
          n['@type'] &&
          n['@type'].includes(p.rdfProperty) &&
          n[p.schemaDomainIncludes] &&
          extractIds(n[p.schemaDomainIncludes]).includes(type),
      )
      .sort((a, b) => getNameOfNode(a).localeCompare(getNameOfNode(b)));

  public getPropertyNodeForType = (type: string): IPropNodes =>
    this.getSuperClasses(type).reduce((acc, cur) => {
      acc[cur] = this.getTypePropertyNodeForType(cur);
      return acc;
    }, {});

  public getPropertyNodeForTypes = (types: string[]): IPropNodes =>
    types.reduce(
      (acc, cur) => Object.assign(acc, this.getPropertyNodeForType(cur)),
      {},
    );

  public isEnumNode = (node: INode) =>
    this.getSuperClasses(node['@id']).includes(p.schemaEnumeration);

  public isSpecialTerminalNode = (node: INode): boolean =>
    this.getSuperClasses(node['@id']).some((c) =>
      specialCaseTerminals.includes(c),
    );

  public isTerminalNode = (nodeId: string) => {
    const xsdTerminal = [
      p.xsdBoolean,
      p.xsdDate,
      p.xsdDecimal,
      p.xsdBoolean,
      p.xsdInteger,
      p.xsdString,
      p.xsdTime,
    ];
    const schemaTerminals = [
      p.schemaText,
      p.schemaURL,
      p.schemaNumber,
      p.schemaFloat,
      p.schemaBoolean,
      p.schemaDate,
      p.schemaTime,
      p.schemaDateTime,
    ];
    const terminals = xsdTerminal.concat(schemaTerminals, specialCaseTerminals);
    return terminals.includes(nodeId);
  };

  public getEnumValues = (nodeId: string) =>
    this.getAllNodes().filter((n) => n['@type'] && n['@type'].includes(nodeId));

  public typeCanUseIOProps = (nodeId: string): boolean =>
    this.getSuperClasses(nodeId).includes(p.schemaAction);

  public nodesCanUseIOProps = (nodes: INode[]) =>
    nodes.reduce(
      (acc, cur) => acc || this.typeCanUseIOProps(cur['@id']),
      false,
    );

  public getSuperClassesForTypes = (nodeIds: string[]): string[] =>
    uniqueArray(
      nodeIds.reduce(
        (acc, cur) => acc.concat(this.getSuperClasses(cur)),
        [] as string[], // without as, typescript does know the type of the content of the array
      ),
    );

  public replaceBlankNodes = <T>(obj: T): T =>
    typeof obj === 'object'
      ? isReplaceable(obj)
        ? this.replaceBlankNodes(this.getNode(obj['@id']))
        : Object.entries(obj).reduce(
            (acc, [k, v]) => {
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
            },
            {} as any,
          )
      : obj;

  public isEnumJSONLD = (prop: string): boolean => {
    const propNode = this.getNode(prop);
    if (!propNode) {
      return false;
    }
    const rangeOfNode = propNode[p.schemaRangeIncludes];
    if (!rangeOfNode || !rangeOfNode[0]) {
      return false;
    }
    return this.getSuperClasses(rangeOfNode[0]['@id']).includes(
      p.schemaEnumeration,
    );
  };

  public replaceEnums = (obj: any): any =>
    typeof obj === 'object'
      ? Object.entries(obj).reduce(
          (acc, [k, v]) => {
            if (typeof v === 'object') {
              if (Array.isArray(v)) {
                acc[k] = v.map((vi) => this.replaceEnums(vi));
              } else {
                acc[k] = this.replaceEnums(v);
              }
            } else if (
              typeof v === 'string' &&
              this.isEnumJSONLD(p.joinNS('schema', k))
            ) {
              acc[k] = { '@id': p.joinNS('schema', v) };
            } else {
              acc[k] = v;
            }
            return acc;
          },
          {} as any,
        )
      : obj;

  public makeRestrictions = (restrictNodes: INode[]): IRestriction[] =>
    flatten2DArr(
      restrictNodes
        .filter((n) => n[p.shProperty])
        .map((shNodeShape) => {
          const populatedNote = this.replaceBlankNodes(shNodeShape) as INode;
          const propertyRestrictionNodes = (populatedNote[
            p.shProperty
          ] as unknown) as INode;
          if (
            !propertyRestrictionNodes ||
            !Array.isArray(propertyRestrictionNodes)
          ) {
            return [];
          }
          const nodeKind = populatedNote[p.shNodeKind];
          if (nodeKind && nodeKind[0] && nodeKind[0]['@id'][p.shIRI]) {
            propertyRestrictionNodes.push({
              [p.shPath]: [{ '@id': '@id' }],
              [p.shMinCount]: [{ '@value': '1' }],
            } as INode);
          }

          return propertyRestrictionNodes.map((n: INode) =>
            // we clone to remove undefined fields
            clone(makePropertyRestrictionObj(n)),
          );
        }),
    );

  public getSparqlRestrictionsForTypes = async (
    nodeIds: string[],
    additionalRestrictions: string[] | undefined,
    jsonldObj: any,
  ): Promise<IRestriction[]> => {
    const jsonldToMatch = this.replaceEnums(jsonldObj);
    const sparqlRestrictionNodes: INodeTarget[] = this.getRestrictionNodes()
      .filter((n) => n[p.shTarget])
      .map(this.replaceBlankNodes)
      .map((n) => {
        const nodeCpy = clone(n);
        const nodeTarget = nodeCpy[p.shTarget];
        return {
          node: this.replaceBlankNodes(nodeCpy),
          target: this.getNode(nodeTarget && nodeTarget['@type'][0]),
        };
      });

    const restrictions = await Promise.all(
      sparqlRestrictionNodes.map(async (restrictionNode) => {
        if (!restrictionNode.target) {
          return null;
        }
        let sparqlQuery = `PREFIX schema: <http://schema.org/>
        ${restrictionNode.target[p.shSelect]}`;
        const params = Object.entries((restrictionNode.node[
          p.shTarget
        ] as unknown) as INode).filter(([k]) => !['@id', '@type'].includes(k));
        params.forEach(([k, v]) => {
          if (v && v[0]['@id']) {
            sparqlQuery = sparqlQuery.replace(`$${removeNS(k)}`, v[0]['@id']);
          }
        });

        // console.log(params);
        const matches = await jsonldMatchesQuery(jsonldToMatch, sparqlQuery);
        if (matches) {
          return restrictionNode.node;
        }
        return null;
      }),
    );
    const filteredRestrictions = restrictions.filter((n) => n) as INode[];

    const restrictionObjs = this.makeRestrictions(filteredRestrictions);

    return restrictionObjs;
  };

  public getRestrictionsForTypes = (
    nodeIds: string[],
    additionalRestrictions: string[] | undefined, // set default empty array
  ): IRestriction[] => {
    const superTypes = this.getSuperClassesForTypes(nodeIds);
    const restrictNodes = this.getRestrictionNodes().filter(
      (n) =>
        n[p.shTargetClass] &&
        haveCommon(extractIds(p.shTargetClass), superTypes),
    );
    if (additionalRestrictions) {
      restrictNodes.push(
        ...(additionalRestrictions
          .map((n) => this.getNode(n))
          .filter((n) => n) as INode[]),
      );
    }
    // console.log(restrictNodes);
    const restrictions = this.makeRestrictions(restrictNodes);
    return restrictions;
  };
}
