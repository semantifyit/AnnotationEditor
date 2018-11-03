import axios from 'axios';

export interface IDSMap {
  id: string;
  name: string;
  hash: string;
}

export const fetchPublicDS = async (): Promise<IDSMap[]> => {
  try {
    const response = await axios.get(
      'https://semantify.it/api/domainspecification/public/map',
    );
    return Object.entries(response.data).map(
      ([k, v]: [string, { name: string; hash: string }]) => ({
        id: k,
        name: v.name,
        hash: v.hash,
      }),
    );
  } catch (e) {
    return [];
  }
};

export const fetchDSbyId = async (dsId: string): Promise<any> => {
  try {
    const response = await axios.get(
      `https://semantify.it/api/domainSpecification/${dsId}`,
    );
    return response.data;
  } catch (e) {
    return null;
  }
};

export const transformDSToShacl = (ds: any): any[] => {
  const shapes: any[] = [];
  let uid = 0;

  const addShape = (classObj: any, id: any, withTargetClass = false) => {
    const shape = {
      '@id': `ex:${classObj['schema:name']}Shape${id}`,
      '@type': 'sh:NodeShape',
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
              addShape(rangeProp, uid + 1);
              uid += 1;
              inner['sh:node'] = {
                '@id': `ex:${rangeProp['schema:name']}Shape${uid}`,
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
  return shapes;
};
