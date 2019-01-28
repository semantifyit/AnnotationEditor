import {
  deepMapValues,
  get,
  isBrowser,
  mergeResult,
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

const logError = (e: any) => {
  if (isBrowser()) {
    alert(e);
  }
  console.log('Mapping Error:');
  console.log(e);
};

// TODO newlines in string
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
  keepDollar: boolean = false,
): { path: string; transformFunction?: string } => {
  const [path, transformFunction] = pathStr.split(/\|>/).map((s) => s.trim());
  return {
    transformFunction,
    path: keepDollar ? path : path.substring(2), // remove '$.' for our get method#
  };
};

const useInputValue = (
  inputObj: object,
  pathStr: string,
  options: RequestOptions,
): string => {
  const { path, transformFunction } = parsePathStr(pathStr);

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
  try {
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
  } catch (e) {
    logError(e);
    return { url: '' }; // empty return;
  }
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
  iteratorPath?: string;
}

interface ResponseOptionsReq {
  evalMethod: evalMethod;
  iteratorPath: string;
}

const defaultResponseOptions: ResponseOptionsReq = {
  evalMethod: 'eval',
  iteratorPath: '$ite',
};

const doMapping = (
  mappingObj: any,
  input: any,
  result: object,
  iterators: { [key: string]: number },
  options: ResponseOptionsReq,
): void => {
  if (!input || !mappingObj) {
    return;
  }

  if (Array.isArray(mappingObj) && Array.isArray(input)) {
    if (mappingObj.length === 1) {
      // mapping used for all in input
      // iterator available
      const iterator = get(mappingObj[0], options.iteratorPath);
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
          value.startsWith('$') &&
          input[key] !== undefined
        ) {
          // value is path
          const { path, transformFunction } = parsePathStr(value, true);
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
  mergeObj?: object,
): object => {
  try {
    const result: { $?: any } = {};
    const userOptions: ResponseOptionsReq = Object.assign(
      defaultResponseOptions,
      options,
    );
    doMapping(mapping, inputResponse, result, {}, userOptions);
    if (mergeObj) {
      mergeResult(result.$, mergeObj, new RegExp('-input$')); // TODO add option for regexp maybe?
    }
    return result.$;
  } catch (e) {
    logError(e);
    return {};
  }
};
