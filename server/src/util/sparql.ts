import { newEngine } from '@comunica/actor-init-sparql-rdfjs';
import * as N3 from 'n3';
import jsonld from 'jsonld';

export const runSparqlAsk = async (data: string, query: string): Promise<boolean> => {
  const triples = await jsonld.toRDF(JSON.parse(data), { format: 'application/n-quads' });
  const store = new N3.Store();
  const parser = new N3.Parser();
  parser.parse(triples, (error: any, quad: any, prefixes: any) => {
    if (quad) store.addQuad(quad);
  });

  const myEngine = newEngine();

  const result: any = await myEngine.query(query, {
    sources: [{ type: 'rdfjsSource', value: store }],
  });
  const isPresent: boolean = await result.booleanResult;
  return isPresent;
};
