import { requestMapping } from '../src';

describe('mapping request github issue create', () => {
  const mapping = {
    url: 'https://api.github.com',
    path: ['repos', '$.object.author.name', '$.object.name', 'issues'],
    headers: {
      Authorization: "$.agent.identifier |> (i => 'token ' + i)",
    },
    body: {
      title: '$.result.name',
      body: '$.result.description',
      labels: '$.result.genre',
    },
  };

  it('1st', async () => {
    const inputAction = {
      '@context': 'http://schema.org/',
      '@type': 'CreateAction',
      name: 'Create Issues in repository',
      agent: {
        '@type': 'Person',
        identifier: '123',
      },
      object: {
        '@type': 'SoftwareSourceCode',
        name: 'Try1',
        author: {
          '@type': 'Person',
          name: 'ThibaultGerrier',
        },
      },
      result: {
        '@type': 'PublicationIssue',
        name: 'Title 1',
        description: 'Body 1',
        genre: ['bug', 'test'],
      },
    };
    const expectedRequest = {
      url: 'https://api.github.com/repos/ThibaultGerrier/Try1/issues',
      headers: {
        Authorization: 'token 123',
      },
      body: {
        title: 'Title 1',
        body: 'Body 1',
        labels: ['bug', 'test'],
      },
    };

    expect(await requestMapping(inputAction, mapping)).toEqual(expectedRequest);
    expect(
      await requestMapping(inputAction, mapping, {
        evalMethod: 'vm-runInNewContext',
      }),
    ).toEqual(expectedRequest);
  });
});

describe('mapping request github issue list', () => {
  const mapping = {
    url: 'https://api.github.com',
    path: ['repos', '$.object.author.name', '$.object.name', 'issues'],
  };

  it('1st', async () => {
    const inputAction = {
      '@context': 'http://schema.org/',
      '@type': 'FindAction',
      object: {
        '@type': 'SoftwareSourceCode',
        name: 'Try1',
        author: {
          '@type': 'Person',
          name: 'ThibaultGerrier',
        },
      },
    };
    const expectedRequest = {
      url: 'https://api.github.com/repos/ThibaultGerrier/Try1/issues',
    };

    expect(await requestMapping(inputAction, mapping)).toEqual(expectedRequest);
  });
});

describe('url only', () => {
  const mapping = {
    url: 'https://api.github.com/repos/thibaultgerrier/Try1/issues',
    query: {},
    body: {},
    path: [],
  };

  it('1st', async () => {
    const expectedRequest = {
      url: 'https://api.github.com/repos/thibaultgerrier/Try1/issues',
    };

    expect(await requestMapping({}, mapping)).toEqual(expectedRequest);
  });
});

describe('xml', () => {
  it('1st', async () => {
    const mapping = {
      url: 'foo',
      body: '<root><data>$.foo</data></root>',
    };
    const expectedRequest = {
      url: 'foo',
      body:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><root><data>bar</data></root>',
    };
    const input = { foo: 'bar' };

    expect(await requestMapping(input, mapping)).toEqual(expectedRequest);
    expect(await requestMapping(input, mapping, { type: 'xml' })).toEqual(
      expectedRequest,
    );
  });
});

describe('with code body', () => {
  it('string', async () => {
    const mapping = {
      url: 'foo',
      body: '$.foo',
    };
    const input = { foo: 'asd' };
    const expectedRequest = {
      url: 'foo',
      body: 'asd',
    };

    expect(await requestMapping(input, mapping, { type: 'js' })).toEqual(
      expectedRequest,
    );
  });

  it('xml tagname', async () => {
    const mapping = {
      url: 'foo',
      body: '`<xml><${$.foo}>data</${$.foo}></xml>`',
    };
    const input = { foo: 'asd' };
    const expectedRequest = {
      url: 'foo',
      body: '<xml><asd>data</asd></xml>',
    };

    expect(await requestMapping(input, mapping, { type: 'js' })).toEqual(
      expectedRequest,
    );
  });

  it('function', async () => {
    const mapping = {
      url: 'foo',
      body: `(() => {
      const addOne = (str) => parseInt(str) +1;
      return addOne($.foo).toString();
      })()`,
    };
    const input = { foo: '1' };
    const expectedRequest = {
      url: 'foo',
      body: '2',
    };

    expect(await requestMapping(input, mapping, { type: 'js' })).toEqual(
      expectedRequest,
    );
  });
});
