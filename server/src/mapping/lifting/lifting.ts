import * as vm from 'vm';

import { runRmlMapping, yarrrmlPlusToRml } from './rmlmapper';
import { type } from 'os';

export interface LiftingConfig {
  type: 'yarrrml' | 'rml';
  functions: string;
  xpathLib: string;
}

export const lifting = async (input: string, mapping: string, config: LiftingConfig): Promise<string> => {
  let mappingStr = mapping;
  if (config.type === 'yarrrml') {
    mappingStr = await yarrrmlPlusToRml(mapping);
  }

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(config.functions, sandbox);
  const defaultFnNamespace = 'http://actions.semantify.it/wasa/func/';

  console.log(config.xpathLib);

  const rmlOptions = {
    xpathLib: config.xpathLib,
    functions: Object.fromEntries(
      Object.entries(sandbox)
        .filter(([, v]) => typeof v === 'function')
        .map(([k, v]) => [defaultFnNamespace + k, v]),
    ),
  };
  const rmlResult = await runRmlMapping(mappingStr, input, rmlOptions);
  if (typeof rmlResult === 'object') {
    return JSON.stringify(rmlResult);
  }
  return rmlResult;
};
