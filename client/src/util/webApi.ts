import uuid from 'uuid/v1';

import {
  Action,
  ActionRessourceDesc,
  DefaultRessourceDesc,
  ExpandedTemplateProperty,
  ExpandedTemplateRessourceDesc,
  ExpendedActionRessourceDesc,
  RessourceDescProp,
  Template,
  TemplateProperty,
  TemplatePropertyGroupType,
  TemplateRessourceDesc,
  WebApi,
} from '../../../server/src/models/WebApi';
import { stringOrNil, toArray } from './utils';
import { unUsePrefix } from './VocabHandler';
import * as p from './rdfProperties';
import { EnrichedWebApi } from '../../../server/src/util/webApi';

const { commonNamespaces } = p;

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

const newTerminalNode = (range: string) => (
  prop: string,
  val: string,
  state?: Action['annotationSrc']['props'][number]['state'],
): Action['annotationSrc']['props'][number] => ({
  type: 'annotation',
  id: uuid(),
  path: `http://schema.org/${prop}`,
  range,
  val,
  state,
});

const newSchemaTextNode = newTerminalNode('http://schema.org/Text');

export const createEmptyAction = (numSameName: number, webApiId: string, baseUrl: string): Action => {
  const name = `${defaultNewActionName}${sameNameBracket(numSameName)}`;
  const actionId = uuid();
  return {
    id: actionId,
    isActive: false,
    name,
    annotation: '{}',
    annotationSrc: {
      type: 'action',
      types: ['http://schema.org/Action'],
      props: [
        newSchemaTextNode('name', name, 'unremovable'),
        newSchemaTextNode('description', ''),
        newTerminalNode('http://schema.org/ActionStatusType')(
          'actionStatus',
          'http://schema.org/PotentialActionStatus',
          'disabled',
        ),
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
              newSchemaTextNode('urlTemplate', `${baseUrl}/api/action/${webApiId}/${actionId}`, 'disabled'),
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
        value: `prefixes:
  schema: "http://schema.org/"
  wasaFunc: "http://actions.semantify.it/wasa/func/"
mappings:
  action:
    sources:
      - ["input~jsonpath", "$"]
    po:
      - [a, schema:Action]
      - [schema:actionStatus, "http://schema.org/CompletedActionStatus"]
      - [schema:result, {mapping: result}]
      
  result:
    sources:
      - ["input~jsonpath", "$"]
    po:
      - [a, schema:Thing]
      - [schema:name, "$(example)"]
      - [schema:alternateName, {fn: wasaFunc:toUpper, pms: ["$(example)"]}]
`,
      },
    },
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
    sampleResponse: `{
  "example": "hello world"
}`,
  };
};

export const defaultNewTemplateName = 'New Template';

export const createEmptyTemplate = (numSameName: number): Template => ({
  id: uuid(),
  name: `${defaultNewTemplateName}${sameNameBracket(numSameName)}`,
  src: { type: 'template', types: [], props: [] },
});

export const createEmptyWebApi = (baseUrl: string): WebApi => {
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
              newSchemaTextNode('url', `${baseUrl}/${webApiId}`, 'disabled'),
              newSchemaTextNode('encodingFormat', 'application/ld+json', 'unremovable'),
              newSchemaTextNode('version', '1.0.0', 'unremovable'),
            ],
          },
          state: 'unremovable',
        },
      ],
    },
    actions: [createEmptyAction(0, webApiId, baseUrl)],
    vocabs: defaultVocabsIds,
    prefixes: {
      '': commonNamespaces.schema,
      sh: commonNamespaces.sh,
      wasa: commonNamespaces.wasa,
    },
    config: {
      useMapping: true,
      handlebars: {
        functions: `Handlebars.registerHelper('toUpper', function (val) {
  return val.toUpperCase();
});
`,
      },
      xquery: {
        functions: `registerCustomXPathFunction('fn:toUpper', ['xs:string'], 'xs:string', (_, val) => {
  return val.toUpperCase();
});
`,
        /*
registerXQueryModule(
`module namespace s = "https://module.com/";
declare %public function s:toUpper($val as xs:string)
as xs:string
{
    fn:upper-case($val)
};`);
*/
      },
      javascript: {
        functions: `function toUpper(val) {
  return val.toUpperCase();
}
`,
      },
      rml: {
        functions: `function toUpper([val]) {
  return val.toUpperCase();
}

registerFunction('toUpper', toUpper);
`,
        xpathLib: 'default',
      },
    },
    templates: [],
  };
};
//foo

export const getPropOfAnnotation = (prop: string) => (ann: DefaultRessourceDesc): string =>
  stringOrNil(ann.props.filter(isAnnotationSrcProp).find((p) => p.path === prop)?.val) ?? '';

export const getNameOfAnnotation = getPropOfAnnotation('http://schema.org/name');
export const getDescriptionOfAnnotation = getPropOfAnnotation('http://schema.org/description');

export const getNameOfAction = (action: Action): string => getNameOfAnnotation(action.annotationSrc);

export const getNameOfWebApi = (webApi: WebApi | EnrichedWebApi): string =>
  getNameOfAnnotation(webApi.annotationSrc);
export const getDescriptionOfWebApi = (webApi: WebApi | EnrichedWebApi): string =>
  getDescriptionOfAnnotation(webApi.annotationSrc);

export const setNameOfAction = (action: Action, str: string) => {
  const prop = action.annotationSrc.props
    .filter(isAnnotationSrcProp)
    .find((p) => p.path === 'http://schema.org/name');
  if (prop) {
    prop.val = str;
  }
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
