import { lowering, lifting } from './index';

// lowering(input, mappingStr, config): string

// lowering(action, "http://asd.com/{{spp ':path'}}/asd", {type: handlebars}) : "http://asd.com/foo/asd"

// lifting(resp, mappingStr, {type: yarrrml, rocketConfig: {}}): jsonld
(async () => {
  const action = {
    '@context': { '@vocab': 'http://schema.org/' },
    actionStatus: 'http://schema.org/ActiveActionStatus',
    name: ['foo', 'bar'],
    object: [
      {
        age: '12',
      },
      {
        age: '13',
      },
    ],
  };

  // const r = await lowering(
  //   JSON.stringify(action),
  //   '("hi" + spp(":name") + sppList(":object").map((id) => spp(id, ":age") + id).join("|"))',
  //   {
  //     type: 'javascript',
  //     prefixes: { '': 'http://schema.org/' },
  //   },
  // );
  // console.log(r);

  // const xq = `<FeratelDsiRQ xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  //   xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  //   xmlns="http://interface.deskline.net/DSI/XSD">
  //   <Request Originator="FERATEL" Company="FERATEL" Language="en">
  //       <Range Code="RG">
  //           <Item Id="F180FFD5-4FBF-4F2C-AC00-7E8B94462F2C" />
  //       </Range>
  //       <EventSearch From="{fn:spp(':name')}" To="{fn:sppList(':name')}"/>
  //        {for $i in fn:sppList(":object")
  //            return <e>{fn:spp($i, ":age")}</e>
  //        }
  //   </Request>
  // </FeratelDsiRQ>`;

  // const r = await lowering(JSON.stringify(action), xq, {
  //   type: 'xquery',
  //   prefixes: { '': 'http://schema.org/' },
  // });
  // console.log(r);

  const hand = `hello mate {{spp ":name"}} {{#each (sppList ":object")}}val: {{spp this ":age"}},{{/each}}`;

  const r = await lowering(JSON.stringify(action), hand, {
    type: 'handlebars',
    prefixes: { '': 'http://schema.org/' },
    functions: '',
  });
  console.log(r);
})();

// (async () => {
//   const r = await lifting(
//     `{
//     "persons": [
//         {
//             "firstname": "John",
//             "lastname": "Doe",
//             "speaks": [
//                 "de",
//                 "en"
//             ]
//         },
//         {
//             "firstname": "Jane",
//             "lastname": "Smith",
//             "speaks": [
//                 "fr",
//                 "es"
//             ]
//         }
//     ]
//   }`,
//     `prefixes:
//   schema: "http://schema.org/"
//   myfunc: "http://myfunc.com/"
// mappings:
//   person:
//     sources:
//       - ['input~jsonpath', '$.persons[*]']
//     s: http://example.com/$(firstname)
//     po:
//       - [a, schema:Person]
//       - [schema:name, $(firstname)]
//       - [schema:language, $(speaks.*)]
// `,
//     { type: 'yarrrml' },
//   );
//   console.log(r);
// })();
