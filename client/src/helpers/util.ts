export type Optional<T> = T | undefined;

export const arraysAreEquals = <T>(arr1: T[], arr2: T[]): boolean =>
  JSON.stringify(arr1.sort()) === JSON.stringify(arr2.sort());

export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

export const haveCommon = <T>(arr1: T[], arr2: T[]): boolean =>
  arr1.filter((e) => arr2.includes(e)).length !== 0;

export const flatten2DArr = <T>(arr: T[][]): T[] =>
  arr.reduce((a, b) => a.concat(b), []);

export const flatten3DArr = <T>(arr: T[][][]): T[] =>
  arr.reduce((a: T[], b) => a.concat(flatten2DArr(b)), []);

export const notEmpty = (p: any) =>
  !(p === null || p === undefined || p.toString().trim() === '');

export const mergeArrays = (arr: any[]) => [].concat.apply([], arr);

export const uniqueArray = <T>(arr: T[]): T[] => [...new Set(arr)];

export const makeArray = (o: any) => (Array.isArray(o) ? o : [o]);

export const hasP = Object.prototype.hasOwnProperty;

// https://github.com/30-seconds/30-seconds-of-code#flattenobject
export const flattenObject = (
  obj: any,
  prefix: string = '',
  separator: string = '.',
  upToType?: string,
) =>
  Object.keys(obj).reduce((acc: any, k) => {
    const pre = prefix.length ? prefix + separator : '';
    if (
      typeof obj[k] === 'object' &&
      !(upToType && obj[k]['@type'] === upToType)
    ) {
      Object.assign(acc, flattenObject(obj[k], pre + k, separator, upToType));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});

export const isDefined = <T>(t: T | undefined): t is T => !!t;

export const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const stringIsValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (_) {
    return false;
  }
};

export const removeUndef = (obj: object): any =>
  Object.entries(obj).reduce(
    (acc, [k, v]) => {
      if (v !== undefined) {
        acc[k] = v;
      }
      return acc;
    },
    {} as any,
  );
