import * as fs from 'fs';
import { responseMapping } from '../src/mapper';

describe('simple response mapping', () => {
  it('simple object', () => {
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
    expect(responseMapping({ body: input }, { body: mapping })).toEqual(
      expectedResult,
    );
  });
});

describe('mapping response github issue list', () => {
  const mapping = {
    headers: {
      statusCode:
        '$.actionStatus |> (c => c === "200" ? "http://schema.org/CompletedActionStatus" : "http://schema.org/FailedActionStatus")',
    },
    body: [
      {
        url: '$.result.url',
        id: '$.result.identifier',
        number: '$.result.issueNumber',
        title: '$.result.name',
        user: {
          login: '$.result.author.name |> ((i) => i.toUpperCase())',
          id: '$.result.author.identifier',
          avatar_url: '$.result.author.image',
          url: '$.result.author.url',
        },
        labels: [
          // {
          //   name: '$.result.genre.name',
          //   color: '$.result.genre.color',
          // },
          {
            $merge: true,
            name: '$.result.genre',
          },
        ],
        created_at: '$.result.dateCreated',
        updated_at: '$.result.dateModified',
        body: '$.result.description',
      },
    ],
  };
  console.log(JSON.stringify(mapping, null, 4));
  it('success', () => {
    const response = JSON.parse(
      fs.readFileSync('./tests/data/github-issue-list-response.json', 'utf-8'),
    );
    const responseObj = {
      headers: {
        statusCode: 200,
      },
      body: response,
    };
    const expectedAction = {
      actionStatus: 'http://schema.org/CompletedActionStatus',
      result: [
        {
          author: {
            identifier: 10177712,
            image: 'https://avatars2.githubusercontent.com/u/10177712?v=4',
            name: 'THIBAULTGERRIER',
            url: 'https://api.github.com/users/ThibaultGerrier',
          },
          dateCreated: '2018-12-17T18:05:24Z',
          dateModified: '2018-12-17T18:10:39Z',
          description: 'this issue was edited',
          genre: ['bug', 'test'],
          identifier: 391828911,
          issueNumber: 3,
          name: 'Second Issue from API',
          url: 'https://api.github.com/repos/ThibaultGerrier/Try1/issues/3',
        },
        {
          author: {
            identifier: 10177712,
            image: 'https://avatars2.githubusercontent.com/u/10177712?v=4',
            name: 'THIBAULTGERRIER',
            url: 'https://api.github.com/users/ThibaultGerrier',
          },
          dateCreated: '2018-12-17T18:04:12Z',
          dateModified: '2018-12-17T18:04:12Z',
          description: 'hello there',
          identifier: 391828528,
          issueNumber: 2,
          name: 'New Issue from API',
          url: 'https://api.github.com/repos/ThibaultGerrier/Try1/issues/2',
        },
        {
          author: {
            identifier: 10177712,
            image: 'https://avatars2.githubusercontent.com/u/10177712?v=4',
            name: 'THIBAULTGERRIER',
            url: 'https://api.github.com/users/ThibaultGerrier',
          },
          dateCreated: '2018-12-17T17:43:30Z',
          dateModified: '2018-12-17T17:43:30Z',
          description: 'A first Issue',
          identifier: 391820881,
          issueNumber: 1,
          name: 'Test Issue',
          url: 'https://api.github.com/repos/ThibaultGerrier/Try1/issues/1',
        },
      ],
    };

    expect(responseMapping(responseObj, mapping)).toEqual(expectedAction);
    expect(
      responseMapping(responseObj, mapping, {
        evalMethod: 'vm-runInNewContext',
      }),
    ).toEqual(expectedAction);
  });

  it('fail', () => {
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

    expect(responseMapping(responseObj, mapping)).toEqual(expectedAction);
    expect(
      responseMapping(responseObj, mapping, {
        evalMethod: 'vm-runInNewContext',
      }),
    ).toEqual(expectedAction);
  });
});
