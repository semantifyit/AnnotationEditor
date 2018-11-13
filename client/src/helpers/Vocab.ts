import N3 from 'n3';
import jsonld from 'jsonld';
import axios from 'axios';

import {
  clone,
  flatten2DArr,
  haveCommon,
  makeArray,
  uniqueArray,
} from './util';
import { jsonldMatchesQuery } from './rdfSparql';
import {
  cleanShaclProp,
  extractIds,
  IRestriction,
  IShaclProp,
  isReplaceable,
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

export const specialCaseTerminals = ['schema:Enumeration', 'schema:Quantity'];

export interface INode {
  '@id': string;
  '@type'?: string;
  '@value'?: string;
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

const quadsToJsonLD = async (nquads: string) =>
  jsonld.fromRDF(nquads, { format: 'application/n-quads' });

const turtleToJsonLD = (turtleString: string): any =>
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
    vocabString: string,
    format: string,
  ): Promise<any | true> => {
    try {
      switch (format) {
        case 'application/ld+json': {
          const jsonldObj =
            typeof vocabString === 'string'
              ? JSON.parse(vocabString)
              : vocabString;
          if (jsonldObj['@graph']) {
            this.addVocabJsonLD(vocabName, jsonldObj['@graph']);
          } else {
            this.addVocabJsonLD(vocabName, makeArray(jsonldObj));
          }
          break;
        }
        case 'text/turtle': {
          const jsonldObj = await turtleToJsonLD(vocabString);
          if (jsonldObj['@graph']) {
            this.addVocabJsonLD(vocabName, jsonldObj['@graph']);
          } else {
            this.addVocabJsonLD(vocabName, makeArray(jsonldObj));
          }
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
          if (vocabName === 'webapi') {
            const cleanedVocab = response.data['@graph'].map((n: any) =>
              cleanShaclProp(n),
            );
            return this.addVocab('webapi', cleanedVocab, 'application/ld+json');
          }
          return this.addVocab(
            'schema',
            response.data['@graph'],
            'application/ld+json',
          );
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
      ['sh:NodeShape', 'sh:SPARQLTargetType'].includes(n['@type'] || ''),
    );

  public getAnyNode = (id: string): INode | undefined =>
    this.getAllNodes().find((o: any) => o['@id'] === id);

  public getIONode = (nodeId: string, ioType: string): INode | undefined => {
    const node = this.getAnyNode(nodeId.split('-')[0]);
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

  public getNode = (id: string): INode | undefined => {
    let node;
    if (id.endsWith('-input')) {
      node = this.getIONode(id, 'input');
    } else if (id.endsWith('-output')) {
      node = this.getIONode(id, 'output');
    } else {
      node = this.getAnyNode(id);
    }
    return node;
  };

  public getSuperClasses = (nodeId: string): string[] => {
    let types = [nodeId];
    const node = this.getNode(nodeId);
    if (!node) {
      return [];
    }
    if (node['rdfs:subClassOf']) {
      const superClasses = extractIds(node['rdfs:subClassOf']);
      types = types.concat(superClasses);
      types = types.concat(...superClasses.map((c) => this.getSuperClasses(c)));
    }
    return uniqueArray(types);
  };

  public getSubClasses = (nodeId: string) => {
    let types = [nodeId];
    const directSubClasses = this.getAllNodes()
      .filter(
        (n) =>
          n['rdfs:subClassOf'] &&
          extractIds(n['rdfs:subClassOf']).includes(nodeId),
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
        (n: any) =>
          n['@type'] === 'rdf:Property' &&
          n['schema:domainIncludes'] &&
          extractIds(n['schema:domainIncludes']).includes(type),
      )
      .sort((a, b) => removeNS(a['@id']).localeCompare(removeNS(b['@id'])));

  public getPropertyNodeForType = (
    type: string,
    canUseIOProps: boolean,
  ): IPropNodes =>
    this.getSuperClasses(type).reduce((acc, cur) => {
      acc[cur] = this.getTypePropertyNodeForType(cur);
      return acc;
    }, {});

  public getPropertyNodeForTypes = (
    types: string[],
    canUseIOProps: boolean,
  ): IPropNodes =>
    types.reduce(
      (acc, cur) =>
        Object.assign(acc, this.getPropertyNodeForType(cur, canUseIOProps)),
      {},
    );
  public isEnumNode = (node: INode) =>
    this.getSuperClasses(node['@id']).includes('schema:Enumeration');

  public isSpecialTerminalNode = (node: INode) =>
    this.getSuperClasses(node['@id']).some((c) =>
      specialCaseTerminals.includes(c),
    );

  public isTerminalNode = (node: INode) => {
    const superClasses = this.getSuperClasses(node['@id']);
    let isTerminal = false;
    superClasses.forEach((c) => {
      const n = this.getNode(c);
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

  public getEnumValues = (nodeId: string) =>
    this.getAllNodes().filter((n) => n['@type'] === nodeId);

  public typeCanUseIOProps = (nodeId: string): boolean =>
    this.getSuperClasses(nodeId).includes('schema:Action');

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

  public replaceBlankNodes = (obj: any): any =>
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
    return this.getSuperClasses(
      propNode['schema:rangeIncludes']['@id'],
    ).includes('schema:Enumeration');
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
            } else if (this.isEnumJSONLD(`schema:${k}`)) {
              acc[k] = { '@id': `http://schema.org/${v}` };
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
        .filter((n) => n['sh:property'])
        .map((shNodeShape) => {
          const populatedNote = this.replaceBlankNodes(shNodeShape);
          const propertyRestrictionNodes = makeArray(
            populatedNote['sh:property'],
          );

          if (
            populatedNote['sh:nodeKind'] &&
            populatedNote['sh:nodeKind']['@id'] === 'sh:IRI'
          ) {
            propertyRestrictionNodes.push({
              'sh:path': { '@id': '@id' },
              'sh:minCount': 1,
            });
          }

          return propertyRestrictionNodes.map((n: INode) =>
            // we clone to remove undefined fields; double as because error otherwise
            clone(makePropertyRestrictionObj((n as unknown) as IShaclProp)),
          );
        }),
    );

  public getSparqlRestrictionsForTypes = async (
    nodeIds: string[],
    additionalRestrictions: string[] | undefined,
    jsonldObj: any,
  ): Promise<IRestriction[]> => {
    const superTypes = this.getSuperClassesForTypes(nodeIds);
    const sparqlRestrictionNodes: INode[] = this.getRestrictionNodes()
      .filter((n) => n['sh:target'])
      .map((n) => this.replaceBlankNodes(n))
      .map((n) => {
        const nodeCpy = clone(n);
        nodeCpy['sh:target'].node = this.getNode(n['sh:target']['@type']);
        return this.replaceBlankNodes(nodeCpy);
      });

    const jsonldToMatch = this.replaceEnums(jsonldObj);

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
        const matches = await jsonldMatchesQuery(jsonldToMatch, sparqlQuery);
        if (matches) {
          return restrictionNode;
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
        n['sh:targetClass'] &&
        haveCommon(extractIds(n['sh:targetClass']), superTypes),
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
