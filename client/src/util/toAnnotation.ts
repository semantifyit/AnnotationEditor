import {
  Action,
  ActionLink,
  DefaultRessourceDesc,
  ExpandedTemplateProperty,
  Template,
  WebApi,
} from '../../../server/src/models/WebApi';
import VocabHandler from './VocabHandler';
import { clone, fromArray, toArray } from './utils';
import uuid from 'uuid/v1';
import * as p from './rdfProperties';
import { joinNS } from './rdfProperties';
import { expandUsedActionTemplates } from './webApi';

const { commonNamespaces, wasa, sh, schema, xsd } = p;

const withAtVocab = (pref: VocabHandler['prefixes']): VocabHandler['prefixes'] => {
  const newPrefixes = clone(pref);
  if (newPrefixes['']) {
    newPrefixes['@vocab'] = newPrefixes[''];
    delete newPrefixes[''];
  }
  return newPrefixes;
};
const idNode = (s: string) => ({ '@id': s });
const baseUrl = 'http://actions.semantify.it/rdf';
const toDataType = (s: string): string =>
  ({
    [schema.Text]: xsd.string,
    [schema.Boolean]: xsd.boolean,
    [schema.Date]: xsd.date,
    [schema.DateTime]: xsd.dateTime,
    [schema.Time]: xsd.time,
    [schema.Number]: xsd.double,
    [schema.Float]: xsd.float,
    [schema.Integer]: xsd.integer,
    [schema.URL]: xsd.anyURI,
  }[s] || s);
const tempPropToShaclProp = (vocabHandler: VocabHandler, group?: 'input' | 'output') => (
  prop: ExpandedTemplateProperty,
) => {
  const usePref = vocabHandler.usePrefix;

  const shProp: any = {
    '@id': `${baseUrl}/prop/${prop.id}`,
    [usePref(sh.path)]: idNode(prop.path),
  };

  if (group) {
    shProp[usePref(sh.group)] = idNode(group === 'input' ? wasa.Input : wasa.Output);
  }
  console.log(wasa.Input);

  if (prop.nodeKind) {
    shProp[usePref(sh.nodeKind)] = idNode(prop.nodeKind);
  }

  // prop values same as sh prop value
  let oneToOneProps = [
    'minCount',
    'maxCount',
    'minExclusive',
    'minInclusive',
    'maxExclusive',
    'maxInclusive',
    'minLength',
    'maxLength',
    'pattern',
    'hasValue',
  ] as const;
  oneToOneProps.forEach((p) => {
    if (prop[p]) {
      shProp[usePref(joinNS('sh', p))] = prop[p];
    }
  });

  if (prop.in) {
    shProp[usePref(sh.in)] = { '@list': prop.in };
  }

  let pairProps = ['equals', 'disjoint', 'lessThan', 'lessThanOrEquals'] as const;
  pairProps.forEach((p) => {
    if (prop[p]) {
      shProp[usePref(joinNS('sh', p))] = prop[p]?.map(idNode);
    }
  });

  const ranges = prop.range.map((range) => {
    if (range.types.length === 1 && vocabHandler.isTerminalNode(range.types[0])) {
      return { [usePref(sh.datatype)]: toDataType(range.types[0]) };
    }
    const classNode: any = {
      [usePref(sh.class)]: range.types.map(idNode),
    };

    if (range.props.length > 0) {
      classNode[usePref(sh.node)] = {
        [usePref(sh.property)]: range.props.map((p) => tempPropToShaclProp(vocabHandler)(p)),
      };
    }

    return classNode;
  });

  return ranges.length > 1
    ? {
        ...shProp,
        [usePref(sh.or)]: ranges,
      }
    : { ...shProp, ...ranges[0] };
};
export const actionToAnnotation = (
  action: Action,
  vocabHandler: VocabHandler,
  templates: Template[],
): string => {
  const withPref = vocabHandler.usePrefix;

  const expandedActionAnnSrc = expandUsedActionTemplates(action.annotationSrc, templates);
  const annotation = annSrcToAnnJsonLd(expandedActionAnnSrc, vocabHandler);
  annotation['@id'] = `${baseUrl}/action/${action.id}`;

  annotation[vocabHandler.usePrefix(wasa.actionShape)] = {
    '@type': p.shNodeShape,
    [withPref(p.shProperty)]: [
      ...expandedActionAnnSrc.input.map(tempPropToShaclProp(vocabHandler, 'input')),
      ...expandedActionAnnSrc.output.map(tempPropToShaclProp(vocabHandler, 'output')),
    ],
  };

  const makePropertyMapping = (pmaps: ActionLink['propertyMaps']) =>
    pmaps.map((pmap) => ({
      '@type': wasa.PropertyMap,
      [withPref(wasa.from)]: pmap.from.path.map((p) => `<${p}>`).join('/'),
      [withPref(wasa.to)]: pmap.to.path.map((p) => `<${p}>`).join('/'),
    }));

  if (action.potentialActionLinks.length > 0) {
    annotation[vocabHandler.usePrefix(wasa.potentialActionLink)] = action.potentialActionLinks.map(
      (link) => ({
        '@id': `${baseUrl}/actionlink/${link.id}`,
        '@type': wasa.PotentialActionLink,
        [withPref(wasa.source)]: idNode(`${baseUrl}/action/${action.id}`),
        [withPref(wasa.target)]: idNode(`${baseUrl}/action/${link.actionId}`),
        [withPref(wasa.propertyMapping)]: makePropertyMapping(link.propertyMaps),
      }),
    );
  }

  if (action.precedingActionLinks.length > 0) {
    annotation[vocabHandler.usePrefix(wasa.precedingActionLink)] = action.precedingActionLinks.map(
      (link) => ({
        '@id': `${baseUrl}/actionlink/${link.id}`,
        '@type': wasa.PrecedingActionLink,
        [withPref(wasa.source)]: idNode(`${baseUrl}/action/${link.actionId}`),
        [withPref(wasa.target)]: idNode(`${baseUrl}/action/${action.id}`),
        [withPref(wasa.propertyMapping)]: makePropertyMapping(link.propertyMaps),
      }),
    );
  }

  console.log(annotation);

  return JSON.stringify(annotation);
};
export const webApiToAnnotation = (webApi: WebApi, vocabHandler: VocabHandler): string => {
  const annotation = annSrcToAnnJsonLd(webApi.annotationSrc, vocabHandler);
  annotation['@id'] = `${baseUrl}/webapi/${webApi.id}`;
  // TODO add action links in schema:about
  return JSON.stringify(annotation);
};
export const annSrcToAnnJsonLd = (
  annSrc: DefaultRessourceDesc,
  vocabHandler: VocabHandler,
  withContext = true,
) => {
  const ann: any = {};
  if (withContext) {
    ann['@context'] = withAtVocab(vocabHandler.prefixes); // set @vocab empty prefix
  }
  ann['@type'] = fromArray(annSrc.types.map(vocabHandler.usePrefix));
  annSrc.props.forEach((prop) => {
    if (prop.type === 'annotation') {
      ann[vocabHandler.usePrefix(prop.path)] =
        typeof prop.val === 'string' ? prop.val : annSrcToAnnJsonLd(prop.val, vocabHandler, false);
    }
  });

  // console.log(annSrc.types);
  // console.log(ann);
  return ann;
};
// DEPRECATED
export const annJsonLDToAnnSrc = (annSrc: any, vocabHandler: VocabHandler): DefaultRessourceDesc => {
  const ann = {} as any;
  ann.types = toArray(annSrc['@type']).map(vocabHandler.unUsePrefix);

  ann.props = Object.entries(annSrc)
    .filter(([key]) => !['@type', '@id', '@context'].includes(key))
    .flatMap(([key, value]) =>
      toArray(value).map((val) => ({
        id: uuid(),
        key: vocabHandler.unUsePrefix(key),
        range:
          vocabHandler
            .getRanges(vocabHandler.unUsePrefix(key))
            .find((range) =>
              typeof val === 'string'
                ? vocabHandler.isTerminalNode(range)
                : !vocabHandler.isTerminalNode(range),
            ) ||
          console.log(
            'no range found',
            key,
            value,
            vocabHandler.isTerminalNode(vocabHandler.getRanges(vocabHandler.unUsePrefix(key))[0]),
          ),
        val: typeof val === 'string' ? val : annJsonLDToAnnSrc(val, vocabHandler),
      })),
    );
  return ann;
};
