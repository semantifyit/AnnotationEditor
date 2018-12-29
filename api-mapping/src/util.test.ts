import { deepMapValues, get, URLJoin } from './util';

describe('util', () => {
  it('deepMapValues', () => {
    const input = {
      foo: {
        12: 4,
        asd: 'rr',
      },
      arr: ['hi', { done: 'yes' }],
    };
    const output = {
      foo: {
        12: 4,
        asd: 'RR',
      },
      arr: ['HI', { done: 'YES' }],
    };
    const transform = (e: any) => (typeof e === 'string' ? e.toUpperCase() : e);

    expect(deepMapValues(input, transform)).toEqual(output);
  });

  it('get', () => {
    const obj = {
      foo: {
        12: 4,
        asd: 'rr',
      },
      arr: ['hi', { done: 'yes' }],
      deep: {
        very: {
          deep: {
            foo: 'aa',
          },
          mee: 'bb',
        },
      },
    };

    expect(get(obj, 'foo.12')).toEqual(4);
    expect(get(obj, 'foo.asd')).toEqual('rr');
    expect(get(obj, 'arr[0]')).toEqual('hi');
    expect(get(obj, 'arr[1].done')).toEqual('yes');
    expect(get(obj, 'deep.very.deep.foo')).toEqual('aa');
    expect(get(obj, 'deep.very.mee')).toEqual('bb');

    expect(get(obj, 'deep.asd')).toEqual(undefined);
    expect(get(obj, 'foo.asd.sdf')).toEqual(undefined);
    expect(get(obj, 'qqq.asd.sdf')).toEqual(undefined);
  });

  it('URLJoin', () => {
    expect(
      URLJoin('http://www.google.com', 'a', '/b/cd', '?foo=123', '?bar=foo'),
    ).toEqual('http://www.google.com/a/b/cd?foo=123&bar=foo');

    expect(
      URLJoin('http://www.google.com/', '/path', '?foo=123&bar=foo'),
    ).toEqual('http://www.google.com/path?foo=123&bar=foo');

    expect(URLJoin('http://www.google.com/', '/path')).toEqual(
      'http://www.google.com/path',
    );

    expect(URLJoin('http://www.google.com', '/path')).toEqual(
      'http://www.google.com/path',
    );

    expect(URLJoin('http://www.google.com/', 'path')).toEqual(
      'http://www.google.com/path',
    );

    expect(URLJoin('http://www.google.com', 'path')).toEqual(
      'http://www.google.com/path',
    );
    expect(URLJoin('http://www.google.com', undefined)).toEqual(
      'http://www.google.com',
    );
    expect(
      URLJoin(
        'http://www.google.com',
        undefined,
        undefined,
        'asd',
        undefined,
        undefined,
      ),
    ).toEqual('http://www.google.com/asd');

    expect(URLJoin('http://www.google.com')).toEqual('http://www.google.com');
  });
});
