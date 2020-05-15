import express from 'express';

export const waitFor = (time: number): Promise<void> =>
  new Promise((res): void => {
    setTimeout(() => {
      res();
    }, time);
  });

export const withTries = <T, U>(
  fn: (...args: U[]) => Promise<T>,
  numTries = 10,
  timeout = 1000,
): ((...args: U[]) => Promise<T>) => (...args: U[]): Promise<T> => {
  const retry = async (n = numTries): Promise<T> => {
    try {
      const ret = await fn(...args);
      return ret;
    } catch (err) {
      if (n === 1) throw err;
      await waitFor(timeout);
      return retry(n - 1);
    }
  };
  return retry();
};

export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

export const toArray = <T>(o: T | T[]): T[] => (Array.isArray(o) ? o : [o]);

export const withTryCatch = async (res: express.Response, fn: () => Promise<void>): Promise<void> => {
  try {
    await fn();
  } catch (e) {
    res.status(400).json({ err: e.toString() });
  }
};

export const stringIsValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (_) {
    return false;
  }
};

export const isOneLevelStringJSON = (obj: string): boolean =>
  stringIsValidJSON(obj) && Object.values(JSON.parse(obj)).every((e) => typeof e === 'string');

export const allButFist = <T>(arr: T[]): T[] => arr.slice(1);
