import * as fs from 'fs';
import { responseMapping } from '../src/mapper';
import { fileToJSON } from './util';

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

describe('new mapping', () => {
  it('issue-create', () => {
    const mapping = fileToJSON(
      `${__dirname}/data/github-issue-create/action.json`,
    );
    const inOut1 = fileToJSON(
      `${__dirname}/data/github-issue-create/response_inout1.json`,
    );

    expect(responseMapping(inOut1.input, mapping.responseMapping)).toEqual(
      inOut1.output,
    );
  });

  it('issue-list', () => {
    const mapping = fileToJSON(
      `${__dirname}/data/github-issue-list/action.json`,
    );
    const inOut1 = fileToJSON(
      `${__dirname}/data/github-issue-list/response_inout1.json`,
    );

    expect(responseMapping(inOut1.input, mapping.responseMapping)).toEqual(
      inOut1.output,
    );
  });

  it('fail issue-create', () => {
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

    expect(responseMapping(responseObj, mapping.responseMapping)).toEqual(
      expectedAction,
    );
    expect(
      responseMapping(responseObj, mapping.responseMapping, {
        evalMethod: 'vm-runInNewContext',
      }),
    ).toEqual(expectedAction);
  });
});
