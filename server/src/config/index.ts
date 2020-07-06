export default {
  version: '1.0.0',
  port: 8012,
  baseUrl: 'http://localhost:8012',
  graphdb: {
    url: 'https://graphdb.sti2.at',
    repo: 'sdo-webapi',
  },
  mongoUrl: process.env.LOCAL ? 'mongodb://localhost:27017/' : 'mongodb://mongodb:27017/',
};
