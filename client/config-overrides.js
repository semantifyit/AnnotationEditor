module.exports = function override(config, env) {
  console.log(config.devServer);
  console.log(config.devServer && config.devServer.port);
  config.externals = {
    '@trust/webcrypto': 'crypto',
    'isomorphic-fetch': 'fetch',
    'node-fetch': 'fetch',
    'text-encoding': 'TextEncoder',
    'whatwg-url': 'window',
  };
  return config;
};
