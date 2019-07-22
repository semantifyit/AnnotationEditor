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
} from './util';
import { runRmlMapping, yarrrmlPlusToRml } from './rmlmapper';

interface ResponseOptions {
  type?: 'json' | 'xml' | 'yarrrml';
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

export const responseMapping = async (
  inputResponse: any,
  mapping: any,
  options: ResponseOptions = defaultResponseOptions,
  mergeObj?: object,
): Promise<object> => {
  try {
    const result: { $?: any } = {};
    const userOptions: ResponseOptions = Object.assign(
      defaultResponseOptions,
      options,
    );

    if (userOptions.type === 'xml' && mapping.body && inputResponse.body) {
      mapping.body = await xmlToJson(mapping.body);
      inputResponse.body = await xmlToJson(inputResponse.body);
    }
    if (userOptions.type === 'json' || userOptions.type === 'xml') {
      doMapping(
        mapping,
        inputResponse,
        result,
        {},
        userOptions as ResponseOptionsReq,
      );
    } else if (userOptions.type === 'yarrrml') {
      // TODO
      const rmlStr = await yarrrmlPlusToRml(mapping.body);
      const rmlResult = await runRmlMapping(
        rmlStr,
        inputResponse,
        userOptions.rmlOptions,
      );
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
