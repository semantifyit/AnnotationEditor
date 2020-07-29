const getMySdoAdapter = () => ({
  getClass: (c) => ({ getSuperClasses: () => [c] }),
  getEnumeration: () => {
    throw new Error();
  },
});

const setSdoAdapter = () => {};

module.exports = {
  setSdoAdapter,
  getMySdoAdapter,
};
