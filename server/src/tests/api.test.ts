import request from 'supertest';

import * as mongo from '../loaders/mongo';
import app from '../loaders/app';

describe('Test API', () => {
  beforeAll(async () => {
    await mongo.connect('actionsTest');
  });

  afterAll(async () => {
    await mongo.dropDB();
    await mongo.disconnect();
  });

  it('WebAPI routes', async () => {
    let res;
    res = await request(app).get('/api/webAPI');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);

    res = await request(app).get('/api/webAPI/1'); // not a mongo id
    expect(res.status).toEqual(400);

    res = await request(app).get('/api/webAPI/5a5c9ba18f168f0744a17461');
    expect(res.status).toEqual(404);

    res = await request(app)
      .post('/api/webAPI')
      .send({ name: 'john' });
    expect(res.status).toEqual(400);

    const webAPI = {
      path: 'p',
      annotation: { name: 'n' },
      author: 'a',
    };
    res = await request(app)
      .post('/api/webAPI')
      .send(webAPI);
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(webAPI);

    const webAPIId = res.body._id;

    webAPI.path = 'p2';
    res = await request(app)
      .patch(`/api/webAPI/${webAPIId}`)
      .send(webAPI);
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(webAPI);

    res = await request(app).get('/api/webAPI');
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject([webAPI]);

    res = await request(app).get(`/api/webAPI/${webAPIId}`);
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(webAPI);

    res = await request(app).delete(`/api/webAPI/${webAPIId}`);
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(webAPI);

    res = await request(app).get('/api/webAPI');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it('Vocab routes', async () => {
    let res;
    res = await request(app)
      .post('/api/vocab/parse')
      .send({ vocab: '' });

    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject([]); // no nodes

    const expVocab = [
      {
        '@id': 'http://verkehrsauskunft.at/vocab/Station',
        '@type': ['http://www.w3.org/2000/01/rdf-schema#Class'],
        'http://www.w3.org/2000/01/rdf-schema#label': [
          { '@language': 'en', '@value': 'Station' },
        ],
        'http://www.w3.org/2000/01/rdf-schema#comment': [
          { '@value': 'A VAO bus station / bus stop' },
        ],
        'http://www.w3.org/2000/01/rdf-schema#subClassOf': [
          { '@id': 'http://schema.org/Place' },
        ],
      },
    ];

    res = await request(app)
      .post('/api/vocab/parse')
      .send({
        vocab: `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix schema: <http://schema.org/> .
  @prefix vao: <http://verkehrsauskunft.at/vocab/> .
  
  vao:Station a rdfs:Class ;
      rdfs:label "Station"@en ;
      rdfs:comment "A VAO bus station / bus stop" ;
      rdfs:subClassOf schema:Place .`,
      });
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(expVocab);

    res = await request(app)
      .post('/api/vocab/parse')
      .send({
        vocab: JSON.stringify({
          '@context': {
            vao: 'http://verkehrsauskunft.at/vocab/',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            schema: 'http://schema.org/',
          },
          '@graph': [
            {
              '@id': 'vao:Station',
              '@type': 'rdfs:Class',
              'rdfs:comment': 'A VAO bus station / bus stop',
              'rdfs:label': { '@value': 'Station', '@language': 'en' },
              'rdfs:subClassOf': {
                '@id': 'schema:Place',
              },
            },
          ],
        }),
      });
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(expVocab);

    res = await request(app).get('/api/vocab');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);

    res = await request(app).get('/api/vocab/1'); // not a mongo id
    expect(res.status).toEqual(400);

    res = await request(app).get('/api/vocab/5a5c9ba18f168f0744a17461');
    expect(res.status).toEqual(404);

    res = await request(app)
      .post('/api/vocab')
      .send({ name: 'john' });
    expect(res.status).toEqual(400);

    const vocab = {
      name: 'sample vocab',
      vocab: JSON.stringify(expVocab),
    };
    res = await request(app)
      .post('/api/vocab')
      .send(vocab);

    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(vocab);

    const vocabId = res.body._id;

    vocab.name = 'updated name';
    res = await request(app)
      .patch(`/api/vocab/${vocabId}`)
      .send(vocab);

    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(vocab);

    res = await request(app).get('/api/vocab');
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject([vocab]);

    res = await request(app).get(`/api/vocab/${vocabId}`);
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(vocab);

    res = await request(app).delete(`/api/vocab/${vocabId}`);
    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject(vocab);

    res = await request(app).get('/api/vocab');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);
  });
});
