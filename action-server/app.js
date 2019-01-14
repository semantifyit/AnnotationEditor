const http = require('http');
const fs = require('fs');
const path = require('path');

// const { requestMapping } = require('./api-mapping');
// console.log(requestMapping({}, {url: 'http://example.com'}));

const joinURL = (...args) =>
  args
    .filter((a) => !!a)
    .join('/')
    .replace(/[\/]+/g, '/')
    .replace(/^(.+):\//, '$1://');

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'),
);
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'actions.json'), 'utf-8'),
);
const preProcessData = () => {
  const {
    baseUrl,
    usePort,
    port,
    pathPrefix,
    actionList,
    actionTarget,
  } = config;

  // webapi documentation url points to action list
  const actionListUrl = joinURL(
    baseUrl + (usePort ? ':' + port : ''),
    pathPrefix,
    actionList,
  );
  if (Array.isArray(data.webAPI.documentation)) {
    data.webAPI.documentation = data.webAPI.documentation.map((doc) => {
      doc.url = actionListUrl;
    });
  } else if (typeof data.webAPI.documentation === 'object') {
    data.webAPI.documentation.url = actionListUrl;
  }

  const actionTargetUrl = joinURL(
    baseUrl + (usePort ? ':' + port : ''),
    pathPrefix,
    actionTarget,
  );

  // potentialActions target
  data.actions.map((action) => {
    action.potentialAction.target.urlTemplate = joinURL(
      actionTargetUrl,
      action.id,
    );
    return action;
  });
};
preProcessData();

http
  .createServer((req, res) => {
    const { method, url } = req;
    res.setHeader('Content-Type', 'application/ld+json');

    // entryPoint
    if (url === joinURL(config.pathPrefix, config.entryPoint)) {
      res.write(JSON.stringify(data.webAPI));
    }
    // action List
    else if (url === joinURL(config.pathPrefix, config.actionList)) {
      res.write(
        JSON.stringify(
          data.actions.map(({ potentialAction }) => potentialAction),
        ),
      );
    }
    // action call
    else if (
      data.actions
        .map(({ id }) => joinURL(config.pathPrefix, config.actionTarget, id))
        .includes(url)
    ) {
      // TODO do mapping, call api...
      res.write('Hi dude');
    } else {
      res.statusCode = 404;
      res.write(JSON.stringify({ err: 'Route not found' }));
    }

    const actionsIds = data.actions.map(({ id }) => id);

    res.end();
  })
  .listen(config.port, () => {
    console.log(`server start at port ${config.port}`);
  });

console.log('Hello world!');
