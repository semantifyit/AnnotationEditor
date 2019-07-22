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
  it('simple object', async () => {
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
      body: '<root><data at="$.result.my">$.result.bar</data></root>',
    };
    const input = {
      body: '<root><data at="123">foo</data></root>',
    };
    const expectedResult = {
      result: {
        bar: 'foo',
        my: '123',
      },
    };
    expect(await responseMapping(input, mapping, { type: 'xml' })).toEqual(
      expectedResult,
    );
  });
});

describe('rml', () => {
  it('simple object', async () => {
    const mapping = {
      body: `
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
`,
    };
    const input = `{
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
}`;
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
    expect(await responseMapping(input, mapping, { type: 'yarrrml' })).toEqual(
      expectedResult,
    );
  });
});
