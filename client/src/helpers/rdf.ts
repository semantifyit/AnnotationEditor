import jsonld from 'jsonld';
import N3 from 'n3';

export const quadsToJsonLD = async (nquads: string): Promise<object[]> =>
  jsonld.fromRDF(nquads, { format: 'application/n-quads' });

export const turtleToJsonLD = (turtleString: string): Promise<object[]> =>
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

export const removeNSFromJSONLD = (ann: any, namespace: string): Promise<any> =>
  jsonld.compact(ann, { '@vocab': namespace });
