import {
  deepMapValues,
  get,
  removeUndef,
  replaceIterators,
  set,
  URLJoin,
} from './util';

interface StringObj<T = string> {
  [key: string]: T;
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

  const newObj = removeUndef(deepMapValues(mapping, transformValue));

  const path = newObj.path && newObj.path.join('/');
  const queryString =
    newObj.query &&
    Object.entries(newObj.query).map(
      ([k, v]) => `?${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
    );

  const url = URLJoin(newObj.url, path, queryString);

  return removeUndef({
    url,
    headers: newObj.headers,
    body: newObj.body,
  });
};

interface ResponseObj {
  headers?: StringObj<string | number>; // number for statusCode
  body?: any;
}

export interface ResponseMapping {
  headers?: StringObj;
  body?: object;
}

interface ResponseOptions {
  evalMethod?: evalMethod;
}

const defaultResponseOptions: ResponseOptions = {
  evalMethod: 'eval',
};

const doMapping = (
  mappingObj: any,
  input: any,
  result: object,
  iterators: { [key: string]: number },
  options: ResponseOptions,
): void => {
  if (!input || !mappingObj) {
    return;
  }

  if (Array.isArray(mappingObj) && Array.isArray(input)) {
    if (mappingObj.length === 1) {
      // mapping used for all in input
      // iterator available
      const iterator = mappingObj[0].$ite;
      input.forEach((inputElem, i) =>
        doMapping(
          mappingObj[0],
          inputElem,
          result,
          iterator ? Object.assign(iterators, { [iterator]: i }) : iterators,
          options,
        ),
      );
    } else {
      // each array elem different mapping ( no array length = 0)
      mappingObj.forEach((mappingElem, i) =>
        doMapping(mappingElem, input[i], result, iterators, options),
      );
    }
  } else if (typeof mappingObj === 'object') {
    Object.entries(mappingObj)
      .filter(([key]) => key !== '$ite')
      .forEach(([key, value]) => {
        if (
          typeof value === 'string' &&
          value.startsWith('$.') &&
          input[key] !== undefined
        ) {
          // value is path
          const { path, transformFunction } = parsePathStr(value);
          const iteratorPath = replaceIterators(path, iterators);
          if (options.evalMethod && transformFunction) {
            const transformedValue = transFormValue(
              input[key],
              transformFunction,
              options.evalMethod,
            );
            set(result, iteratorPath, transformedValue);
          } else {
            set(result, iteratorPath, input[key]);
          }
        } else if (typeof value === 'object') {
          doMapping(value, input[key], result, iterators, options);
        }
      });
  } else {
    console.log('mapping not object');
  }
};

export const responseMapping = (
  inputResponse: object,
  mapping: object,
  options: ResponseOptions = defaultResponseOptions,
): object => {
  const result = {};
  doMapping(mapping, inputResponse, result, {}, options);
  return result;
};
