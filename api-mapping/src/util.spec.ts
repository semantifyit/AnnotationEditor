import {
  deepMapValues,
  get,
  isEmptyObject,
  mergeDiff,
  mergeSame,
  URLJoin,
} from './util';

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
    expect(URLJoin('a')).toEqual('a');
    expect(URLJoin('a', '')).toEqual('a');
    expect(
      URLJoin('https://api.github.com/repos/thibaultgerrier/Try1/issues'),
    ).toEqual('https://api.github.com/repos/thibaultgerrier/Try1/issues');
    expect(URLJoin('a', undefined, undefined)).toEqual('a');

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

  it('merge', () => {
    expect(mergeDiff({ a: 1, b: 2 }, { c: 4 })).toEqual({ a: 1, b: 2, c: 4 });
    expect(mergeDiff({ a: 1, b: 2 }, { a: 3, c: 4 })).toEqual({
      a: [1, 3],
      b: 2,
      c: 4,
    });
    expect(
      mergeDiff({ a: { a: 1, b: 2 } }, { a: { d: 5, e: 6 }, c: 4 }),
    ).toEqual({
      a: [{ a: 1, b: 2 }, { d: 5, e: 6 }],
      c: 4,
    });
    expect(
      mergeDiff({ a: { a: 1 } }, { a: { a: 2 } }, { a: { a: 3 } }),
    ).toEqual({ a: [{ a: 1 }, { a: 2 }, { a: 3 }] });

    expect(mergeSame({ a: { b: 1 } }, { a: { c: { d: 4 } } })).toEqual({
      a: { b: 1, c: { d: 4 } },
    });
  });

  it('merge same', () => {
    expect(
      mergeSame({ result: { genre: 'bug' } }, { result: { genre: 'test' } }),
    ).toEqual({ result: { genre: ['bug', 'test'] } });
  });

  it('isEmptyObject', () => {
    expect(isEmptyObject(null)).toBe(true);
    expect(isEmptyObject(undefined)).toBe(true);
    expect(isEmptyObject([])).toBe(true);
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyObject([1])).toBe(false);
    expect(isEmptyObject({ a: 1 })).toBe(false);
    expect(isEmptyObject('hi')).toBe(false);
  });
});
