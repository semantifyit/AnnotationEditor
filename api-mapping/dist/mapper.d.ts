interface StringObj {
  [key: string]: string;
}
export interface RequestMapping {
  url: string;
  path?: string[];
  query?: StringObj;
  headers?: StringObj;
  body?: object;
}
interface RequestParams {
  url: string;
  headers?: StringObj;
  body?: object;
}
interface Options {
  type?: 'json';
  locator?: 'simple' | 'json-path';
  evalMethod?: 'eval' | 'new-thread' | 'safe-eval' | 'vm-runInNewContext';
}
export declare const requestMapping: (
  inputAction: object,
  mapping: RequestMapping,
  options?: Options,
) => RequestParams;
export {};
