import { EvalMethod } from './util';
interface ResponseOptions {
  type?: 'json' | 'xml' | 'yarrrml';
  evalMethod?: EvalMethod;
  iteratorPath?: string;
  rmlOptions?: object;
}
export declare const responseMapping: (
  inputResponse: any,
  mapping: any,
  options?: ResponseOptions,
  mergeObj?: object | undefined,
) => Promise<object>;
export {};
