import { EvalMethod } from './util';
export declare type ResponseType = 'json' | 'xml' | 'yarrrml';
export interface ResponseMappingInput {
    headers?: Record<string, string>;
    body?: object | string;
}
export interface ResponseMapping {
    headers?: Record<string, string>;
    body?: object | string;
}
interface ResponseOptions {
    type: ResponseType;
    evalMethod: EvalMethod;
    iteratorPath: string;
    rmlOptions?: object;
}
export declare const responseMapping: (userInputResponse: ResponseMappingInput, userMapping: ResponseMapping, userOptions?: Partial<ResponseOptions>, mergeObj?: object | undefined) => Promise<object>;
export {};
