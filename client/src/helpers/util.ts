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
