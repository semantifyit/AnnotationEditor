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
import { expandTemplateProp, expandUsedActionTemplates } from './webApi';
import { sppToShaclPath } from './sparqlPP.js';

const { wasa, sh, schema, xsd } = p;

const withAtVocab = (pref: VocabHandler['prefixes']): VocabHandler['prefixes'] => {
  const newPrefixes = clone(pref);
  if (newPrefixes['']) {
    newPrefixes['@vocab'] = newPrefixes[''];
    delete newPrefixes[''];
  }
  return newPrefixes;
};
export const idNode = (s: string) => ({ '@id': s });

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
const tempPropToShaclProp = (baseUrl: string, vocabHandler: VocabHandler, group?: 'input' | 'output') => (
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

  if (prop.nodeKind) {
    shProp[usePref(sh.nodeKind)] = idNode(prop.nodeKind);
  }

  // prop values same as sh prop value
  let oneToOneProps = [
    'name',
    'description',
    'defaultValue',
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
      shProp[usePref(joinNS('sh', p))] = prop[p]?.map((v) =>
        v.startsWith('SPARQL') ? sppToShaclPath(v.replace(/^SPARQL/, ''), vocabHandler) : idNode(v),
      );
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
        [usePref(sh.property)]: range.props.map((p) => tempPropToShaclProp(baseUrl, vocabHandler)(p)),
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

const pathToSPP = (path: string[]): string => path.map((p) => `<${p}>`).join('/');

const potentialActionLinkToAnn = (
  baseUrl: string,
  link: ActionLink,
  actionId: string,
  vocabHandler: VocabHandler,
) => {
  const iterator = link.iterator && link.iterator.path.length > 0 ? pathToSPP(link.iterator.path) : undefined;
  return {
    '@id': `${baseUrl}/actionlink/${link.id}`,
    '@type': wasa.PotentialActionLink,
    [vocabHandler.usePrefix(wasa.source)]: idNode(`${baseUrl}/action/${actionId}`),
    [vocabHandler.usePrefix(wasa.target)]: idNode(`${baseUrl}/action/${link.actionId}`),
    [vocabHandler.usePrefix(wasa.propertyMapping)]:
      link.propertyMaps.length > 0
        ? propertyMappingToAnn(link.propertyMaps, vocabHandler, iterator)
        : undefined,
    [vocabHandler.usePrefix(wasa.iterator)]: iterator,
    [vocabHandler.usePrefix(wasa.condition)]: link.condition
      ? {
          '@type': vocabHandler.usePrefix(
            link.condition.type === 'javascript' ? wasa.JavaScriptImplementation : wasa.SPARQLImplementation,
          ),
          [vocabHandler.usePrefix(wasa.script)]: link.condition.value,
        }
      : undefined,
  };
};

const precedingActionLinkToAnn = (
  baseUrl: string,
  link: ActionLink,
  actionId: string,
  vocabHandler: VocabHandler,
) => ({
  '@id': `${baseUrl}/actionlink/${link.id}`,
  '@type': wasa.PrecedingActionLink,
  [vocabHandler.usePrefix(wasa.source)]: idNode(`${baseUrl}/action/${link.actionId}`),
  [vocabHandler.usePrefix(wasa.target)]: idNode(`${baseUrl}/action/${actionId}`),
  [vocabHandler.usePrefix(wasa.propertyMapping)]: propertyMappingToAnn(link.propertyMaps, vocabHandler),
});

const propertyMappingToAnn = (
  pmaps: ActionLink['propertyMaps'],
  vocabHandler: VocabHandler,
  iteratorPath?: string,
) =>
  pmaps.map((pmap) => ({
    '@type': wasa.PropertyMap,
    [vocabHandler.usePrefix(wasa.from)]: pathToSPP(pmap.from.path).replace(
      new RegExp(`^${iteratorPath}/`),
      '',
    ),
    [vocabHandler.usePrefix(wasa.to)]: pathToSPP(pmap.to.path),
  }));

const actionIdToNodeId = (baseUrl: string, id: string): string => `${baseUrl}/action/${id}`;

export const actionToAnnotation = (
  baseUrl: string,
  action: Action,
  vocabHandler: VocabHandler,
  templates: Template[],
): string => {
  const withPref = vocabHandler.usePrefix;

  const expandedActionAnnSrc = expandUsedActionTemplates(action.annotationSrc, templates);
  const annotation = annSrcToAnnJsonLd(expandedActionAnnSrc, vocabHandler);
  annotation['@id'] = actionIdToNodeId(baseUrl, action.id);

  annotation[vocabHandler.usePrefix(wasa.actionShape)] = {
    '@type': p.shNodeShape,
    [withPref(p.shProperty)]: [
      ...expandedActionAnnSrc.input.map(tempPropToShaclProp(baseUrl, vocabHandler, 'input')),
      ...expandedActionAnnSrc.output.map(tempPropToShaclProp(baseUrl, vocabHandler, 'output')),
    ],
  };

  if (action.potentialActionLinks.length > 0) {
    annotation[vocabHandler.usePrefix(wasa.potentialActionLink)] = action.potentialActionLinks.map((link) =>
      potentialActionLinkToAnn(baseUrl, link, action.id, vocabHandler),
    );
  }

  if (action.precedingActionLinks.length > 0) {
    annotation[vocabHandler.usePrefix(wasa.precedingActionLink)] = action.precedingActionLinks.map((link) =>
      precedingActionLinkToAnn(baseUrl, link, action.id, vocabHandler),
    );
  }

  return JSON.stringify(annotation);
};

export const webApiToAnnotation = (baseUrl: string, webApi: WebApi, vocabHandler: VocabHandler): string => {
  const annotation = annSrcToAnnJsonLd(webApi.annotationSrc, vocabHandler);
  annotation['@id'] = `${baseUrl}/webapi/${webApi.id}`;

  // add actions as ids
  if (annotation[vocabHandler.usePrefix('http://schema.org/documentation')]) {
    annotation[vocabHandler.usePrefix('http://schema.org/documentation')][
      vocabHandler.usePrefix('http://schema.org/about')
    ] = webApi.actions.filter((a) => a.isActive).map((a) => idNode(actionIdToNodeId(baseUrl, a.id)));
  }

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
  if (annSrc.nodeId) {
    ann['@id'] = annSrc.nodeId;
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

export const templateToAnnotation = (
  baseUrl: string,
  template: Template,
  vocabHandler: VocabHandler,
  templates: Template[],
): string => {
  template.src.props.map((p) => expandTemplateProp(p, templates));

  return JSON.stringify({
    '@id': `${baseUrl}/template/${template.id}`,
    '@type': p.shNodeShape,
    [vocabHandler.usePrefix(p.shProperty)]: template.src.props
      .map((p) => expandTemplateProp(p, templates))
      .map(tempPropToShaclProp(baseUrl, vocabHandler)),
  });
};

export const actionLinksToAnnotation = (
  baseUrl: string,
  actionLinks: ActionLink[],
  actionId: string,
  type: 'preceeding' | 'potential',
  vocabHandler: VocabHandler,
): string =>
  JSON.stringify(
    actionLinks.map((link) =>
      (type === 'preceeding' ? precedingActionLinkToAnn : potentialActionLinkToAnn)(
        baseUrl,
        link,
        actionId,
        vocabHandler,
      ),
    ),
  );
