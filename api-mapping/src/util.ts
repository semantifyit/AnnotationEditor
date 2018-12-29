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
