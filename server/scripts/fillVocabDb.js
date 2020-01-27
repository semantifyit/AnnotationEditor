const got = require('got');
const fs = require('fs');

//const vocabs = [
// {
//   file: 'dachkg.jsonld',
//   name: 'Dackkg',
// },
// {
//   file: 'schema-pending.jsonld',
//   name: 'Schema.org Pending',
// },
// {
//   file: 'schema-auto.jsonld',
//   name: 'Schema.org Auto',
// },
// {
//   file: 'schema-bib.jsonld',
//   name: 'Schema.org Bib',
// },
// {
//   file: 'schema-health-lifesci.jsonld',
//   name: 'Schema.org Health&Lifesci',
// },
// {
//   file: 'webapi.ttl',
//   name: 'WebApi test',
// },
// {
//   file: 'mytestvocab.jsonld',
//   name: 'Superhero',
// },
//];

const vocabs = [
  {
    file: '/home/thiger/Downloads/kg_model.jsonld',
    // file: '/home/thiger/git/api-actions/server/vocabs/schema-bib.jsonld',
    name: 'Onlim',
  },
];

(async () => {
  for (const vocab of vocabs) {
    try {
      const body = {
        ogVocab: fs.readFileSync(vocab.file, 'utf-8'),
        name: vocab.name,
      };

      const resp = await got.post('http://localhost:9000/api/vocab', {
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
        },
      });
      //const v = JSON.parse(resp.body);
      //console.log(v);
    } catch (e) {
      console.log(e.response.body);
    }
  }
})();
