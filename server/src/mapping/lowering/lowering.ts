import { SPPEvaluator, evalPath, Literal, NamedNode, takeAll, SPPEval } from 'sparql-property-paths';
import { javascript } from './javascript';
import { xquery } from './xquery';
import { handlebars } from './handlebars';

export interface LoweringConfig {
  type: 'handlebars' | 'xquery' | 'javascript';
  prefixes?: Record<string, string>;
}

export type SPP = (...args: [string] | [string, string]) => string[];

export const lowering = async (input: string, mapping: string, config: LoweringConfig): Promise<string> => {
  const [sppWithId, graph] = await SPPEvaluator(input, 'jsonld'); // TODO inputtype dependent on request content-type header

  const actionIds = takeAll(
    evalPath(graph, [
      undefined,
      new NamedNode('http://schema.org/actionStatus'),
      new Literal('http://schema.org/ActiveActionStatus'),
    ]),
  );

  if (actionIds.length !== 1 || !actionIds?.[0]?.[0]?.value) {
    throw new Error('Incoming Action has no or more than 1 schema:actionStatus ActiveActionStatus');
  }

  const actionId = actionIds[0][0].value;

  const spp: SPP = (...args) =>
    args.length === 2
      ? sppWithId(args[0], args[1], config.prefixes)
      : sppWithId(actionId, args[0], config.prefixes);

  switch (config.type) {
    case 'javascript':
      return javascript(mapping, spp, config);
    case 'xquery':
      return xquery(mapping, spp, config);
    case 'handlebars':
      return handlebars(mapping, spp, config);
    default:
      throw new Error(`Unknown lowering type: ${config.type}`);
  }
};
