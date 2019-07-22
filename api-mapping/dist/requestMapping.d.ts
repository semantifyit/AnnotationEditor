interface StringObj<T = string> {
  [key: string]: T;
}
export interface RequestMapping {
  url: string;
  path?: string[];
  query?: StringObj;
  headers?: StringObj;
  body?: object | string;
}
export interface RequestOutput {
  url: string;
  headers?: StringObj;
  body?: object | string;
}
declare type EvalMethod = 'eval' | 'vm-runInNewContext';
declare type MappingType = 'json' | 'xml' | 'js';
interface RequestOptions {
  type?: MappingType;
  locator?: 'simple' | 'json-path';
  evalMethod?: EvalMethod;
}
export declare const requestMapping: (
  inputAction: object,
  mapping: RequestMapping,
  options?: RequestOptions | undefined,
) => Promise<RequestOutput>;
export {};
