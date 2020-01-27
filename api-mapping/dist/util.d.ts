export declare const deepMapValues: <T = object>(obj: T, f: Function) => T;
export declare const pathStringToArr: (path: string) => string[];
export declare const get: (obj: object, selector: string) => any;
export declare const URLJoin: (...args: any[]) => string;
export declare const isNodeJs: () => boolean;
export declare const isBrowser: () => boolean;
export declare const removeUndef: <T>(obj: T) => T;
export declare const isEmptyObject: (obj: any) => boolean;
export declare const isObject: (item: any) => boolean;
export declare const mergeResult: (input: any, mergeObj: any, ignoreKeyRegex?: RegExp | undefined) => void;
export declare const isNumeric: (num: any) => boolean;
export declare const replaceIterators: (path: string, iterators: {
    [ite: string]: number;
}) => string;
export declare const set: (obj: any, path: string, value: any) => void;
export declare const xmlToJson: (xml: string) => Promise<object>;
export declare const jsonToXml: (json: object) => string;
export declare const logError: (e: any) => void;
export declare const parsePathStr: (pathStr: string, keepDollar?: boolean) => {
    path: string;
    transformFunction?: string | undefined;
};
export declare type EvalMethod = 'eval' | 'vm-runInNewContext';
export declare const transFormValue: (val: any, transformFunctionStr: string, evalMethod: EvalMethod) => any;
export declare const runCode: (code: string, evalMethodType?: "eval" | "vm-runInNewContext" | undefined) => any;
export declare const clone: <T>(o: T) => T;
