import rdf from 'rdflib';

const topId = 'http://actions.semantify.it/current';

const rdfParse = async (
  str: string,
  store: any,
  uri: string,
  mimeType: string,
) =>
  new Promise((resolve, reject) => {
    try {
      rdf.parse(str, store, uri, mimeType, (e: any, f: any) => {
        if (e) {
          reject(e);
        }
        resolve(f);
      });
    } catch (e) {
      reject(e);
    }
  });

const queryStore = (store: any, query: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    const results: any[] = [];
    store.query(
      query,
      (result: any) => {
        results.push(result);
      },
      null,
      () => {
        resolve(results);
      },
    );
  });

export const jsonldMathesQuery = async (
  jsonld: any,
  query: string,
): Promise<boolean> => {
  jsonld['@id'] = topId;
  let store = rdf.graph();
  store = await rdfParse(
    JSON.stringify(jsonld),
    store,
    '',
    'application/ld+json',
  );
  const queryObj = rdf.SPARQLToQuery(query, false, store);

  const results = await queryStore(store, queryObj);

  // console.log(results);

  const matches = results.reduce(
    (acc, cur) =>
      acc ||
      Object.values(cur).reduce(
        (acc2, cur2: { value: string }) => acc2 || cur2.value === topId,
        false,
      ),
    false,
  );

  return matches;
  // return Promise.resolve(true);
};
