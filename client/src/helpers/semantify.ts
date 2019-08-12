import axios from 'axios';

import { makeArray, parseJwt } from './util';

export interface IDSMap {
  id: string;
  name: string;
  hash: string;
  description?: string;
  types: [string];
}

export interface ISemantifyWebsite {
  uid: string;
  secret: string;
  name?: string;
  domain?: string;
}

export interface ISemantifyUser {
  username: string;
  token: string;
}

interface IDSResponce {
  data: {
    [dsId: string]: {
      name: string;
      hash: string;
      description?: string;
      types: [string];
    };
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

// this is some test website
const defaultWebsite = {
  uid: 'EUrd5iMwn',
  secret: '6e1b0db9ae54e22953280bd2e539b5ac',
};
// this is some website on thibault's account
// const defaultWebsite = {
//   uid: '-K82c2498',
//   secret: '343d0d070a5fbbba7e1f0b18b5d77685',
// };

export const fetchPublicDS = async (): Promise<IDSMap[]> => {
  try {
    const response: IDSResponce = await axios.get(
      `${semantifyApiUrl}domainspecification/public/map`,
    );
    return Object.entries(response.data).map(([k, v]) => ({
      id: k,
      name: v.name,
      hash: v.hash,
      description: v.description,
      types: v.types,
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
            const inner: any = {
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
  website: ISemantifyWebsite = defaultWebsite,
): Promise<undefined | string[]> => {
  try {
    const response: IPostAnnotation = await axios({
      method: 'post',
      url: `${semantifyApiUrl}annotation/${website.uid}`,
      headers: {
        'website-secret': website.secret,
      },
      data: annotations.map((annotation) => ({ content: annotation })),
    });
    return response.data.map((r) => r.UID);
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

interface ISemantifyJWT {
  username: string;
  _id: string;
}

interface ISemantifyUserLoginResponce {
  token: string;
  username: string;
  websiteList: ISemantifyWebsite[];
}

export const loginSemantifyUser = async (
  username: string,
  password: string,
): Promise<ISemantifyUserLoginResponce | undefined> => {
  try {
    const respLogin = await axios.post(`${semantifyApiUrl}login`, {
      password,
      identifier: username,
    });
    const { token, message } = respLogin.data;
    if (!token || message !== 'ok') {
      return;
    }
    const user: ISemantifyJWT = parseJwt(token);

    const respWebsites = await axios({
      url: `${semantifyApiUrl}website`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      token,
      username: user.username,
      websiteList: respWebsites.data,
    };
  } catch (e) {
    return;
  }
};
