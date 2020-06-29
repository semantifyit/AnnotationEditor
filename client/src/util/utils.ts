export const toArray = <T>(o: T | T[]): T[] => (Array.isArray(o) ? o : [o]);

export const fromArray = <T>(o: T[]): T | T[] => (o.length > 1 ? o : o[0] || []);

export const toReadableString = (str: string | string[] | undefined, delimeter = ' '): string =>
  toArray(str || [])
    .join(delimeter)
    .trim();

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

export const toDateString = (dateStr: string): string => `last updated ${shortDateString(dateStr)}`;

const shortDateString = (dateStr: string): string => {
  const today = new Date();
  const date = new Date(dateStr);
  if (isSameDay(date, today)) {
    const minutes = date.getMinutes();
    return `${date.getHours()}:${minutes < 10 ? '0' : ''}${minutes}`;
  }
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

export const cutString = (str: string, length: number) =>
  str.length > length ? `${str.slice(0, length)}...` : str;

export const memoize = <T, U>(
  fn: (...args: U[]) => T,
  userCache: { [k: string]: T } = {},
  omits: number[] = [],
): ((...args: U[]) => T) => {
  const cache = userCache;
  return (...args) => {
    const n = JSON.stringify(args.filter((_, i) => !omits.includes(i)));
    if (n in cache) {
      return cache[n];
    }
    const result = fn(...args);
    cache[n] = result;
    return result;
  };
};

export const uniqueArray = <T>(arr: T[]): T[] => [...new Set(arr)];

// export const uniqueArrayWith = <T>(arr: T[], f: (a: T, b:T) => boolean): T[] =>

export const extractIds = (o: any): string[] =>
  toArray(o)
    .filter((n) => n && n['@id'])
    .map((n) => n['@id']);

export const stringSortFn = (a: string, b: string) => a.localeCompare(b);

export type Optional<T> = T | undefined;

export const filterUndef = <T>(ts: Optional<T>[]): T[] => ts.filter((t): t is T => !!t);

export const flatten2DArr = <T>(arr: T[][]): T[] => arr.reduce((a, b) => a.concat(b), []);

export const flatten3DArr = <T>(arr: T[][][]): T[] =>
  arr.reduce((a: T[], b) => a.concat(flatten2DArr(b)), []);

export const stringIsValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (_) {
    return false;
  }
};

export const isUri = (str: string): boolean =>
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(
    str,
  );

export const isOneLevelStringJSON = (obj: string): boolean =>
  stringIsValidJSON(obj) && Object.values(JSON.parse(obj)).every((e) => typeof e === 'string');

export const isArrayOfStrings = (obj: string): boolean =>
  stringIsValidJSON(obj) &&
  Array.isArray(JSON.parse(obj)) &&
  JSON.parse(obj).every((e: any) => typeof e === 'string');

export const addCharToCamelCase = (str: string, char = ''): string =>
  str.replace(/[A-Z]/g, (v, i) => char + v);

export const escapeLineBreaks = (str: string): string => addCharToCamelCase(str, '​'); // not empty string but empty character (&#8203;)

export const stringOrNil = (o: string | any): Optional<string> => (typeof o === 'string' ? o : undefined);

export const maxOfArray1 = (arr: number[]): number => Math.max(0, ...arr);

export const maxOfArray = (arr: number[]): number => (arr.length === 0 ? -1 : Math.max(0, ...arr));

export const switchCase = <T>(obj: Record<string, T>, defaultVal?: any) => (s: string) =>
  obj[s] || defaultVal;

export const prettyJsonStr = (s: string): string => JSON.stringify(JSON.parse(s), null, 2);

export const pluck = <T, K extends keyof T>(objs: T[], key: K): T[K][] => objs.map((obj) => obj[key]);

export interface Option {
  value: string;
  label: string;
}

export const createSelectOption = (label: string): Option => ({
  label,
  value: label,
});
