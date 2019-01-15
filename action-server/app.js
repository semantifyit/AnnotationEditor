const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { requestMapping, responseMapping } = require('../api-mapping');

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

const defaultHeaders = {
  'User-Agent': 'Node',
  Accept: 'application/json,text/plain',
};

const makeRequest = (method, url, headers, body) =>
  new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const reqURL = new URL(url);

    const reqOptions = {
      method: method,
      hostname: reqURL.hostname,
      port: reqURL.port !== '' ? reqURL.port : undefined,
      path: reqURL.pathname,
      headers: Object.assign(headers || {}, defaultHeaders),
    };
    //console.log(reqOptions);
    const request = lib.request(reqOptions, (response) => {
      //console.log(response);
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error('Failed to load page, status code: ' + response.statusCode),
        );
      }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () =>
        resolve({ body: body.join(''), headers: response.headers }),
      );
    });
    if (body) {
      request.write(body);
    }
    request.end();
  });

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
  data.actions = data.actions.map((action) => {
    action.potentialAction.target.urlTemplate = joinURL(
      actionTargetUrl,
      action.id,
    );
    return action;
  });
};
preProcessData();

const existingPostRoutes = data.actions.map(({ id }) =>
  joinURL(config.pathPrefix, config.actionTarget, id),
);

const getBody = (request, res) =>
  new Promise((resolve, reject) => {
    const body = [];
    request
      .on('error', (err) => {
        console.error(err);
      })
      .on('data', (chunk) => {
        console.log(chunk);
        body.push(chunk);
      })
      .on('end', () => {
        console.log('end');
        resolve(Buffer.concat(body).toString());
      });
  });

http
  .createServer(async (request, response) => {
    const { method, url, headers } = request;
    console.log(`Request: ${method} ${url}`);

    response.on('error', (err) => {
      console.error(err);
    });
    response.setHeader('Content-Type', 'application/ld+json');

    // entryPoint
    if (
      method === 'GET' &&
      url === joinURL(config.pathPrefix, config.entryPoint)
    ) {
      response.end(JSON.stringify(data.webAPI));
    }
    // action List
    else if (
      method === 'GET' &&
      url === joinURL(config.pathPrefix, config.actionList)
    ) {
      response.end(
        JSON.stringify(
          data.actions.map(({ potentialAction }) => potentialAction),
        ),
      );
    }
    // action call
    else if (method === 'POST' && existingPostRoutes.includes(url)) {
      // TODO do mapping, call api...
      //console.log('Action call');
      let requestBody = await getBody(request);
      if (typeof requestBody === 'string') {
        requestBody = JSON.parse(requestBody);
      }
      const actionId = url.split('/').pop();
      const action = data.actions.find((a) => a.id === actionId);
      //console.log(requestBody);
      const requestMappingResult = requestMapping(
        requestBody,
        action.requestMapping,
        {
          evalMethod: config.evalMethod,
        },
      );
      //console.log(requestMappingResult);
      let apiResponse = await makeRequest(
        action.requestMapping.method,
        requestMappingResult.url,
        requestMappingResult.headers,
        requestMappingResult.body,
      );
      //console.log(apiResponse);
      if (typeof apiResponse.body === 'string') {
        apiResponse.body = JSON.parse(apiResponse.body);
      }
      const responseMappingResult = responseMapping(
        apiResponse,
        action.responseMapping,
        {
          evalMethod: config.evalMethod,
        },
      );
      //console.log(responseMappingResult);
      response.write(JSON.stringify(responseMappingResult));
      response.end();
    } else {
      response.statusCode = 404;
      response.end(JSON.stringify({ err: 'Route not found' }));
    }
  })
  .listen(config.port, () => {
    console.log(`server start at port ${config.port}`);
  });
