import React, { useEffect, useState } from 'react';
import { FaAngleDoubleRight, FaAngleRight, FaPlay, FaCircleNotch } from 'react-icons/fa';
import split from 'split.js';
import ky from 'ky';
import isURL from 'validator/lib/isURL';

import { RequestMappingSave, Action, WebApi } from '../../../../server/src/models/WebApi';
import Editor from '../Editor';
import { isOneLevelStringJSON } from '../../util/utils';
import { VerificationError } from '../../../../server/src/util/verification/verification';
import VerificationReportBox from './VerificationReportBox';

interface Props {
  requestMapping: RequestMappingSave;
  sampleAction: Action['sampleAction'];
  prefixes: WebApi['prefixes'];
  config: WebApi['config'];
  templates: WebApi['templates'];
  potAction: WebApi['actions'][0]['annotationSrc'];
  setSampleAction: (a: Action['sampleAction']) => void;
  setRequestMapping: (arg: any) => void;
  goToRespMapping: () => void;
  goToTestMapping: () => void;
}
const httpMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];

const mappingTypes = ['handlebars', 'xquery', 'javascript'];

type MappingPart = 'url' | 'headers' | 'body';

const validateUrl = (url: string) => (isURL(url) ? undefined : 'Url is not valid!');
const validateHeaders = (headers: string) =>
  isOneLevelStringJSON(headers)
    ? undefined
    : 'Headers could not be parsed, please provide an object of strings!';

const RequestMapping = ({
  requestMapping,
  setRequestMapping,
  goToRespMapping,
  goToTestMapping,
  sampleAction,
  setSampleAction,
  prefixes,
  config,
  templates,
  potAction,
}: Props) => {
  const [testResults, setTestResults] = useState<
    Record<MappingPart, { value: string; success: boolean; valid?: string }> | undefined
  >();
  const [verificationResults, setVerificationResults] = useState<VerificationError[] | undefined>();
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [requestResult, setRequestResult] = useState<any | undefined>();

  useEffect(() => {
    split([`#split1`, `#split2`], { sizes: [50, 50], minSize: [100, 100] });
  }, []);

  const setMappingValue = (type: MappingPart, value: string) =>
    setRequestMapping({ ...requestMapping, [type]: { type: requestMapping[type].type, value: value } });
  const setMappingType = (type: MappingPart, value: string) =>
    setRequestMapping({ ...requestMapping, [type]: { type: value, value: requestMapping[type].value } });

  const EditorHeader = ({ type }: { type: MappingPart }) => (
    <div className="d-flex flexSpaceBetween mb-1">
      <span className="text-capitalize font-weight-bold">{type}:</span>
      <select
        className="custom-select w-auto form-control-sm"
        value={requestMapping[type].type}
        onChange={(e) => setMappingType(type, e.target.value)}
      >
        {mappingTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );

  const TestResult = ({ type, warning }: { type: MappingPart; warning?: string }) => (
    <div className="mb-3">
      <h5 className="text-capitalize">{type}:</h5>
      {testResults?.[type].success ? (
        <>
          {testResults?.[type].value === '' ? (
            <span className="italicGrey">Empty string</span>
          ) : (
            <pre>{testResults?.[type].value}</pre>
          )}
          {warning && (
            <div className="alert alert-warning" role="alert">
              {warning}
            </div>
          )}
        </>
      ) : (
        <div className="alert alert-danger" role="alert">
          {testResults?.[type].value}
        </div>
      )}
    </div>
  );

  const runTest = async () => {
    try {
      setIsRunningTest(true);
      const res: any = await ky
        .post('/api/mapping/lowering', {
          json: {
            action: sampleAction,
            url: requestMapping.url,
            headers: requestMapping.headers,
            body: requestMapping.body,
            config,
            prefixes,
            templates,
            potAction,
          },
        })
        .json();
      setVerificationResults(res.verification);
      setTestResults(res);
    } catch (e) {
      console.log(e);
    }
    setIsRunningTest(false);
  };

  const tryRequest = async () => {
    if (!testResults || !testWasSuccess) {
      return;
    }
    try {
      setIsRunningTest(true);
      const res: any = await ky
        .post('/api/mapping/request', {
          json: {
            method: requestMapping.method,
            url: testResults.url.value,
            headers: testResults.headers.value,
            body: testResults.body.value,
          },
        })
        .json();
      setRequestResult(res);
      setIsRunningTest(false);
    } catch (e) {
      console.log(e);
    }
  };

  const testWasSuccess =
    testResults?.url.success &&
    !testResults.url.valid &&
    testResults.headers.success &&
    !testResults.headers.valid &&
    testResults.body.success &&
    !testResults.body.valid;

  return (
    <>
      <h2 className="mb-4">Create a Request Mapping</h2>
      <div className="mb-3" style={{ width: '10rem' }}>
        <label className="font-weight-bold">HTTP Method</label>
        <select
          className="custom-select"
          value={requestMapping.method}
          onChange={(e) => setRequestMapping({ ...requestMapping, method: e.target.value })}
        >
          <option disabled value="">
            select a value ...
          </option>
          {httpMethods.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <EditorHeader type="url" />
        <Editor
          mode={requestMapping.url.type}
          value={requestMapping.url.value}
          setValue={(val) => setMappingValue('url', val)}
          resizable={true}
          height="100"
        />
      </div>
      <div className="mb-3">
        <EditorHeader type="headers" />
        <Editor
          mode={requestMapping.headers.type}
          value={requestMapping.headers.value}
          setValue={(val) => setMappingValue('headers', val)}
          resizable={true}
        />
      </div>
      <div className="mb-3">
        <EditorHeader type="body" />
        <Editor
          mode={requestMapping.body.type}
          height="400px"
          value={requestMapping.body.value}
          setValue={(val) => setMappingValue('body', val)}
          resizable={true}
        />
      </div>
      <hr className="mt-5 mb-4" />
      <div className="d-flex flexSpaceBetween">
        <h3 className="mb-4">Test Request Mapping</h3>
        <button className="btn btn-success" onClick={runTest} disabled={isRunningTest}>
          Run {isRunningTest ? <FaCircleNotch className="icon-spin" /> : <FaPlay />}
        </button>
      </div>

      <div className="d-flex">
        <div id="split1" className="split pr-2">
          <h4 className="mb-3">Input Action</h4>
          <Editor
            mode="json"
            height="400"
            value={sampleAction}
            setValue={(val) => setSampleAction(val)}
            resizable={true}
          />
        </div>
        <div id="split2" className="split pl-2">
          <h4 className="mb-3">Request</h4>
          {verificationResults && <VerificationReportBox report={verificationResults} />}
          {testResults && (
            <>
              <TestResult type="url" warning={validateUrl(testResults.url.value)} />
              <TestResult type="headers" warning={validateHeaders(testResults.headers.value)} />
              <TestResult type="body" />
              <button
                className="btn btn-success"
                onClick={tryRequest}
                disabled={!testWasSuccess || isRunningTest}
              >
                Try Request {isRunningTest ? <FaCircleNotch className="icon-spin" /> : <FaPlay />}
              </button>
            </>
          )}
          {!verificationResults && !testResults && <span className="italicGrey">No test has run</span>}
        </div>
      </div>
      {requestResult &&
        (requestResult.error ? (
          <div className="alert alert-warning mt-3" role="alert">
            {requestResult.error}
          </div>
        ) : (
          <div className="mt-3">
            <h3>Response:</h3>
            <b>Status code: </b> {requestResult.statusCode}
            <br />
            <b>Headers:</b>
            <br />
            <pre>{JSON.stringify(JSON.parse(requestResult.headers), null, 2)}</pre>
            <b>Body:</b>
            <br />
            <pre>{requestResult.body}</pre>
          </div>
        ))}

      <div className="float-right mt-5 mb-5">
        <button className="btn btn-primary " onClick={goToRespMapping}>
          <FaAngleRight /> To Response Mapping
        </button>{' '}
        <button className="btn btn-primary" onClick={goToTestMapping}>
          <FaAngleDoubleRight /> Test full mapping
        </button>
      </div>
    </>
  );
};

export default RequestMapping;
