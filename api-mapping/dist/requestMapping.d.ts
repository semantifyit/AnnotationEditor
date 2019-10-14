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
export declare type RequestType = 'json' | 'xml' | 'js';
interface RequestOptions {
    type?: RequestType;
    locator?: 'simple' | 'json-path';
    evalMethod?: EvalMethod;
}
export declare const requestMapping: (inputAction: object, userMapping: RequestMapping, options?: RequestOptions | undefined) => Promise<RequestOutput>;
export {};
