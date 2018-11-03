module.exports = function override(config, env) {
  config.externals = {
    '@trust/webcrypto': 'crypto',
    'isomorphic-fetch': 'fetch',
    'node-fetch': 'fetch',
    'text-encoding': 'TextEncoder',
    'whatwg-url': 'window',
  };
  return config;
};
