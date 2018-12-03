import axios from 'axios';

import { makeArray } from './util';

export interface IDSMap {
  id: string;
  name: string;
  hash: string;
}

interface IDSResponce {
  data: {
    [dsId: string]: { name: string; hash: string };
  };
}

interface IPostAnnotation {
  data: {
    UID: string;
    id: string;
    name: string;
    type: string[];
  }[];
}

const semantifyApiUrl = 'https://semantify.it/api/';

// this is the instant annotation website
// const defaultWebsite = {
//   uid: 'Hkqtxgmkz',
//   secret: 'ef0a64008d0490fc4764c2431ca4797b',
// };
// this is some website on thibault's account
const defaultWebsite = {
  uid: '-K82c2498',
  secret: '343d0d070a5fbbba7e1f0b18b5d77685',
};

export const fetchPublicDS = async (): Promise<IDSMap[]> => {
  try {
    const response: IDSResponce = await axios.get(
      `${semantifyApiUrl}domainspecification/public/map`,
    );
    return Object.entries(response.data).map(([k, v]) => ({
      id: k,
      name: v.name,
      hash: v.hash,
    }));
  } catch (e) {
    return [];
  }
};

export const fetchDSbyId = async (dsId: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${semantifyApiUrl}domainSpecification/${dsId}`,
    );
    return response.data;
  } catch (e) {
    return null;
  }
};

export const transformDSToShacl = (ds: any): any => {
  const shapes: any[] = [];
  let uid = 0;
  const newUid = () => {
    uid += 1;
    return uid;
  };

  const addShape = (classObj: any, id: any, withTargetClass = false) => {
    const shape = {
      '@id': `ex:${classObj['schema:name']}Shape${id}`,
      '@type': makeArray('sh:NodeShape'),
      'sh:targetClass': withTargetClass
        ? { '@id': classObj['dsv:baseClass']['@id'] }
        : undefined,
      'sh:property': classObj['dsv:property'].map((property: any) => ({
        'sh:path': {
          '@id': `schema:${property['schema:name']}`,
        },
        'sh:minCount': 1,
        'sh:maxCount': property['dsv:multipleValuesAllowed'] ? 1 : undefined,
        'sh:or': {
          '@list': property['dsv:expectedType'].map((rangeProp: any) => {
            const inner = {
              'sh:class': { '@id': `schema:${rangeProp['schema:name']}` },
            };
            if (rangeProp['@type'] === 'dsv:RestrictedClass') {
              const childId = newUid();
              addShape(rangeProp, childId);
              inner['sh:node'] = {
                '@id': `ex:${rangeProp['schema:name']}Shape${childId}`,
              };
            }
            return inner;
          }),
        },
      })),
    };
    shapes.push(shape);
  };

  ds['dsv:class'].forEach((c: any) => {
    addShape(c, uid, true);
    uid += 1;
  });

  return {
    '@context': {
      schema: 'http://schema.org/',
      sh: 'http://www.w3.org/ns/shacl#',
    },
    '@graph': shapes,
  };
};

export const saveAnnToSemantifyWebsite = async (
  annotations: any[],
  websiteUID: string = defaultWebsite.uid,
  websiteSecret: string = defaultWebsite.secret,
): Promise<undefined | string[]> => {
  try {
    const response: IPostAnnotation = await axios({
      method: 'post',
      url: `${semantifyApiUrl}annotation/${websiteUID}`,
      headers: {
        'website-secret': websiteSecret,
      },
      data: annotations.map((annotation) => ({ content: annotation })),
    });
    return response.data.map((r) => r.UID);
  } catch (e) {
    console.log(e);
  }
};
