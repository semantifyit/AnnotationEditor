import axios from 'axios';
import { cleanShaclProp } from './helper';

export const availableVocabs = {
  schema: 'Schema.org',
  'schema-pending': 'Schema.org Pending',
  'schema-bib': 'Schema.org Bibliographic',
  'schema-health-lifesci': 'Schema.org Health and Lifesciences',
  'schema-auto': 'Schema.org Auto',
};

const baseNodes = [
  {
    '@id': '@id',
    '@type': 'rdf:Property',
    'schema:domainIncludes': {
      '@id': 'schema:Thing',
    },
    'schema:rangeIncludes': {
      '@id': 'schema:URL',
    },
    'rdfs:comment': 'jsonld identifier',
    'rdfs:label': '@id',
  },
];

interface IVocab {
  [key: string]: INode[];
}

interface INodeObj {
  [key: string]: INode;
}
const vocabsCache: IVocab = {};
let nodesObj: INodeObj = {};
let currentVocabs: string[] = [];

export const cleanVocab = (vocab: any) =>
  JSON.parse(
    JSON.stringify(vocab).replace(
      new RegExp('http://schema.org/', 'g'),
      'schema:',
    ),
  );

export const fetchVocabs = async (
  ...vocabNames: string[]
): Promise<boolean> => {
  try {
    nodesObj = {};
    currentVocabs = vocabNames;
    await Promise.all(
      vocabNames.map(async (vocabName) => {
        if (vocabsCache[vocabName]) {
          addVocab(vocabsCache[vocabName]);
          return;
        }
        const response = await axios.get(`/annotation/api/vocabs/${vocabName}`);
        if (vocabName === 'webapi') {
          vocabsCache[vocabName] = cleanVocab(response.data['@graph'])
            .filter(
              (o: any) =>
                o['@id'].startsWith('webapi') || o['@id'].startsWith('_:'),
            )
            .map((n: any) => cleanShaclProp(n));
        } else {
          vocabsCache[vocabName] = cleanVocab(response.data['@graph']);
        }
        addVocab(vocabsCache[vocabName]);
      }),
    );
    // add base nodes
    addVocab(baseNodes);
    return true;
  } catch (e) {
    return false;
  }
};

export const addVocab = (vocab: INode[]) => {
  vocab.forEach((node) => {
    if (nodesObj[node['@id']]) {
      nodesObj[node['@id']] = Object.assign(nodesObj[node['@id']], node);
    } else {
      nodesObj[node['@id']] = node;
    }
  });
};

export interface INode {
  '@id': string;
  '@type': string;
}

export const getAllNodes = (): INode[] => Object.values(nodesObj);

export const getRestrictionNodes = (): INode[] =>
  getAllNodes().filter((n) =>
    ['sh:NodeShape', 'sh:SPARQLTargetType'].includes(n['@type']),
  );

export const getCurrentVocabs = (): string[] => currentVocabs;
