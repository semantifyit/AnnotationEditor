export declare const deepMapValues: <T = object>(obj: T, f: Function) => T;
export declare const get: (obj: object, selector: string) => any;
export declare const URLJoin: (...args: any[]) => string;
export declare const isNodeJs: () => boolean;
export declare const isBrowser: () => boolean;
export declare const removeUndef: <T>(obj: T) => T;
export declare const isEmptyObject: (obj: any) => boolean;
export declare const isObject: (item: any) => boolean;
export declare const mergeResult: (...objects: any[]) => any;
export declare const isNumeric: (num: any) => boolean;
export declare const replaceIterators: (
  path: string,
  iterators: {
    [ite: string]: number;
  },
) => string;
export declare const set: (obj: any, path: string, value: any) => void;
