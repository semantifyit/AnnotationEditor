import {
  deepMapValues,
  get,
  isEmptyObject,
  replaceIterators,
  set,
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

  // it('merge', () => {
  //   expect(mergeDiff({ a: 1, b: 2 }, { c: 4 })).toEqual({ a: 1, b: 2, c: 4 });
  //   expect(mergeDiff({ a: 1, b: 2 }, { a: 3, c: 4 })).toEqual({
  //     a: [1, 3],
  //     b: 2,
  //     c: 4,
  //   });
  //   expect(
  //     mergeDiff({ a: { a: 1, b: 2 } }, { a: { d: 5, e: 6 }, c: 4 }),
  //   ).toEqual({
  //     a: [{ a: 1, b: 2 }, { d: 5, e: 6 }],
  //     c: 4,
  //   });
  //   expect(
  //     mergeDiff({ a: { a: 1 } }, { a: { a: 2 } }, { a: { a: 3 } }),
  //   ).toEqual({ a: [{ a: 1 }, { a: 2 }, { a: 3 }] });
  //
  //   expect(mergeSame({ a: { b: 1 } }, { a: { c: { d: 4 } } })).toEqual({
  //     a: { b: 1, c: { d: 4 } },
  //   });
  // });
  //
  // it('merge same', () => {
  //   expect(
  //     mergeSame({ result: { genre: 'bug' } }, { result: { genre: 'test' } }),
  //   ).toEqual({ result: { genre: ['bug', 'test'] } });
  //
  //   expect(
  //     mergeSame({ a: { t: 'type' } }, { a: [{ b: 'foo' }, { b: 'hey' }] }),
  //   ).toEqual({ a: [{ b: 'foo', t: 'type' }, { b: 'hey', t: 'type' }] });
  // });
  //
  // it('merge new', () => {
  //   const a = { name: 'thi', location: { city: 'ibk' } };
  //   const b = { name: 'phil', location: { city: 'dbn' } };
  //   const resDiff = [
  //     { name: 'thi', location: { city: 'ibk' } },
  //     { name: 'phil', location: { city: 'dbn' } },
  //   ];
  //   const resSameDeep = {
  //     name: ['thi', 'phil'],
  //     location: { city: ['ibk', 'dbn'] },
  //   };
  //   const resSameFirstLevel = {
  //     name: ['thi', 'phil'],
  //     location: [{ city: 'ibk' }, { city: 'dbn' }],
  //   };
  //
  //   expect(mergeDiff(a, b)).toEqual(resDiff);
  // });

  it('merge with action', () => {
    const output = {
      result: [{ name: 'thi' }, { name: 'phil', location: { city: 'dbn' } }],
    };
    const action = {
      '@context': 'http://schema.org/',
      '@type': 'Action',
      result: {
        '@type': 'Person',
        'name-input': 'required',
        description: 'the guy',
        location: {
          '@type': 'Place',
          'city-input': 'required',
          country: 'AT',
        },
      },
    };
    const result = {
      '@context': 'http://schema.org/',
      '@type': 'Action',
      result: [
        {
          '@type': 'Person',
          name: 'thi',
          description: 'the guy',
        },
        {
          '@type': 'Person',
          name: 'phil',
          description: 'the guy',
          location: {
            '@type': 'Place',
            city: 'dbn',
            country: 'AT',
          },
        },
      ],
    };
    // expect(mergeResult(output, action)).toEqual(result);
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

  it('set', () => {
    let a = {};
    set(a, 'a', 1);
    expect(a).toEqual({ a: 1 });
    set(a, 'a', 3);
    expect(a).toEqual({ a: [1, 3] });
    set(a, 'a', 5);
    expect(a).toEqual({ a: [1, 3, 5] });
    set(a, 'a', [1]);
    expect(a).toEqual({ a: [1, 3, 5, [1]] });
    set(a, 'a', { a: 1 });
    expect(a).toEqual({ a: [1, 3, 5, [1], { a: 1 }] });

    a = {};
    set(a, 'a.b', [1, 2]);
    expect(a).toEqual({ a: { b: [1, 2] } });
    set(a, 'a', 4);
    expect(a).toEqual({ a: [{ b: [1, 2] }, 4] });
    set(a, 'a.b', { c: 1 });
    expect(a).toEqual({ a: [{ b: [1, 2, { c: 1 }] }, 4] });
    set(a, 'a', {});
    expect(a).toEqual({ a: [{ b: [1, 2, { c: 1 }] }, 4, {}] });
    set(a, 'a.b.c', 2);
    expect(a).toEqual({
      a: [{ b: [1, 2, { c: [1, 2] }] }, 4, { b: { c: 2 } }],
    });
    set(a, 'a[0].b.c', 3);
    expect(a).toEqual({
      a: [{ b: [1, 2, { c: [1, 2, 3] }] }, 4, { b: { c: 2 } }],
    });

    a = {};
    set(a, 'a', []);
    expect(a).toEqual({ a: [] });
    set(a, 'a[0]', 1);
    expect(a).toEqual({ a: [1] });

    a = {};
    set(a, 'a[0]', 1);
    expect(a).toEqual({ a: [1] });
    set(a, 'a[0]', 2);
    expect(a).toEqual({ a: [[1, 2]] });
    set(a, 'a[1]', 3);
    expect(a).toEqual({ a: [[1, 2], 3] });
    set(a, 'a[1].b', 3);
    expect(a).toEqual({ a: [[1, 2], [3, { b: 3 }]] });
    a = { a: [[1, 2], 3] };
    set(a, 'a[1].b.c', 3);
    expect(a).toEqual({ a: [[1, 2], [3, { b: { c: 3 } }]] });

    a = {};
    set(a, 'a[0][0]', 1);
    expect(a).toEqual({ a: [[1]] });

    a = {};
    set(a, '$[0]', 1);
    set(a, '$[1]', 12);
    expect(a).toEqual({ $: [1, 12] });

    a = {};
    set(a, '$.result[0].name', 'hi');
    expect(a).toEqual({ $: { result: [{ name: 'hi' }] } });
    set(a, '$.result[1].name', 'hello');
    expect(a).toEqual({ $: { result: [{ name: 'hi' }, { name: 'hello' }] } });
    set(a, '$.result[0].desc', 'foo');
    expect(a).toEqual({
      $: { result: [{ name: 'hi', desc: 'foo' }, { name: 'hello' }] },
    });
  });

  it('replaceIterators', () => {
    const ite = {
      i: 0,
      ite: 1,
      j: 2,
    };
    expect(replaceIterators('$[i]', ite)).toBe('$[0]');
    expect(replaceIterators('$[ite]', ite)).toBe('$[1]');
    expect(replaceIterators('$[j]', ite)).toBe('$[2]');
    expect(replaceIterators('$[i][j]', ite)).toBe('$[0][2]');
    expect(replaceIterators('$[i][j].ite.j[ite]', ite)).toBe(
      '$[0][2].ite.j[1]',
    );
  });
});
