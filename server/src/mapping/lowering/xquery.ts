import { sync } from 'slimdom-sax-parser';
import slimdom from 'slimdom';
import { evaluateXPath, registerCustomXPathFunction, registerXQueryModule } from 'fontoxpath';
import { SPP } from './lowering';

let globalSpp: SPP = null;

registerCustomXPathFunction('fn:spp', ['xs:string'], 'xs:string', (_, pp) => {
  return globalSpp(pp)[0];
});
registerCustomXPathFunction('fn:spp', ['xs:string', 'xs:string'], 'xs:string', (_, id, pp) => {
  return globalSpp(id, pp)[0];
});
registerCustomXPathFunction('fn:sppList', ['xs:string'], 'xs:string*', (_, pp) => {
  return globalSpp(pp);
});
registerCustomXPathFunction('fn:sppList', ['xs:string', 'xs:string'], 'xs:string*', (_, id, pp) => {
  return globalSpp(id, pp);
});

registerCustomXPathFunction('fn:parse-xml', ['xs:string'], 'item()', (_, e) => {
  return sync(e);
});

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
  globalSpp = spp;
  const output = evaluateXPath(mapping, null, null, null, evaluateXPath.ANY_TYPE, {
    language: evaluateXPath.XQUERY_3_1_LANGUAGE,
    nodesFactory: new slimdom.Document() as any,
    // moduleImports: {
    //   s: 'https://sparql.com/',
    // },
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
};
