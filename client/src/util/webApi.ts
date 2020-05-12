import uuid from 'uuid/v1';

import {
  WebApi,
  Action,
  Template,
  RessourceDescProp,
  TemplateProperty,
  DefaultRessourceDesc,
  TemplateRessourceDesc,
  TemplatePropertyGroupType,
  ActionRessourceDesc,
  ExpendedActionRessourceDesc,
  ExpandedTemplateProperty,
  ExpandedTemplateRessourceDesc,
} from '../../../server/src/models/WebApi';
import { fromArray, toArray, stringOrNil, clone } from './utils';
import VocabHandler, { unUsePrefix } from './VocabHandler';
import * as p from './rdfProperties';
import { joinNS } from './rdfProperties';

const { commonNamespaces, wasa, sh, schema, xsd } = p;

// TODO default schema.org vocab ObjectId("5db83278871c4f3b742776f7")

const defaultVocabsIds: string[] = [];

const sameNameBracket = (numSameName: number): string => `${numSameName !== 0 ? ` (${numSameName})` : ''}`;

export const defaultNewActionName = 'New Action';

const ioTemplateProps = {
  input: 'http://schema.org/object',
  output: 'http://schema.org/result',
};

export const newIOTemplateProp = (io: TemplatePropertyGroupType): TemplateProperty =>
  newTemplateProp(ioTemplateProps[io], io);

export const newTemplateProp = (prop: string, io: TemplatePropertyGroupType): TemplateProperty => ({
  type: 'template',
  id: uuid(),
  path: prop,
  io: io,
  range: [
    {
      type: 'template',
      types: ['http://schema.org/Thing'],
      props: [],
    },
  ],
  required: true,
  multAllowed: false,
  minCount: 1,
  maxCount: 1,
});

const newSchemaTextNode = (
  prop: string,
  val: string,
  state?: Action['annotationSrc']['props'][number]['state'],
): Action['annotationSrc']['props'][number] => ({
  type: 'annotation',
  id: uuid(),
  path: `http://schema.org/${prop}`,
  range: 'http://schema.org/Text',
  val,
  state,
});

export const createEmptyAction = (numSameName: number, webApiId: string): Action => {
  const name = `${defaultNewActionName}${sameNameBracket(numSameName)}`;
  const actionId = uuid();
  return {
    id: actionId,
    name,
    annotation: '{}',
    annotationSrc: {
      type: 'action',
      types: ['http://schema.org/Action'],
      props: [
        newSchemaTextNode('name', name, 'unremovable'),
        newSchemaTextNode('description', ''),
        {
          type: 'annotation',
          id: uuid(),
          path: 'http://schema.org/target',
          val: {
            type: 'annotation',
            types: ['http://schema.org/EntryPoint'],
            props: [
              newSchemaTextNode('httpMethod', 'POST', 'disabled'),
              newSchemaTextNode('contentType', 'application/ld+json', 'disabled'),
              newSchemaTextNode('encodingType', 'application/ld+json', 'disabled'),
              newSchemaTextNode(
                'urlTemplate',
                `https://actions.semantify.it/api/action/${webApiId}/${actionId}`,
                'disabled',
              ),
            ],
          },
          range: 'http://schema.org/EntryPoint',
          state: 'unremovable',
        },
      ],
      input: [newIOTemplateProp('input')],
      output: [newIOTemplateProp('output')],
    },
    requestMapping: {
      isValid: true,
      method: 'GET',
      url: { type: 'handlebars', value: 'http://example.com' },
      headers: { type: 'handlebars', value: '{\n\t"Content-Type": "text/plain"\n}' },
      body: {
        type: 'handlebars',
        value: '',
      },
    },
    responseMapping: {
      isValid: true,
      addToResult: true,
      autoError: true,
      autoStatus: true,
      body: {
        type: 'yarrrml',
        value:
          'prefixes:\n  schema: "http://schema.org/"\n  myfunc: "http://myfunc.com/"\nmappings:\n  result:\n    sources:\n      - ["input~jsonpath", "$.*"]\n    po:\n      - [a, schema:Thing]\n      - [schema:name, "example"]\n',
      },
    },
    potentialActionLinks: [],
    precedingActionLinks: [],
    sampleAction: JSON.stringify(
      {
        '@context': { '@vocab': 'http://schema.org/' },
        '@type': 'Action',
        actionStatus: 'http://schema.org/ActiveActionStatus',
        name: 'foo',
      },
      null,
      2,
    ),
    sampleResponse: '',
  };
};

export const defaultNewTemplateName = 'New Template';

export const createEmptyTemplate = (numSameName: number): Template => ({
  id: uuid(),
  name: `${defaultNewTemplateName}${sameNameBracket(numSameName)}`,
  src: { type: 'template', types: [], props: [] },
});

export const createEmptyWebApi = (): WebApi => {
  const webApiId = uuid();
  return {
    id: webApiId,
    name: 'New WebAPI',
    author: 'Me',
    annotation: '{}',
    annotationSrc: {
      type: 'annotation',
      types: ['http://schema.org/WebAPI'],
      props: [
        newSchemaTextNode('name', 'New WebAPI', 'unremovable'),
        newSchemaTextNode('description', ''),
        {
          type: 'annotation',
          id: uuid(),
          path: 'http://schema.org/documentation',
          range: 'http://schema.org/CreativeWork',
          val: {
            type: 'annotation',
            types: ['http://schema.org/CreativeWork'],
            props: [
              newSchemaTextNode('name', 'Documentation', 'unremovable'),
              newSchemaTextNode('url', '', 'unremovable'),
              newSchemaTextNode('encodingFormat', '', 'unremovable'),
              newSchemaTextNode('version', '', 'unremovable'),
            ],
          },
          state: 'unremovable',
        },
      ],
    },
    actions: [createEmptyAction(0, webApiId)],
    vocabs: defaultVocabsIds,
    prefixes: {
      '': commonNamespaces.schema,
      sh: commonNamespaces.sh,
      wasa: commonNamespaces.wasa,
    },
    config: {
      useMapping: true,
      showCodeEditor: false,
    },
    templates: [],
  };
};

export const getNameOfAnnotation = (ann: DefaultRessourceDesc): string =>
  stringOrNil(ann.props.filter(isAnnotationSrcProp).find((p) => p.path === 'http://schema.org/name')?.val) ??
  '';

export const getNameOfAction = (action: Action): string => getNameOfAnnotation(action.annotationSrc);

export const getNameOfWebApi = (webApi: WebApi): string => getNameOfAnnotation(webApi.annotationSrc);

export const setNameOfAction = (action: Action, str: string) => {
  const prop = action.annotationSrc.props
    .filter(isAnnotationSrcProp)
    .find((p) => p.path === 'http://schema.org/name');
  if (prop) {
    prop.val = str;
  }
};

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
  const expandedActionAnnSrc = expandUsedActionTemplates(action.annotationSrc, templates);
  const annotation = annSrcToAnnJsonLd(expandedActionAnnSrc, vocabHandler);

  annotation[vocabHandler.usePrefix(wasa.actionShape)] = {
    '@type': p.shNodeShape,
    [vocabHandler.usePrefix(p.shProperty)]: [
      ...expandedActionAnnSrc.input.map(tempPropToShaclProp(vocabHandler, 'input')),
      ...expandedActionAnnSrc.output.map(tempPropToShaclProp(vocabHandler, 'output')),
    ],
  };

  console.log(annotation);

  return JSON.stringify(annotation);
};

export const webApiToAnnotation = (webApi: WebApi, vocabHandler: VocabHandler): string => {
  const annotation = annSrcToAnnJsonLd(webApi.annotationSrc, vocabHandler);
  // TODO add action links in schema:about
  return JSON.stringify(annotation);
};

export const annSrcToAnnJsonLd = (
  annSrc: DefaultRessourceDesc,
  vocabHandler: VocabHandler,
  withContext = true,
): Annotation => {
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
export const annJsonLDToAnnSrc = (annSrc: Annotation, vocabHandler: VocabHandler): DefaultRessourceDesc => {
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

export const isTemplateProp = (prop: RessourceDescProp | TemplateProperty): prop is TemplateProperty =>
  prop.type === 'template';

export const isAnnotationSrcProp = (prop: RessourceDescProp | TemplateProperty): prop is RessourceDescProp =>
  prop.type === 'annotation';

export const dsToTemplate = (ds: any): TemplateRessourceDesc =>
  dsPartToTemplate(ds['@graph'][0], ds['@graph'][0]['sh:targetClass'], ds['@context']);

export const dsPartToTemplate = (ds: any, classes: any, prefixes: any): TemplateRessourceDesc => ({
  type: 'template',
  types: toArray(classes).map((s) => unUsePrefix(s, prefixes)),
  props: ds['sh:property'].map((prop: any) => ({
    type: 'template',
    id: uuid(),
    path: unUsePrefix(prop['sh:path'], prefixes),
    range: prop['sh:or'].map((r: any) =>
      r['sh:node']
        ? dsPartToTemplate(r['sh:node'], r['sh:class'], prefixes)
        : { type: 'template', types: [unUsePrefix(r['sh:datatype'] || r['sh:class'], prefixes)], props: [] },
    ),
    required: prop['sh:minCount'] > 0,
    multAllowed: prop['sh:maxCount'] ? prop['sh:maxCount'] > 1 : true,
    minCount: prop['sh:minCount'],
    maxCount: prop['sh:maxCount'],
  })),
});

export const expandUsedActionTemplates = (
  ann: ActionRessourceDesc,
  templates: Template[],
): ExpendedActionRessourceDesc => ({
  ...ann,
  input: ann.input?.map((t) => expandTemplateProp(t, templates)),
  output: ann.output?.map((t) => expandTemplateProp(t, templates)),
});

export const expandTemplateRessource = (
  template: TemplateRessourceDesc,
  templates: Template[],
): ExpandedTemplateRessourceDesc => ({
  ...template,
  props: template.props.map((prop) => expandTemplateProp(prop, templates)),
});

export const expandTemplateProp = (
  prop: TemplateProperty,
  templates: Template[],
): ExpandedTemplateProperty => {
  return {
    ...prop,
    range: prop.range.map((range) => {
      if ('templateId' in range) {
        const template = templates.find((template) => template.id === range.templateId);
        if (!template) {
          throw new Error(`Template <${range.templateId}> not found`);
        }
        return expandTemplateRessource(template.src, templates);
      }
      return expandTemplateRessource(range, templates);
    }),
  };
};

// export const replaceAnnotationTemplates = (
//   annotation: AnnotationSrc,
//   templates: Template[],
// ): ExpandedTemplate => {
//   const src = clone(annotation);
//   src.props =

//   return src;
// };
