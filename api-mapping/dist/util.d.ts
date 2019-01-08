export declare const deepMapValues: <T = object>(obj: T, f: Function) => T;
export declare const get: (obj: object, selector: string) => any;
export declare const URLJoin: (...args: any[]) => string;
export declare const isNodeJs: () => boolean;
export declare const isBrowser: () => boolean;
export declare const mergeDiff: (...objects: any[]) => any;
export declare const mergeSame: (...objects: any[]) => any;
export declare const removeUndef: <T>(obj: T) => T;
export declare const isEmptyObject: (obj: any) => boolean;
