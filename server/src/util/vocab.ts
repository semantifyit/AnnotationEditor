import jsonld from 'jsonld';
import * as N3 from 'n3';

export const quadsToJsonLD = (nquads: string): Promise<object[]> =>
  jsonld.fromRDF(nquads, { format: 'application/n-quads' });

export const turtleToJsonLD = (turtleString: string): Promise<object[]> =>
  new Promise((resolve, reject) => {
    const parser = new N3.Parser();
    const writer = new N3.Writer({ format: 'N-Triples' });
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

const parseVocabWithFormat = async (vocab: string, format: string): Promise<object> => {
  switch (format) {
    case 'application/ld+json': {
      const jsonldObj = JSON.parse(vocab);
      // console.log(jsonldObj);
      if (jsonldObj['@id']) {
        delete jsonldObj['@id']; // remove the top level @id, which screws up jsonld expanding
      }
      // if (Array.isArray(jsonldObj) && jsonldObj.length === 1 && jsonldObj[0]['@id']) {
      //   delete jsonldObj[0]['@id'];
      // }
      const expandedVocab = await jsonld.expand(jsonldObj);
      const flattenedVocab = await jsonld.flatten(expandedVocab);
      if (Array.isArray(flattenedVocab)) {
        if (flattenedVocab.length === 1 && flattenedVocab[0]['@graph']) {
          return flattenedVocab[0]['@graph'];
        }
        return flattenedVocab;
      }
      if (flattenedVocab['@graph'] && Array.isArray(flattenedVocab['@graph'])) {
        return flattenedVocab['@graph'];
      }
      throw new Error('Error parsing document');
    }
    case 'text/turtle': {
      const jsonldObj = await turtleToJsonLD(vocab);
      return jsonldObj;
    }
    default:
      throw new Error('format not supported');
  }
};

export const parseVocab = async (vocab: string, format?: string): Promise<object> => {
  if (format) {
    return parseVocabWithFormat(vocab, format);
  }
  try {
    const parsedVocab = await parseVocabWithFormat(vocab, 'application/ld+json');
    return parsedVocab;
  } catch (e) {
    try {
      const parsedVocab = await parseVocabWithFormat(vocab, 'text/turtle');
      return parsedVocab;
    } catch (e2) {
      throw new Error(`could not parse vocab: ${e2}`);
    }
  }
};
