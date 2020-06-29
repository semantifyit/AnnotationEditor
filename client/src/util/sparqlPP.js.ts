import { Parser as SparqlParser } from 'sparqljs';

import { idNode } from './toAnnotation';
import VocabHandler from './VocabHandler';
import { sh } from './rdfProperties';

// a lot of code from https://github.com/semantifyit/sparql-property-paths

type Prefixes = Record<string, string>;

type ParseResult = ParseResultNamedNode | ParseResultPath;

interface ParseResultNamedNode {
  termType: 'NamedNode';
  value: string;
}

interface ParseResultPath {
  type: 'path';
  pathType: '^' | '/' | '|' | '*' | '+' | '?' | '!';
  items: (ParseResultNamedNode | ParseResultPath)[];
}

const itemIsNamedNode = (item: ParseResult): item is ParseResultNamedNode =>
  'termType' in item && item.termType === 'NamedNode';

const toParseResult = (sppStr: string, prefixes: Prefixes): ParseResult => {
  const parser = new SparqlParser();
  const prefixStr = Object.entries(prefixes)
    .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
    .join('\n');
  const parsedQuery = parser.parse(
    `${prefixStr}
        SELECT * { ?s ${sppStr} ?o. }`,
  );
  return parsedQuery.where[0].triples[0].predicate;
};

export const isValidSPP = (path: string, prefixes: Prefixes): boolean => {
  try {
    parseSPP(path, prefixes);
    return true;
  } catch (e) {
    return false;
  }
};

export const parseSPP = (path: string, prefixes: Prefixes) => {
  return toParseResult(path, prefixes);
};

const quantSymbolToShaclProp = (symbol: '*' | '+' | '?'): string =>
  ({
    '?': sh.zeroOrOnePath,
    '*': sh.zeroOrMorePath,
    '+': sh.oneOrMorePath,
  }[symbol]);

const toShaclPathObj = (parseResult: ParseResult, withPref: VocabHandler['usePrefix']): any => {
  if (itemIsNamedNode(parseResult)) {
    return idNode(parseResult.value);
  }
  switch (parseResult.pathType) {
    case '^':
      return { [withPref(sh.inversePath)]: toShaclPathObj(parseResult.items[0], withPref) };
    case '/':
      return { '@list': parseResult.items.map((i) => toShaclPathObj(i, withPref)) };
    case '|':
      return {
        [withPref(sh.inversePath)]: { '@list': parseResult.items.map((i) => toShaclPathObj(i, withPref)) },
      };
    case '*':
    case '+':
    case '?':
      return {
        [withPref(quantSymbolToShaclProp(parseResult.pathType))]: toShaclPathObj(
          parseResult.items[0],
          withPref,
        ),
      };
    case '!':
      throw new Error('SPARQL "!" Path not supported');
    default:
      throw new Error('PathType not implemented');
  }
};

export const sppToShaclPath = (path: string, vocabHandler: VocabHandler) => {
  try {
    const parseResult = parseSPP(path, vocabHandler.prefixes);
    const shaclObj = toShaclPathObj(parseResult, vocabHandler.usePrefix);
    return shaclObj;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};
