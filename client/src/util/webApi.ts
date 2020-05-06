import uuid from 'uuid/v1';

import {
  WebApi,
  Action,
  WebApiAnnotation,
  ActionAnnotation,
  Annotation,
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
  // AnnotationSrcProp,
} from '../../../server/src/models/WebApi';
import { fromArray, toArray, stringOrNil } from './utils';
import VocabHandler, { unUsePrefix } from './VocabHandler';

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
    annotation: ({
      '@context': { '@vocab': 'http://schema.org/' },
      '@type': 'Action',
      name,
    } as unknown) as ActionAnnotation,
    annotationSrc: {
      type: 'action',
      types: ['http://schema.org/Action'],
      props: [
        newSchemaTextNode('name', name, 'unremovable'),
        newSchemaTextNode('description', 'A sample description'),
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
    annotation: ({
      '@context': { '@vocab': 'http://schema.org/' },
      '@type': 'WebAPI',
      name: 'New WebAPI',
    } as unknown) as WebApiAnnotation,
    annotationSrc: {
      type: 'annotation',
      types: ['http://schema.org/WebAPI'],
      props: [
        {
          type: 'annotation',
          id: uuid(),
          path: 'http://schema.org/name',
          val: 'New WebAPI',
          range: 'http://schema.org/Text',
        },
      ],
    },
    actions: [createEmptyAction(0, webApiId)],
    vocabs: defaultVocabsIds,
    context: {
      '@vocab': 'http://schema.org/',
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

export const annSrcToAnnJsonLd = (
  annSrc: DefaultRessourceDesc,
  vocabHandler: VocabHandler,
  withContext = true,
): Annotation => {
  const ann: any = {};
  if (withContext) {
    ann['@context'] = vocabHandler.prefix;
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

export const dsPartToTemplate = (ds: any, classes: any, context: any): TemplateRessourceDesc => ({
  type: 'template',
  types: toArray(classes).map((s) => unUsePrefix(s, context)),
  props: ds['sh:property'].map((prop: any) => ({
    type: 'template',
    id: uuid(),
    path: unUsePrefix(prop['sh:path'], context),
    range: prop['sh:or'].map((r: any) =>
      r['sh:node']
        ? dsPartToTemplate(r['sh:node'], r['sh:class'], context)
        : { type: 'template', types: [unUsePrefix(r['sh:datatype'] || r['sh:class'], context)], props: [] },
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
