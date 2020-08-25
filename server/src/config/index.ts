export default {
  version: '1.0.0',
  port: 8012,
  baseUrl: process.env.LOCAL ? 'http://localhost:8012' : 'https://actions.semantify.it',
  graphdb: {
    enabled: true,
    url: 'https://graphdb.sti2.at',
    repo: 'wasa',
    username: 'wasa',
    password: process.env.GRAPHDB_PASSWORD,
  },
  mongoUrl: process.env.LOCAL ? 'mongodb://localhost:27017/' : 'mongodb://mongodb:27017/',
};
