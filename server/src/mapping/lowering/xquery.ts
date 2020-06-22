import * as vm from 'vm';
import * as slimdomParser from 'slimdom-sax-parser';
import slimdom from 'slimdom';
import * as fontoXpathGlobal from 'fontoxpath';
import importFresh from 'import-fresh';

import { SPP } from './lowering';

// let globalSpp: SPP = null;

// registerXQueryModule(`
// module namespace s = "https://sparql.com/";
// declare %public function s:ppEach($p as xs:string, $fn as item()*)
// as item()*
// {
//     fn:for-each(
//         fn:spp($p),
//         function($id) {
//             $fn(function($newPP) {
//                 fn:spp($id, $newPP)
//             })
//         }
//     )
// };
// `);

export const xquery = (mapping: string, spp: SPP, config: any): string => {
  const fontoXpath = importFresh('fontoxpath') as typeof fontoXpathGlobal;
  const { evaluateXPath, registerCustomXPathFunction, registerXQueryModule } = fontoXpath;

  const sppSingle = (...args: any): any => spp(...args)[0];
  const sandbox: any = {
    spp: sppSingle,
    sppList: spp,
    registerXQueryModule,
    registerCustomXPathFunction,
  };

  vm.createContext(sandbox);
  vm.runInContext(config.functions, sandbox);

  sandbox.evaluateXPath = evaluateXPath;
  sandbox.slimdom = slimdom;
  sandbox.mapping = mapping;
  sandbox.slimdomParser = slimdomParser;

  // as you cannot register custom xquery functions for one instance,
  // run each mapping in own vm instance, and register functions there
  // const returnVal = vm.runInContext(
  //   `
  // (() => {
  registerCustomXPathFunction('fn:spp', ['xs:string'], 'xs:string', (_, pp) => {
    return spp(pp)[0];
  });
  registerCustomXPathFunction('fn:spp', ['xs:string', 'xs:string'], 'xs:string', (_, id, pp) => {
    return spp(id, pp)[0];
  });
  registerCustomXPathFunction('fn:sppList', ['xs:string'], 'xs:string*', (_, pp) => {
    return spp(pp);
  });
  registerCustomXPathFunction('fn:sppList', ['xs:string', 'xs:string'], 'xs:string*', (_, id, pp) => {
    return spp(id, pp);
  });

  registerCustomXPathFunction('fn:parse-xml', ['xs:string'], 'item()', (_, e) => {
    return slimdomParser.sync(e);
  });

  const output = evaluateXPath(mapping, null, null, null, evaluateXPath.ANY_TYPE, {
    language: evaluateXPath.XQUERY_3_1_LANGUAGE,
    nodesFactory: new slimdom.Document() as any,
    debug: true,
  });

  if (typeof output === 'string') {
    return output;
  }
  if (output instanceof slimdom.Element) {
    return slimdom.serializeToWellFormedString(output);
  }
  if (typeof output === 'object') {
    return JSON.stringify(output);
  }
  throw new Error('Unknown Xquery output type');
  // })();
  // // `,
  // //   sandbox,
  // // );
  //
  // return returnVal;
};
