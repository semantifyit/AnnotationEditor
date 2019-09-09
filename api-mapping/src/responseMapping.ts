import {
  get,
  logError,
  mergeResult,
  parsePathStr,
  replaceIterators,
  set,
  transFormValue,
  xmlToJson,
  EvalMethod,
  clone,
} from './util';
import { runRmlMapping, yarrrmlPlusToRml } from './rmlmapper';

interface StringObj<T = string> {
  [key: string]: T;
}

export interface ResponseMapping {
  headers?: StringObj;
  body?: object | string;
}

export type ResponseType = 'json' | 'xml' | 'yarrrml';

interface ResponseOptions {
  type?: ResponseType;
  evalMethod?: EvalMethod;
  iteratorPath?: string;
  rmlOptions?: object;
}

interface ResponseOptionsReq {
  type: 'json' | 'xml' | 'yarrrml';
  evalMethod: EvalMethod;
  iteratorPath: string;
  rmlOptions?: object;
}

const defaultResponseOptions: ResponseOptions = {
  type: 'json',
  evalMethod: 'eval',
  iteratorPath: '$ite',
  rmlOptions: {
    replace: true,
    compress: {
      '@vocab': 'http://schema.org/',
    },
  },
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
        if (typeof value === 'string' && value.trim().startsWith('$')) {
          if (key === '_set') {
            const setVals = value.split(',');
            setVals.forEach((setVal) => {
              const [setValPath, setValVal] = setVal.split('=');
              const { path } = parsePathStr(setValPath, true);
              const iteratorPath = replaceIterators(path, iterators);
              set(result, iteratorPath, setValVal);
            });
          } else if (input[key] !== undefined) {
            // value is path
            const { path, transformFunction } = parsePathStr(value, true);
            const iteratorPath = replaceIterators(path, iterators);
            console.log(iterators);
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
          }
        } else if (typeof value === 'object') {
          doMapping(value, input[key], result, iterators, options);
        }
      });
  } else {
    console.log('mapping not object');
  }
};

export const responseMapping = async (
  userInputResponse: any,
  userMapping: any,
  userOptions: ResponseOptions = defaultResponseOptions,
  mergeObj?: object,
): Promise<object> => {
  try {
    const input = clone(userInputResponse);
    const mapping = clone(userMapping);
    const result: { $?: any } = {};
    const options: ResponseOptions = Object.assign(
      defaultResponseOptions,
      userOptions,
    );

    if (options.type === 'xml' && mapping.body && input.body) {
      mapping.body = await xmlToJson(mapping.body);
      input.body = await xmlToJson(input.body);
      if (
        !options.iteratorPath ||
        options.iteratorPath === defaultResponseOptions.iteratorPath
      ) {
        options.iteratorPath = '$.ite';
      }
    }
    if (options.type === 'json' && typeof mapping.body === 'string') {
      mapping.body = JSON.parse(mapping.body);
    }
    if (options.type === 'json' && typeof input.body === 'string') {
      input.body = JSON.parse(input.body);
    }
    if (options.type === 'json' || options.type === 'xml') {
      doMapping(mapping, input, result, {}, options as ResponseOptionsReq);
    } else if (options.type === 'yarrrml') {
      let yarrrml = mapping;
      if (mapping.body) {
        yarrrml = mapping.body;
      }
      const rmlStr = await yarrrmlPlusToRml(yarrrml);
      const rmlResult = await runRmlMapping(
        rmlStr,
        input.body ? input.body : input,
        options.rmlOptions,
      );
      if (mapping.headers && input.headers) {
        doMapping(
          mapping.headers,
          input.headers,
          result,
          {},
          options as ResponseOptionsReq,
        );
        mergeResult(rmlResult, result.$, new RegExp('$^'));
      }
      result.$ = rmlResult;
    }

    if (mergeObj) {
      mergeResult(result.$, mergeObj, new RegExp('-input$')); // TODO add option for regexp maybe?
    }
    return result.$;
  } catch (e) {
    logError(e);
    return {};
  }
};
