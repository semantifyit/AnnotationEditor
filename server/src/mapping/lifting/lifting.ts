import { runRmlMapping, yarrrmlPlusToRml } from './rmlmapper';

export interface LiftingConfig {
  type: 'yarrrml' | 'rml';
  rmlOptions?: object;
}

export const lifting = async (input: string, mapping: string, config: LiftingConfig): Promise<string> => {
  let mappingStr = mapping;
  if (config.type === 'yarrrml') {
    mappingStr = await yarrrmlPlusToRml(mapping);
  }
  const rmlResult = await runRmlMapping(mappingStr, input, config.rmlOptions);
  if (typeof rmlResult === 'object') {
    return JSON.stringify(rmlResult);
  }
  return rmlResult;
};
