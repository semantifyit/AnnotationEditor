export default {
  port: 8012,
  url: 'https://actions.semantify.it',
  graphdb: {
    url: 'https://graphdb.sti2.at',
    repo: 'sdo-webapi',
  },
  mongoUrl: process.env.LOCAL ? 'mongodb://localhost:27017/' : 'mongodb://mongodb:27017/',
};
