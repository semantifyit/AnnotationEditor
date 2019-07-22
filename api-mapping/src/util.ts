import * as xml2js from 'xml2js';
import * as vm from 'vm';
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

export const pathStringToArr = (path: string): string[] =>
  path
    .replace(/\[([^\[\]]*)\]/g, '.$1.')
    .split('.')
    .filter((t) => t !== '');

// from https://github.com/30-seconds/30-seconds-of-code#get
export const get = (obj: object, selector: string): any =>
  pathStringToArr(selector).reduce((prev: any, cur) => prev && prev[cur], obj);

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

export const mergeResult = (
  input: any,
  mergeObj: any,
  ignoreKeyRegex?: RegExp,
): void => {
  if (Array.isArray(input)) {
    input.forEach((_, i) => {
      mergeResult(input[i], mergeObj, ignoreKeyRegex);
    });
  } else {
    Object.entries(mergeObj).forEach(([key, val], i) => {
      if (ignoreKeyRegex && !ignoreKeyRegex.test(key)) {
        if (typeof val === 'object' && input[key] !== undefined) {
          mergeResult(input[key], val, ignoreKeyRegex);
        } else if (input[key] === undefined && typeof val !== 'object') {
          input[key] = val;
        }
      }
    });
  }
};

export const isNumeric = (num: any): boolean => !isNaN(num);

export const replaceIterators = (
  path: string,
  iterators: { [ite: string]: number },
): string => {
  let newPath = path;
  Object.entries(iterators).forEach(([ite, index]) => {
    newPath = newPath.replace(new RegExp(`\\[${ite}\\]`, 'g'), `[${index}]`);
  });
  return newPath;
};

export const set = (obj: any, path: string, value: any) => {
  const paths = pathStringToArr(path);
  setPath(obj, paths, value);
};

const setPath = (obj: any, path: string[], value: any) => {
  const [prop, ...rest] = path;
  // base-case path only one
  if (path.length === 1) {
    if (Array.isArray(obj)) {
      if (isNumeric(prop)) {
        if (obj[Number(prop)] !== undefined) {
          if (Array.isArray(obj[Number(prop)])) {
            obj[Number(prop)].push(value);
          } else {
            obj[Number(prop)] = [obj[Number(prop)], value];
          }
        } else {
          obj[Number(prop)] = value;
        }
      } else {
        if (obj.every((elem) => typeof elem !== 'object')) {
          obj.push({ [prop]: value });
        } else {
          obj.forEach((elem, i) => {
            if (typeof elem === 'object') {
              if (obj[i][prop] !== undefined) {
                if (Array.isArray(obj[i][prop])) {
                  obj[i][prop].push(value);
                } else {
                  obj[i][prop] = [obj[i][prop], value];
                }
              } else {
                console.log(obj[i]);
                console.log(i);
                obj[i][prop] = value;
              }
            }
          });
        }
      }
    } else {
      if (obj[prop] !== undefined) {
        if (Array.isArray(obj[prop])) {
          obj[prop].push(value);
        } else {
          obj[prop] = [obj[prop], value];
        }
      } else {
        obj[prop] = value;
      }
    }
  } else {
    if (Array.isArray(obj)) {
      // 0.a [{a:1}, 2]
      if (isNumeric(prop)) {
        if (obj[Number(prop)] !== undefined) {
          if (typeof obj[Number(prop)] === 'object') {
            setPath(obj[Number(prop)], rest, value);
          } else {
            obj[Number(prop)] = [obj[Number(prop)]];
            setPath(obj[Number(prop)], rest, value);
          }
        } else {
          obj[Number(prop)] = isNumeric(rest[0]) ? [] : {};
          setPath(obj[Number(prop)], rest, value);
        }
      } else {
        // a.b [1,2,{a:{c:1}}]
        if (obj.every((elem) => typeof elem !== 'object')) {
          obj.push(isNumeric(rest[0]) ? [] : {});
          setPath(obj[obj.length - 1], path, value);
        } else {
          obj.forEach((elem, i) => {
            if (typeof elem === 'object') {
              setPath(obj[i], path, value);
            }
          });
        }
      }
    } else if (typeof obj === 'object') {
      // a {a: [1,2]}
      if (obj[prop] !== undefined) {
        setPath(obj[prop], rest, value);
      } else {
        obj[prop] = isNumeric(rest[0]) ? [] : {};
        setPath(obj[prop], rest, value);
      }
      // 0 {a:1}
    } else {
      console.log('Object neither');
    }
  }
};

export const xmlToJson = async (xml: string): Promise<object> =>
  new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitCharkey: true }, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });

export const jsonToXml = (json: object): string => {
  const xmlBuilder = new xml2js.Builder({ renderOpts: { pretty: false } });
  return xmlBuilder.buildObject(json);
};

export const logError = (e: any) => {
  /*if (isBrowser() && alert) {
    try {
      alert(e);
    } catch (err) {
      // ignore
    }
  }*/
  console.log('Mapping Error:');
  console.log(e);
};

export const parsePathStr = (
  pathStr: string,
  keepDollar: boolean = false,
): { path: string; transformFunction?: string } => {
  const [path, transformFunction] = pathStr.split(/\|>/).map((s) => s.trim());
  return {
    transformFunction,
    path: keepDollar ? path : path.substring(2), // remove '$.' for our get method#
  };
};

export type EvalMethod = 'eval' | 'vm-runInNewContext';

// TODO newlines in string
export const transFormValue = (
  val: any,
  transformFunctionStr: string,
  evalMethod: EvalMethod,
): any => {
  const cleanVal = typeof val === 'string' ? val.replace(/'/g, "\\'") : val;
  const code = `(${transformFunctionStr})('${cleanVal}')`;
  return runCode(code, evalMethod);
};

export const runCode = (code: string, evalMethodType?: EvalMethod): any => {
  switch (evalMethodType) {
    case 'vm-runInNewContext':
      return vm.runInNewContext(code);
    case 'eval':
    default:
      // tslint:disable-next-line:no-eval
      return eval(code);
  }
};
