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

export const jsonldMatchesQuery = async (
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

  const results: any = (await queryStore(store, queryObj)) as any;

  const matches = results.reduce(
    (acc: any, cur: any) =>
      acc ||
      Object.values(cur).reduce(
        (acc2: any, cur2: any) => acc2 || cur2.value === topId,
        false,
      ),
    false,
  );
  return matches;
};
