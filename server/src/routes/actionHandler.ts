import express from 'express';

import WebApis, { WebApiLeanDoc as WebApi } from '../models/WebApi';
import { preProcessWebAPI } from '../util/webApi';

const router = express.Router();

router.get('/:path', async (req, res) => {
  const webAPI: WebApi = await WebApis.findOne({
    path: req.params.path,
  }).lean();
  if (!webAPI) {
    res.status(404).json({ err: `WebAPI ${req.params.path} not found` });
    return;
  }
  preProcessWebAPI(webAPI);
  const result = webAPI.annotation;
  res.json(result);
});

router.get('/:path/actions', async (req, res) => {
  const webAPI: WebApi = await WebApis.findOne({
    path: req.params.path,
  }).lean();
  if (!webAPI) {
    res.status(404).json({ err: `WebAPI ${req.params.path} not found` });
    return;
  }
  preProcessWebAPI(webAPI);
  const result = webAPI.actions.map(({ annotation }) => annotation);
  res.json(result);
});

router.get('/:webApiPath/:actionPath', async (req, res) => {
  const webAPI: WebApi = await WebApis.findOne({
    path: req.params.webApiPath,
  }).lean();
  if (!webAPI) {
    res.status(404).json({ err: `WebAPI ${req.params.webApiPath} not found` });
    return;
  }
  preProcessWebAPI(webAPI);
  const result = webAPI.actions.find(({ id }) => id === req.params.actionPath);
  if (!result) {
    res.status(404).json({ err: `Action ${req.params.actionPath} not found` });
    return;
  }
  res.json(result.annotation);
});

router.post('/:webApiPath/:actionPath', async (req, res) => {
  try {
    const { body } = req;

    const webAPI: WebApi = await WebApis.findOne({
      path: req.params.webApiPath,
    }).lean();
    if (!webAPI) {
      res.status(404).json({ err: `WebAPI ${req.params.webApiPath} not found` });
      return;
    }
    preProcessWebAPI(webAPI);
    const action = webAPI.actions.find(({ id }) => id === req.params.actionPath);
    if (!action) {
      res.status(404).json({ err: `Action ${req.params.actionPath} not found` });
      return;
    }

    // const requestMappingObj: any = action.requestMapping;
    // requestMappingObj.path = JSON.parse(requestMappingObj.path);
    // requestMappingObj.headers = JSON.parse(requestMappingObj.headers);
    // requestMappingObj.query = JSON.parse(requestMappingObj.query);

    // const requestMappingResult = await apiMapping.requestMapping(
    //   body,
    //   requestMappingObj,
    //   {
    //     type: action.requestMapping.type,
    //   },
    // );

    // // may need try catch around since might be 404 and mapping might cover those cases
    // const apiResponse = await request({
    //   method: action.requestMapping.method,
    //   uri: requestMappingResult.url,
    //   headers: requestMappingResult.headers,
    //   body: requestMappingResult.body,
    //   resolveWithFullResponse: true,
    // });

    // const responseMappingObj: any = action.requestMapping;
    // requestMappingObj.headers = JSON.parse(requestMappingObj.headers);

    // const responseMappingResult = await apiMapping.responseMapping(
    //   apiResponse,
    //   responseMappingObj,
    //   {
    //     type: action.responseMapping.type,
    //     rmlOptions: {
    //       compress: action.annotation['@context'],
    //       replace: true,
    //       // eslint-disable-next-line no-eval
    //       functions: eval(action.functions),
    //     },
    //   },
    // );
    // res.json(responseMappingResult);

    res.json({});
  } catch (e) {
    console.log(e.stack);
    // req.body.actionStatus = 'FailedActionStatus';
    // req.body.error = e.toString();
    // res.json(req.body);
    res.json({});
  }
});

export default router;
