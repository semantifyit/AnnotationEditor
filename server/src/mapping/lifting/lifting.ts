import * as vm from 'vm';
import { VM } from 'vm2';
import { runRmlMapping, yarrrmlPlusToRml } from './rmlmapper';

const defaultFnNamespace = 'http://actions.semantify.it/wasa/func/';

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

  const rmlFunctions: any = {};
  const registerFunction = (fnName: string, fn: any) => {
    rmlFunctions[defaultFnNamespace + fnName] = fn;
  };
  const sandbox = {
    registerFunction,
  };
  const vmInst = new VM({
    timeout: 1000,
    sandbox,
  });
  vmInst.run(config.functions);

  //vm.createContext(sandbox);
  //vm.runInContext(config.functions, sandbox);

  const rmlOptions = {
    xpathLib: config.xpathLib,
    functions: rmlFunctions,
  };
  const rmlResult = await runRmlMapping(mappingStr, input, rmlOptions);
  if (typeof rmlResult === 'object') {
    return JSON.stringify(rmlResult);
  }
  return rmlResult;
};
