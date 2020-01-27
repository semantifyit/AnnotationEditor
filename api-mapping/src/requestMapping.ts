import {
  clone,
  deepMapValues,
  get,
  jsonToXml,
  logError,
  parsePathStr,
  removeUndef,
  runCode,
  transFormValue,
  URLJoin,
  xmlToJson,
} from './util';

interface StringObj<T = string> {
  [key: string]: T;
}

export interface RequestMapping {
  url: string;
  path?: string[];
  query?: StringObj;
  headers?: StringObj;
  body?: object | string;
}

export interface RequestOutput {
  url: string;
  headers?: StringObj;
  body?: object | string;
}

// TODO different eval options
type EvalMethod = 'eval' | 'vm-runInNewContext';

export type RequestType = 'json' | 'xml' | 'js';

interface RequestOptions {
  type?: RequestType;
  locator?: 'simple' | 'json-path'; // json-path not supported, could be for the future
  evalMethod?: EvalMethod;
}

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
  type: undefined,
  locator: 'simple',
  evalMethod: 'eval',
};

export const requestMapping = async (
  inputAction: object,
  userMapping: RequestMapping,
  options?: RequestOptions,
): Promise<RequestOutput> => {
  const userOptions: RequestOptions = Object.assign(
    defaultRequestOptions,
    options,
  );
  const mapping = clone(userMapping);
  let mappingType = userOptions.type;
  if (typeof mapping.body === 'string') {
    if (mappingType) {
      switch (mappingType) {
        case 'xml':
          mapping.body = await xmlToJson(mapping.body as string);
          break;
        case 'json':
          mapping.body = JSON.parse(mapping.body);
          break;
        case 'js':
        default:
          break;
      }
    } else {
      try {
        mapping.body = JSON.parse(mapping.body);
        mappingType = 'json';
      } catch (e) {
        try {
          mapping.body = await xmlToJson(mapping.body as string);
          mappingType = 'xml';
        } catch (e) {
          mappingType = 'js';
        }
      }
    }
  }

  try {
    const transformValue = (val: any): any =>
      typeof val === 'string' && val.trim().startsWith('$')
        ? useInputValue(inputAction, val.trim(), userOptions)
        : val;

    const newObj = removeUndef(deepMapValues(mapping, transformValue));

    const path = newObj.path && newObj.path.join('/');
    const queryString =
      newObj.query &&
      Object.entries(newObj.query).map(
        ([k, v]) => `?${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
      );

    const url = URLJoin(newObj.url, path, queryString);

    let mappingBody = newObj.body;

    if (mappingType === 'js') {
      const evalCode = `
      (() => {
      const $ = JSON.parse('${JSON.stringify(inputAction)}');
      return ${mapping.body};
      })();
      `;
      mappingBody = runCode(evalCode, userOptions.evalMethod);
    }

    const output = removeUndef({
      url,
      headers: newObj.headers,
      body: mappingBody,
    });
    if (mappingType === 'xml' && typeof output.body === 'object') {
      output.body = jsonToXml(output.body);
    }
    return output;
  } catch (e) {
    logError(e);
    return { url: '' }; // empty return;
  }
};
