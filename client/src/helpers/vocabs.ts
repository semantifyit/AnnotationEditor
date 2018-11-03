import axios from 'axios';

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

const vocabs: IVocab = {};

export const fetchVocabs = async (
  ...vocabNames: string[]
): Promise<boolean> => {
  try {
    await Promise.all(
      vocabNames.map(async (vocabName) => {
        const response = await axios.get(`/api/vocabs/${vocabName}`);
        if (vocabName === 'webapi') {
          vocabs[vocabName] = response.data['@graph'].filter(
            (o: any) =>
              o['@id'].startsWith('webapi') || o['@id'].startsWith('_:'),
          );
        } else {
          vocabs[vocabName] = response.data['@graph'];
        }
      }),
    );
    return true;
  } catch (e) {
    return false;
  }
};

export const addVocab = (name: string, vocab: any) => {
  vocabs[name] = vocab;
};

export interface INode {
  '@id': string;
  '@type': string;
}

export const getAllNodes = (): INode[] =>
  ([] as INode[]).concat(...Object.values(vocabs));

export const getRestrictionNodes = (): INode[] =>
  getAllNodes().filter((n) =>
    ['sh:NodeShape', 'sh:SPARQLTargetType'].includes(n['@type']),
  );
