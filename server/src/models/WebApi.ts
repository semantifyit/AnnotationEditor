import mongoose, { Schema } from 'mongoose';

import { MongoDoc, MongoLeanDoc } from './helper';
import { LoweringConfig } from '../mapping/lowering/lowering';
import { LiftingConfig } from '../mapping/lifting/lifting';

export interface ActionRef {
  id: string;
  name: string;
  actions: {
    name: string;
    id: string;
    action?: Action;
  }[];
}
export type ActionRefs = ActionRef[];

export interface Template {
  id: string;
  name: string;
  baseType?: string;
  src: TemplateRessourceDesc;
}

export interface RessourceDescProp {
  type: 'annotation';
  id: string;
  path: string;
  val: string | RessourceDesc;
  range: string;
}

export type TemplatePropertyGroupType = 'input' | 'output';

export interface RangeTemplate {
  templateId: Template['id'];
}

export type TemplatePropertyRange = TemplateRessourceDesc | RangeTemplate;

export interface DefaultTemplateProperty {
  type: 'template';
  id: string;
  path: string;
  io?: TemplatePropertyGroupType; // only at top level?
  required: boolean;
  multAllowed: boolean;

  // shacl
  minCount?: number;
  maxCount?: number;

  minExclusive?: number;
  minInclusive?: number;
  maxExclusive?: number;
  maxInclusive?: number;

  minLength?: number;
  maxLength?: number;
  pattern?: string;

  equals?: string[];
  disjoint?: string[];
  lessThan?: string[];
  lessThanOrEquals?: string[];

  in?: string[];
  hasValue?: string[];
}

export interface TemplateProperty extends DefaultTemplateProperty {
  range: TemplatePropertyRange[];
}

export interface ExpandedTemplateProperty extends DefaultTemplateProperty {
  range: ExpandedTemplateRessourceDesc[];
}

export type SchaclRestrPairProps = 'equals' | 'disjoint' | 'lessThan' | 'lessThanOrEquals';
export type SchaclRestrOtherProps = 'in' | 'hasValue';

export type ShaclRestrProps =
  | SchaclRestrOtherProps
  | SchaclRestrPairProps
  | 'minCount'
  | 'maxCount'
  | 'minExclusive'
  | 'minInclusive'
  | 'maxExclusive'
  | 'maxInclusive'
  | 'minLength'
  | 'maxLength'
  | 'pattern';

export interface DefaultRessourceDesc {
  type: 'annotation' | 'action' | 'template';
  types: string[];
  props: (RessourceDescProp | TemplateProperty)[];
  input?: TemplateProperty[];
  output?: TemplateProperty[];
}

export interface RessourceDesc extends DefaultRessourceDesc {
  type: 'annotation';
  props: RessourceDescProp[];
}

export interface ActionRessourceDesc extends DefaultRessourceDesc {
  type: 'action';
  props: RessourceDescProp[];
  input: TemplateProperty[];
  output: TemplateProperty[];
}

export interface TemplateRessourceDesc extends DefaultRessourceDesc {
  type: 'template';
  props: TemplateProperty[];
}

export interface ExpandedTemplateRessourceDesc extends DefaultRessourceDesc {
  type: 'template';
  props: ExpandedTemplateProperty[];
}

export interface ExpendedActionRessourceDesc extends ActionRessourceDesc {
  input: ExpandedTemplateProperty[];
  output: ExpandedTemplateProperty[];
}

export interface AnnotationNode {
  '@type': string | string[];
  [prop: string]: any;
}

interface NamedAnnotationNode extends AnnotationNode {
  name: string | string[];
  description?: string | string[];
}

export interface Annotation extends NamedAnnotationNode {
  '@context': string | Record<string, string>;
}

interface WebApiDocumenation extends Omit<NamedAnnotationNode, 'name'> {
  url: string;
}

export interface WebApiAnnotation extends Annotation {
  documentation: WebApiDocumenation | WebApiDocumenation[];
}

export interface ActionAnnotation extends Annotation {
  target: {
    urlTemplate: string;
  };
}

export interface Mapping {
  value: string;
}

export interface LoweringMapping extends Mapping {
  type: LoweringConfig['type'];
}

export interface LiftingMapping extends Mapping {
  type: LiftingConfig['type'];
}

export interface RequestMappingSave {
  isValid: boolean;
  method: string;
  url: LoweringMapping;
  headers: LoweringMapping;
  body: LoweringMapping;
}

export interface ResponseMappingSave {
  isValid: boolean;
  addToResult: boolean;
  autoStatus: boolean;
  autoError: boolean;
  body: LiftingMapping;
}

export interface TemplatePath {
  id: string; // node-id
  path: string[]; // path
}

export interface PropertyMap {
  id: string;
  from: TemplatePath;
  to: TemplatePath;
}

export interface ActionLink {
  id: string;
  actionId: string;
  propertyMaps: PropertyMap[];
  iterator?: string;
}

export interface Action {
  id: string;
  name: string;
  annotation: ActionAnnotation;
  annotationSrc: ActionRessourceDesc;
  requestMapping: RequestMappingSave;
  responseMapping: ResponseMappingSave;
  functions?: string;
  potentialActionLinks: ActionLink[];
  preceedingActionLinks: ActionLink[];
  sampleAction: string;
  sampleResponse: string; // maybe string[]
}

export type WebApiDoc = MongoDoc<WebApi>;

export type WebApiLeanDoc = MongoLeanDoc<WebApi>;

export interface WebApi {
  id: string;
  name: string;
  author: string;
  annotation: WebApiAnnotation;
  annotationSrc: RessourceDesc;
  actions: Action[];
  functions?: string;
  vocabs: string[];
  context: Record<string, string>;
  config: WebApiConfig;
  templates: Template[];
}

export interface WebApiConfig {
  useMapping: boolean;
  showCodeEditor: boolean;
}

const WebApiSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    author: { type: String, required: true },
    annotation: { type: Object, required: true },
    annotationSrc: { type: Object, required: true },
    actions: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        annotation: { type: Object, required: true },
        annotationSrc: { type: Object, required: true },
        requestMapping: { type: Object, required: false },
        responseMapping: { type: Object, required: false },
        functions: { type: String, required: false },
        potentialActionLinks: { type: Object, required: false },
        preceedingActionLinks: { type: Object, required: false },
        sampleAction: { type: String, required: false },
        sampleResponse: { type: String, required: false },
      },
    ],
    templates: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        baseType: { type: String, required: false },
        src: { type: Object, required: false },
      },
    ],
    functions: { type: String, required: false },
    vocabs: [{ type: Schema.Types.ObjectId, ref: 'Vocab' }],
    context: { type: Object, required: true },
    config: { type: Object, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export default mongoose.model<WebApiDoc>('WebAPI', WebApiSchema);
