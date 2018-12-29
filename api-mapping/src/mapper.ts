import { deepMapValues, get, URLJoin } from './util';

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

interface RequestParams {
  url: string;
  headers?: StringObj;
  body?: object;
}

interface Options {
  type?: 'json';
  locator?: 'simple' | 'json-path';
  evalMethod?: 'eval' | 'new-thread' | 'safe-eval' | 'vm-runInNewContext';
}

const useInputValue = (
  inputObj: object,
  pathStr: string,
  options: Options,
): string => {
  const [path, transformFunction] = pathStr.split(/\|>/).map((s) => s.trim());

  // TODO different locator options
  const inputVal = get(inputObj, path.substring(2)); // remove '$.' for our get method#
  console.log(pathStr, inputVal);
  const cleanVal =
    typeof inputVal === 'string' ? inputVal.replace(/'/g, "\\'") : inputVal;

  // TODO different eval options
  if (transformFunction) {
    // tslint:disable:no-eval
    const code = `(${transformFunction})('${cleanVal}')`;
    console.log(code);
    switch (options.evalMethod) {
      case 'vm-runInNewContext':
        const vm = require('vm');
        return vm.runInNewContext(code);
      case 'eval':
      default:
        return eval(code);
    }
  }
  return cleanVal;
};

const defaultOptions: Options = {
  type: 'json',
  locator: 'simple',
  evalMethod: 'eval',
};

export const requestMapping = (
  inputAction: object,
  mapping: RequestMapping,
  options: Options = defaultOptions,
): RequestParams => {
  const transformValue = (val: any): any =>
    typeof val === 'string' && val.startsWith('$')
      ? useInputValue(inputAction, val, options)
      : val;

  const newObj = deepMapValues(mapping, transformValue);

  const path = newObj.path && newObj.path.join('/');
  const queryString =
    newObj.query &&
    Object.entries(newObj.query).map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
    );
  const url = URLJoin(newObj.url, path, queryString);

  return {
    url,
    headers: newObj.headers,
    body: newObj.body,
  };
};
