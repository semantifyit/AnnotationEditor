export default {
  version: '1.0.0',
  port: 8009,
  baseUrl:
    process.env.BASE_URL || (process.env.LOCAL ? 'http://localhost:8009' : 'https://actions.semantify.it'),
  graphdb: {
    enabled: process.env.GRAPHDB_ENABLED ? toBool(process.env.GRAPHDB_ENABLED) : true,
    url: process.env.GRAPHDB_URL || 'https://graphdb.sti2.at',
    repo: process.env.GRAPHDB_REPOSITORY || 'wasa',
    username: process.env.GRAPHDB_USERNAME || 'wasa',
    password: process.env.GRAPHDB_PASSWORD,
  },
  mongoUrl:
    process.env.MONGO_URL || (process.env.LOCAL ? 'mongodb://localhost:27017/' : 'mongodb://mongodb:27017/'),
};

function toBool(str?: string) {
  return str && str === 'true';
}
