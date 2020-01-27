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
