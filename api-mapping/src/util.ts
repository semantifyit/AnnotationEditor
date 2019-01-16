// tslint:disable:ter-indent

// adapted from https://github.com/30-seconds/30-seconds-of-code#deepmapkeys-
// tslint:disable-next-line:ban-types
export const deepMapValues = <T = object>(obj: T, f: Function): T =>
  Array.isArray(obj)
    ? obj.map((val) => deepMapValues(val, f))
    : typeof obj === 'object'
    ? Object.entries(obj).reduce((acc: any, [key, val]: any) => {
        acc[key] = deepMapValues(val, f);
        return acc;
      }, {})
    : f(obj);

// from https://github.com/30-seconds/30-seconds-of-code#get
export const get = (obj: object, selector: string): any =>
  selector
    .replace(/\[([^\[\]]*)\]/g, '.$1.')
    .split('.')
    .filter((t) => t !== '')
    .reduce((prev: any, cur) => prev && prev[cur], obj);

const isDefined = <T>(t: T | undefined): t is T => !!t;

// adding undefined can add a '/' at the end, we don't care about that ?
// adapted from https://github.com/30-seconds/30-seconds-of-code#urljoin-
export const URLJoin = (...args: any[]) =>
  args
    .filter(isDefined)
    .join('/')
    .replace(/[\/]+/g, '/')
    .replace(/^(.+):\//, '$1://')
    .replace(/^file:/, 'file:/')
    .replace(/\/(\?|&|#[^!])/g, '$1')
    .replace(/\?/g, '&')
    .replace('&', '?');

// @ts-ignore
export const isNodeJs = (): boolean => typeof window === 'undefined';

export const isBrowser = (): boolean =>
  // @ts-ignore
  ![typeof window, typeof document].includes('undefined');

export const mergeDiff = (...objects: any[]) =>
  objects.reduce((acc, cur) => {
    // if (typeof cur === 'object') {
    Object.entries(cur).forEach(([k, v]) => {
      if (acc[k]) {
        if (Array.isArray(acc[k])) {
          acc[k].push(v);
        } else {
          acc[k] = [acc[k], v];
        }
      } else {
        acc[k] = v;
      }
    });
    return acc;
  }, {});

export const mergeSame = (...objects: any[]) =>
  objects.reduce((acc, cur) => {
    if (typeof cur === 'object') {
      Object.entries(cur).forEach(([k, v]) => {
        if (acc[k]) {
          acc[k] = mergeSame(acc[k], v);
        } else {
          acc[k] = v;
        }
      });
      return acc;
    }
    if (Array.isArray(acc)) {
      acc.push(cur);
      return acc;
    }
    if (Object.keys(acc).length === 0) {
      return [cur];
    }
    return [acc, cur];
  }, {});

export const removeUndef = <T>(obj: T): T =>
  Object.entries(obj).reduce(
    (acc, [k, v]) => {
      if (!isEmptyObject(v)) {
        acc[k] = v;
      }
      return acc;
    },
    {} as any,
  );

export const isEmptyObject = (obj: any): boolean =>
  obj === null ||
  obj === undefined ||
  (Array.isArray(obj) && obj.length === 0) ||
  (typeof obj === 'object' && Object.keys(obj).length === 0);

export const isObject = (item: any): boolean =>
  item && typeof item === 'object' && !Array.isArray(item);

export const mergeResult = (...objects: any[]): any =>
  objects.reduce((acc, cur) => {
    Object.entries(cur).forEach(([k, v]) => {
      if (acc[k] !== undefined) {
        // TODO
      } else {
        acc[k] = v;
      }
    });
    return acc;
  }, {});

export const isNumeric = (num: any): boolean => !isNaN(num);

export const set = (obj: any, path: string, val: any) => {
  if (typeof obj !== 'object') {
    console.log('return');
    console.log(obj);
    return;
  }
  const paths = path
    .replace(/\[([^\[\]]*)\]/g, '.$1.')
    .split('.')
    .filter((t) => t !== '');
  console.log(paths);
  if (paths.length === 1) {
    if (obj[paths[0]]) {
      if (Array.isArray(obj[paths[0]])) {
        obj[paths[0]].push(val);
      } else {
        obj[paths[0]] = [obj[paths[0]], val];
      }
    } else {
      console.log(obj);
      console.log(paths[0]);
      console.log(val);
      obj[paths[0]] = val;
    }
  } else {
    const restPath = paths.slice(1).join('.');
    if (!obj[paths[0]]) {
      console.log('HIHI');
      console.log(obj);
      console.log(paths[0]);
      obj[paths[0]] = {};
      set(obj[paths[0]], restPath, val);
    } else if (Array.isArray(obj[paths[0]])) {
      console.log('HO');
      console.log(obj);
      console.log(paths[0]);
      if (isNumeric(paths[1])) {
        console.log('num');
        if (!obj[paths[0]][paths[1]]) {
          obj[paths[0]][paths[1]] = {};
        }
        set(obj[paths[0]][paths[1]], paths.slice(2).join('.'), val);
      } else {
        console.log('each');
        obj[paths[0]].forEach((_: any, i: number) => {
          set(obj[paths[0]][i], restPath, val);
        });
      }
    } else if (typeof obj[paths[0]] === 'object') {
      console.log('GHE');
      set(obj[paths[0]], restPath, val);
    } else {
      console.log('asd');
      const newO = {};
      set(newO, restPath, val);
      obj[paths[0]] = [obj[paths[0]], newO];
    }
  }
};

export const setnew = (obj: any, path: string, value: any) => {};
