import React, { useEffect, useState } from 'react';
import { FaAngleDoubleLeft, FaAngleLeft, FaPlay, FaCircleNotch } from 'react-icons/fa';
import split from 'split.js';
import ky from 'ky';

import {
  RequestMappingSave,
  Action,
  WebApi,
  ResponseMappingSave,
} from '../../../../server/src/models/WebApi';
import Editor from '../Editor';

interface Props {
  requestMapping: RequestMappingSave;
  responseMapping: ResponseMappingSave;
  sampleAction: Action['sampleAction'];
  setSampleAction: (a: Action['sampleAction']) => void;
  prefixes: WebApi['prefixes'];
  goToReqMapping: () => void;
  goToRespMapping: () => void;
  potentialActionLinks: Action['potentialActionLinks'];
  actions: Action[];
}

const TestMapping = ({
  requestMapping,
  responseMapping,
  goToRespMapping,
  goToReqMapping,
  sampleAction,
  setSampleAction,
  prefixes,
  potentialActionLinks,
  actions,
}: Props) => {
  const [testResults, setTestResults] = useState<{ value: string; success: boolean } | undefined>();
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    split([`#split1`, `#split2`], { sizes: [50, 50], minSize: [100, 100] });
  }, []);

  const runTest = async () => {
    try {
      setIsRunningTest(true);
      const res: any = await ky
        .post('/api/mapping/full', {
          json: {
            method: requestMapping.method,
            action: sampleAction,
            url: requestMapping.url,
            headers: requestMapping.headers,
            body: requestMapping.body,
            response: responseMapping.body,
            links: potentialActionLinks,
            prefixes,
            actions,
          },
        })
        .json();
      setTestResults(res);
      setIsRunningTest(false);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <div className="d-flex flexSpaceBetween">
        <h3 className="mb-4">Test full mapping</h3>
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
          <h4 className="mb-3">Response Action</h4>
          {testResults ? (
            <>
              {testResults.success ? (
                testResults.value === '' ? (
                  <span className="italicGrey">Empty string</span>
                ) : (
                  <Editor
                    mode="json"
                    height="400"
                    value={JSON.stringify(JSON.parse(testResults.value), null, 2)}
                    resizable={true}
                    readOnly={true}
                  />
                )
              ) : (
                <div className="alert alert-danger" role="alert">
                  {testResults.value}
                </div>
              )}
            </>
          ) : (
            <span className="italicGrey">No test has run</span>
          )}
        </div>
      </div>

      <div className="float-right mt-5 mb-5">
        <button className="btn btn-primary " onClick={goToReqMapping}>
          <FaAngleDoubleLeft /> To Request Mapping
        </button>{' '}
        <button className="btn btn-primary" onClick={goToRespMapping}>
          <FaAngleLeft /> To Response Mapping
        </button>
      </div>
    </>
  );
};

export default TestMapping;
