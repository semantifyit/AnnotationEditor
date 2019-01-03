import { deepMapValues, get, mergeDiff, mergeSame, URLJoin } from './util';

interface StringObj {
  [key: string]: string;
}

export interface RequestMapping {
  url: string;
  path?: string[];
  query?: StringObj;
  headers?: StringObj;
  body?: object;
}

export interface RequestOutput {
  url: string;
  headers?: StringObj;
  body?: object;
}

// TODO different eval options
type evalMethod = 'eval' | 'vm-runInNewContext';

interface RequestOptions {
  type?: 'json';
  locator?: 'simple' | 'json-path'; // json-path not supported, could be for the future
  evalMethod?: evalMethod;
}

const transFormValue = (
  val: any,
  transformFunctionStr: string,
  evalMethodType: evalMethod,
): any => {
  const cleanVal = typeof val === 'string' ? val.replace(/'/g, "\\'") : val;
  const code = `(${transformFunctionStr})('${cleanVal}')`;
  switch (evalMethodType) {
    case 'vm-runInNewContext':
      const vm = require('vm');
      return vm.runInNewContext(code);
    case 'eval':
    default:
      // tslint:disable-next-line:no-eval
      return eval(code);
  }
};

const parsePathStr = (
  pathStr: string,
): { path: string; transformFunction?: string } => {
  const [path, transformFunction] = pathStr.split(/\|>/).map((s) => s.trim());
  return {
    transformFunction,
    path: path.substring(2), // remove '$.' for our get method#
  };
};

const useInputValue = (
  inputObj: object,
  pathStr: string,
  options: RequestOptions,
): string => {
  const { path, transformFunction } = parsePathStr(pathStr);

  // TODO different locator options
  const inputVal = get(inputObj, path);

  if (transformFunction && options.evalMethod) {
    return transFormValue(inputVal, transformFunction, options.evalMethod);
  }
  return inputVal;
};

const defaultRequestOptions: RequestOptions = {
  type: 'json',
  locator: 'simple',
  evalMethod: 'eval',
};

export const requestMapping = (
  inputAction: object,
  mapping: RequestMapping,
  options: RequestOptions = defaultRequestOptions,
): RequestOutput => {
  const transformValue = (val: any): any =>
    typeof val === 'string' && val.startsWith('$')
      ? useInputValue(inputAction, val, options)
      : val;

  const newObj = deepMapValues(mapping, transformValue);

  const path = newObj.path && newObj.path.join('/');
  const queryString =
    newObj.query &&
    Object.entries(newObj.query).map(
      ([k, v]) => `?${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
    );
  const url = URLJoin(newObj.url, path, queryString);

  return {
    url,
    headers: newObj.headers,
    body: newObj.body,
  };
};

interface ResponseObj {
  status?: number;
  statusText?: string;
  headers?: StringObj;
  body?: any;
}

interface ResponseMapping {
  headers?: StringObj;
  body?: object;
}

interface ResponseOptions {
  evalMethod?: evalMethod;
}

const defaultResponseOptions: ResponseOptions = {
  evalMethod: 'eval',
};

export const responseMapping = (
  inputResponse: ResponseObj,
  mapping: ResponseMapping,
  options: ResponseOptions = defaultResponseOptions,
): object => {
  const set = (obj: any, path: string, val: any) => {
    const paths = path.split('.');
    if (paths.length === 1) {
      if (obj[paths[0]]) {
        if (Array.isArray(obj[paths[0]])) {
          obj[paths[0]].push(val);
        } else {
          obj[paths[0]] = [obj[paths[0]], val];
        }
      } else {
        obj[paths[0]] = val;
      }
    } else {
      if (!obj[paths[0]]) {
        obj[paths[0]] = {};
      }
      set(obj[paths[0]], paths.slice(1).join('.'), val);
    }
  };

  if (!mapping.body) {
    return {};
  }

  const metadataProperties = ['$merge'];

  const doMapping = (mappingObj: any, input: any) => {
    let result = {};
    if (!input || !mappingObj) {
      return result;
    }
    if (Array.isArray(mappingObj) && Array.isArray(input)) {
      if (mappingObj.length === 1) {
        // mapping used for all in input
        const forceMerge = !!mappingObj[0].$merge;
        const mappedElements = input.map((inputElem) =>
          doMapping(mappingObj[0], inputElem),
        );
        result = forceMerge
          ? mergeSame(...mappedElements)
          : mergeDiff(...mappedElements);
      } else {
        // each array elem different mapping ( no array length = 0)
        result = mergeSame(
          ...mappingObj.map((mappingElem, i) =>
            doMapping(mappingElem, input[i]),
          ),
        );
      }
    } else if (typeof mappingObj === 'object') {
      Object.entries(mappingObj)
        .filter(([k]) => !metadataProperties.includes(k))
        .forEach(([key, value]) => {
          if (
            typeof value === 'string' &&
            value.startsWith('$.') &&
            input[key] !== undefined
          ) {
            // value is path
            const { path, transformFunction } = parsePathStr(value);
            if (options.evalMethod && transformFunction) {
              const transformedValue = transFormValue(
                input[key],
                transformFunction,
                options.evalMethod,
              );
              set(result, path, transformedValue);
            } else {
              set(result, path, input[key]);
            }
          } else if (typeof value === 'object') {
            result = mergeSame(doMapping(value, input[key]), result);
          }
        });
      // console.log(result);
    }
    return result;
  };

  const resultOut = doMapping(mapping, inputResponse);
  // console.log(resultOut);

  return resultOut;
};
