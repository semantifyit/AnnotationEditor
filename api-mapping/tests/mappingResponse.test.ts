import { responseMapping } from '../src';
import { fileToJSON } from './util';

describe('simple response mapping', () => {
  it('simple object', async () => {
    const mapping = {
      body: {
        foo: '$.result.bar',
      },
    };
    const input = {
      body: {
        foo: '123',
      },
    };
    const expectedResult = {
      result: {
        bar: '123',
      },
    };
    expect(await responseMapping(input, mapping)).toEqual(expectedResult);
  });

  it('body header', async () => {
    const input = { headers: {}, body: { data: 'foo' } };
    const mapping = {
      headers: {},
      body: '{\n    "data": "$.result.issueNumber"\n}',
    };
    const expectedResult = {
      result: {
        issueNumber: 'foo',
      },
    };
    expect(await responseMapping(input, mapping)).toEqual(expectedResult);
  });

  it('simple object git', async () => {
    const mapping = {
      url: '$.result.url',
      id: '$.result.identifier',
    };
    const input = {
      url: 'https://api.github.com/repos/ThibaultGerrier/Try1/issues/3',
      repository_url: 'https://api.github.com/repos/ThibaultGerrier/Try1',
      labels_url:
        'https://api.github.com/repos/ThibaultGerrier/Try1/issues/3/labels{/name}',
      comments_url:
        'https://api.github.com/repos/ThibaultGerrier/Try1/issues/3/comments',
      events_url:
        'https://api.github.com/repos/ThibaultGerrier/Try1/issues/3/events',
      html_url: 'https://github.com/ThibaultGerrier/Try1/issues/3',
      id: 391828911,
    };
    const expectedResult = {
      result: {
        url: 'https://api.github.com/repos/ThibaultGerrier/Try1/issues/3',
        identifier: 391828911,
      },
    };
    expect(await responseMapping({ body: input }, { body: mapping })).toEqual(
      expectedResult,
    );
  });
});

describe('new mapping', () => {
  it('issue-create', async () => {
    const mapping = fileToJSON(
      `${__dirname}/data/github-issue-create/action.json`,
    );
    const inOut1 = fileToJSON(
      `${__dirname}/data/github-issue-create/response_inout1.json`,
    );

    expect(
      await responseMapping(inOut1.input, mapping.responseMapping),
    ).toEqual(inOut1.output);
  });

  it('issue-list', async () => {
    const mapping = fileToJSON(
      `${__dirname}/data/github-issue-list/action.json`,
    );
    const inOut1 = fileToJSON(
      `${__dirname}/data/github-issue-list/response_inout1.json`,
    );

    expect(
      await responseMapping(inOut1.input, mapping.responseMapping),
    ).toEqual(inOut1.output);
  });

  it('fail issue-create', async () => {
    const mapping = fileToJSON(
      `${__dirname}/data/github-issue-create/action.json`,
    );
    const responseObj = {
      headers: {
        statusCode: 404,
      },
      body: {
        message: 'Not Found',
        documentation_url:
          'https://developer.github.com/v3/issues/#list-issues-for-a-repository',
      },
    };
    const expectedAction = {
      actionStatus: 'http://schema.org/FailedActionStatus',
    };

    expect(await responseMapping(responseObj, mapping.responseMapping)).toEqual(
      expectedAction,
    );
    expect(
      await responseMapping(responseObj, mapping.responseMapping, {
        evalMethod: 'vm-runInNewContext',
      }),
    ).toEqual(expectedAction);
  });
});

describe('xml', () => {
  it('simple object', async () => {
    const mapping = {
      body:
        '<root><data at="$.result.my" _set="$.result.@type=mytype">$.result.bar</data></root>',
    };
    const input = {
      body: '<root><data at="123">foo</data></root>',
    };
    const expectedResult = {
      result: {
        '@type': 'mytype',
        bar: 'foo',
        my: '123',
      },
    };
    expect(await responseMapping(input, mapping, { type: 'xml' })).toEqual(
      expectedResult,
    );
  });

  it('simple object 2', async () => {
    const mapping = { headers: {}, body: '<data>\n    $.result.name\n</data>' };
    const input = { headers: {}, body: '<data>\n    foo\n</data>' };
    const expectedResult = {
      result: {
        name: 'foo',
      },
    };
    expect(await responseMapping(input, mapping, { type: 'xml' })).toEqual(
      expectedResult,
    );
  });

  it('iterator', async () => {
    const mapping = {
      headers: {},
      body: '<data><ele ite="i">$.result[i].name</ele></data>',
    };
    const input = {
      headers: {},
      body: '<data><ele>one</ele><ele>two</ele></data>',
    };
    const expectedResult = {
      result: [
        {
          name: 'one',
        },
        {
          name: 'two',
        },
      ],
    };
    expect(await responseMapping(input, mapping, { type: 'xml' })).toEqual(
      expectedResult,
    );
  });
});

describe('rml', () => {
  it('simple object', async () => {
    const mapping = `
prefixes:
  schema: "http://schema.org/"
  myfunc: "http://myfunc.com/"
mappings:
  person:
    sources:
      - ['input~jsonpath', '$.persons[*]']
    s: http://example.com/$(firstname)
    po:
      - [a, schema:Person]
      - [schema:name, $(firstname)]
      - [schema:language, $(speaks.*)]
`;

    const input = {body:`{
  "persons": [
      {
          "firstname": "John",
          "lastname": "Doe",
          "speaks": [
              "de",
              "en"
          ]
      },
      {
          "firstname": "Jane",
          "lastname": "Smith",
          "speaks": [
              "fr",
              "es"
          ]
      }
  ]
}`};
    const expectedResult = [
      {
        '@id': 'http://example.com/John',
        '@type': 'Person',
        language: ['de', 'en'],
        name: 'John',
        '@context': {
          '@vocab': 'http://schema.org/',
        },
      },
      {
        '@id': 'http://example.com/Jane',
        '@type': 'Person',
        language: ['fr', 'es'],
        name: 'Jane',
        '@context': {
          '@vocab': 'http://schema.org/',
        },
      },
    ];
    expect(await responseMapping(input, {body: mapping}, { type: 'yarrrml' })).toEqual(
      expectedResult,
    );
  });
  it('2nd', async () => {
    const mapping = {
      headers: { status: '$.status' },
      body:
        // tslint:disable-next-line:max-line-length
        'prefixes:\n  schema: "http://schema.org/"\n  myfunc: "http://myfunc.com/"\nmappings:\n  person:\n    sources:\n      - [\'input~jsonpath\', \'$.persons[*]\']\n    s: http://example.com/$(firstname)\n    po:\n      - [a, schema:Person]\n      - [schema:name, $(firstname)]\n      - [schema:language, $(speaks.*)]\n',
    };

    const input = {
      headers: { status: '200' },
      body:
        // tslint:disable-next-line:max-line-length
        '{\n  "persons": [\n      {\n          "firstname": "John",\n          "lastname": "Doe",\n          "speaks": [\n              "de",\n              "en"\n          ]\n      },\n      {\n          "firstname": "Jane",\n          "lastname": "Smith",\n          "speaks": [\n              "fr",\n              "es"\n          ]\n      }\n  ]\n}',
    };
    const expectedResult = [
      {
        '@id': 'http://example.com/John',
        '@type': 'Person',
        language: ['de', 'en'],
        name: 'John',
        '@context': {
          '@vocab': 'http://schema.org/',
        },
        status: '200',
      },
      {
        '@id': 'http://example.com/Jane',
        '@type': 'Person',
        language: ['fr', 'es'],
        name: 'Jane',
        '@context': {
          '@vocab': 'http://schema.org/',
        },
        status: '200',
      },
    ];
    expect(await responseMapping(input, mapping, { type: 'yarrrml' })).toEqual(
      expectedResult,
    );
  });
});
