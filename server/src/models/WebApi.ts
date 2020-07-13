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
  state?: 'disabled' | 'unremovable';
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
  name?: string;
  description?: string;
  defaultValue?: string;

  nodeKind?: string;

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
export type SchaclNonRestrProps = 'name' | 'description' | 'defaultValue';

export type ShaclRestrProps =
  | SchaclNonRestrProps
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
  | 'pattern'
  | 'nodeKind';

export interface DefaultRessourceDesc {
  type: 'annotation' | 'action' | 'template';
  nodeId?: string; // @id of named node
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

export interface Action {
  id: string;
  isActive: boolean;
  name: string;
  annotation: string;
  annotationSrc: ActionRessourceDesc;
  requestMapping: RequestMappingSave;
  responseMapping: ResponseMappingSave;
  functions?: string;
  sampleAction: string;
  sampleResponse: string; // maybe string[]
}

export type WebApiDoc = MongoDoc<WebApi>;

export type WebApiLeanDoc = MongoLeanDoc<WebApi>;

export interface WebApi {
  id: string;
  name: string;
  author: string;
  annotation: string;
  annotationSrc: RessourceDesc;
  actions: Action[];
  functions?: string;
  vocabs: string[];
  prefixes: Record<string, string>;
  config: WebApiConfig;
  templates: Template[];
}

export interface WebApiConfig {
  useMapping: boolean;
  rml: {
    functions: string;
    xpathLib: string;
  };
  handlebars: {
    functions: string;
  };
  xquery: {
    functions: string;
  };
  javascript: {
    functions: string;
  };
}

const WebApiSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    author: { type: String, required: true },
    annotation: { type: String, required: true },
    annotationSrc: { type: Object, required: true },
    actions: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        annotation: { type: String, required: true },
        annotationSrc: { type: Object, required: true },
        requestMapping: { type: Object, required: false },
        responseMapping: { type: Object, required: false },
        functions: { type: String, required: false },
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
    vocabs: [{ type: Schema.Types.ObjectId, ref: 'Vocab' }],
    prefixes: { type: Object, required: true },
    config: { type: Object, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export default mongoose.model<WebApiDoc>('WebAPI', WebApiSchema);
