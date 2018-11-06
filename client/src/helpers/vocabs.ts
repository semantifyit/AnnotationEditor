import axios from 'axios';
import { cleanShaclProp } from './helper';

export const availableVocabs = {
  schema: 'Schema.org',
  'schema-pending': 'Schema.org Pending',
  'schema-bib': 'Schema.org Bibliographic',
  'schema-health-lifesci': 'Schema.org Health and Lifesciences',
  'schema-auto': 'Schema.org Auto',
};

interface IVocab {
  [key: string]: INode[];
}

interface INodeObj {
  [key: string]: INode;
}

const nodesObj: INodeObj = {};

export const fetchVocabs = async (
  ...vocabNames: string[]
): Promise<boolean> => {
  try {
    const vocabs: IVocab = {};
    await Promise.all(
      vocabNames.map(async (vocabName) => {
        const response = await axios.get(`/annotation/api/vocabs/${vocabName}`);
        if (vocabName === 'webapi') {
          vocabs[vocabName] = response.data['@graph']
            .filter(
              (o: any) =>
                o['@id'].startsWith('webapi') || o['@id'].startsWith('_:'),
            )
            .map((n: any) => cleanShaclProp(n));
        } else {
          vocabs[vocabName] = response.data['@graph'];
        }
      }),
    );
    Object.entries(vocabs).forEach(([vocabName, nodes]) => {
      addVocab(nodes);
    });
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
