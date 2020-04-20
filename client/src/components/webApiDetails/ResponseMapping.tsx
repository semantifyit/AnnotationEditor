import React, { useState, useEffect } from 'react';
import { FaAngleLeft, FaAngleRight, FaCircleNotch, FaPlay } from 'react-icons/fa';
import split from 'split.js';

import { switchCase } from '../../util/utils';
import { ResponseMappingSave, Action, WebApi } from '../../../../server/src/models/WebApi';
import Editor from '../Editor';
import ky from 'ky';

// import { WebApi } from '../../../../server/src/models/WebApi';

interface Props {
  responseMapping: ResponseMappingSave;
  prefixes: WebApi['context'];
  sampleResponse: Action['sampleResponse'];
  setResponseMapping: (arg: any) => void;
  goToTestMapping: () => void;
  goToReqMapping: () => void;
  setSampleResponse: (a: Action['sampleResponse']) => void;
}

const responseTypes = ['yarrrml', 'rml'];

const getMode = switchCase({ yarrrml: 'yaml', rml: 'turtle' });

const ResponseMapping = ({
  responseMapping,
  setResponseMapping,
  goToTestMapping,
  goToReqMapping,
  sampleResponse,
  setSampleResponse,
  prefixes,
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
        .post('/api/mapping/lifting', {
          json: {
            input: sampleResponse,
            body: responseMapping.body,
            prefixes,
          },
        })
        .json();
      setTestResults(res.body);
      setIsRunningTest(false);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <h2 className="mb-5">Create a Response Mapping</h2>
      <div className="mb-3">
        <div>
          <b>Mapping:</b>
          <select
            className="custom-select w-auto form-control-sm float-right"
            value={responseMapping.body.type}
            onChange={(e) =>
              setResponseMapping({
                ...responseMapping,
                body: { value: responseMapping.body.value, type: e.target.value },
              })
            }
          >
            {responseTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <br />
        <Editor
          mode={getMode(responseMapping.body.type)}
          height="400"
          value={responseMapping.body.value}
          setValue={(val) =>
            setResponseMapping({
              ...responseMapping,
              body: { value: val, type: responseMapping.body.type },
            })
          }
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
          <h4 className="mb-3">Sample API Response</h4>
          <Editor
            mode="text"
            height="400"
            value={sampleResponse}
            setValue={(val) => setSampleResponse(val)}
            resizable={true}
          />
        </div>
        <div id="split2" className="split pl-2">
          <h4 className="mb-3">Action Response</h4>
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
          <FaAngleLeft /> To Request Mapping
        </button>{' '}
        <button className="btn btn-primary" onClick={goToTestMapping}>
          <FaAngleRight /> Test full mapping
        </button>
      </div>
    </>
  );
};

export default ResponseMapping;
