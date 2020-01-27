import uuid from 'uuid/v1';

import {
  WebApi,
  Action,
  WebApiAnnotation,
  ActionAnnotation,
  AnnotationSrc,
  Annotation,
  Template,
  AnnotationSrcProp,
  TemplateProperty,
  // AnnotationSrcProp,
} from '../../../server/src/models/WebApi';
import { fromArray, toArray, stringOrNil } from './utils';
import VocabHandler, { unUsePrefix } from './VocabHandler';

// TODO default schema.org vocab ObjectId("5db83278871c4f3b742776f7")

const defaultVocabsIds = ['5db83278871c4f3b742776f7', '5dc2abe94c377c586007db35', '5dbffa643c467a707677dcb0'];

const sameNameBracket = (numSameName: number): string => `${numSameName !== 0 ? ` (${numSameName})` : ''}`;

export const defaultNewActionName = 'New Action';

export const createEmptyAction = (numSameName: number): Action => ({
  path: uuid(),
  annotation: ({
    '@context': { '@vocab': 'http://schema.org/' },
    '@type': 'Action',
    name: `${defaultNewActionName}${sameNameBracket(numSameName)}`,
  } as unknown) as ActionAnnotation,
  annotationSrc: {
    types: ['http://schema.org/Action'],
    props: [
      {
        type: 'annotation',
        id: uuid(),
        path: 'http://schema.org/name',
        val: `${defaultNewActionName}${sameNameBracket(numSameName)}`,
        range: 'http://schema.org/Text',
      },
    ],
  },
  requestMapping: {
    isValid: true,
    type: 'json',
    method: 'GET',
    url: '',
    path: '[]',
    query: '{}',
    headers: '{}',
    body: '{}',
  },
  responseMapping: {
    isValid: true,
    type: 'json',
    headers: '{}',
    body: '{}',
  },
});

export const defaultNewTemplateName = 'New Template';

export const createEmptyTemplate = (numSameName: number): Template => ({
  id: uuid(),
  name: `${defaultNewTemplateName}${sameNameBracket(numSameName)}`,
  src: { type: 'template', types: [], props: [] },
});

export const createEmptyWebApi = (): WebApi => ({
  path: uuid(),
  author: 'Me',
  annotation: ({
    '@context': { '@vocab': 'http://schema.org/' },
    '@type': 'WebAPI',
    name: 'New WebAPI',
  } as unknown) as WebApiAnnotation,
  annotationSrc: {
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
  actions: [createEmptyAction(0)],
  vocabs: defaultVocabsIds,
  context: {
    '@vocab': 'http://schema.org/',
  },
  config: {
    useMapping: true,
    showCodeEditor: true,
  },
  templates: [],
});

export const getNameOfAction = (action: Action): string =>
  stringOrNil(
    action.annotationSrc.props.filter(isAnnotationSrcProp).find((p) => p.path === 'http://schema.org/name')
      ?.val,
  ) ?? '';

export const setNameOfAction = (action: Action, str: string) => {
  const prop = action.annotationSrc.props
    .filter(isAnnotationSrcProp)
    .find((p) => p.path === 'http://schema.org/name');
  if (prop) {
    prop.val = str;
  }
};

export const annSrcToAnnJsonLd = (
  annSrc: AnnotationSrc,
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

export const annJsonLDToAnnSrc = (annSrc: Annotation, vocabHandler: VocabHandler): AnnotationSrc => {
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

export const isTemplateProp = (prop: AnnotationSrcProp | TemplateProperty): prop is TemplateProperty =>
  prop.type === 'template';

export const isAnnotationSrcProp = (prop: AnnotationSrcProp | TemplateProperty): prop is AnnotationSrcProp =>
  prop.type === 'annotation';

export const dsToTemplate = (ds: any): AnnotationSrc =>
  dsPartToTemplate(ds['@graph'][0], ds['@graph'][0]['sh:targetClass'], ds['@context']);

export const dsPartToTemplate = (ds: any, classes: any, context: any): AnnotationSrc => ({
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
