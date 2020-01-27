import mongoose, { Schema, Document } from 'mongoose';
import { RequestMapping, RequestType } from 'api-mapping/dist/requestMapping';
import { ResponseMapping, ResponseType } from 'api-mapping/dist/responseMapping';

import { MongoDoc, MongoLeanDoc } from './helper';
import { Vocab } from './Vocab';

export interface Template {
  id: string;
  name: string;
  baseType?: string;
  src: AnnotationSrc;
}

export interface AnnotationSrcProp {
  type: 'annotation';
  id: string;
  path: string;
  val: string | AnnotationSrc;
  range: string;
}

export type TemplatePropertyGroupType = 'input' | 'output';

export interface RangeTemplate {
  templateId: string;
}

export interface RangeActionInOut {
  actionId: string;
  path: string; // ? for now string jsonpath/pointer
}

export type TemplatePropertyRange = AnnotationSrc | RangeTemplate | RangeActionInOut;

export interface TemplateProperty {
  type: 'template';
  id: string;
  path: string;
  range: TemplatePropertyRange[];
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

export interface AnnotationSrc {
  type?: 'template';
  types: string[];
  props: (AnnotationSrcProp | TemplateProperty)[];
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

export interface RequestMappingSave {
  isValid: boolean;
  type: RequestType;
  method: string;
  url: string;
  path: string;
  query: string;
  headers: string;
  body: string;
}

export interface ResponseMappingSave {
  isValid: boolean;
  type: ResponseType;
  headers: string;
  body: string;
}

export interface Action {
  path: string;
  annotation: ActionAnnotation;
  annotationSrc: AnnotationSrc;
  requestMapping: RequestMappingSave;
  responseMapping: ResponseMappingSave;
  functions?: string;
}

export type WebApiDoc = MongoDoc<WebApi>;

export type WebApiLeanDoc = MongoLeanDoc<WebApi>;

export interface WebApi {
  path: string;
  author: string;
  annotation: WebApiAnnotation;
  annotationSrc: AnnotationSrc;
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
    path: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    annotation: { type: Object, required: true },
    annotationSrc: { type: Object, required: true },
    actions: [
      {
        path: { type: String, required: true },
        annotation: { type: Object, required: true },
        annotationSrc: { type: Object, required: true },
        requestMapping: { type: Object, required: false },
        responseMapping: { type: Object, required: false },
        functions: { type: String, required: false },
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
