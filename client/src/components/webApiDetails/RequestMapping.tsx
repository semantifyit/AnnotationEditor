import React from 'react';

import { FaArrowRight } from 'react-icons/fa';
import {
  isOneLevelStringJSON,
  isArrayOfStrings,
} from '../../util/utils';
import { RequestMappingSave } from '../../../../server/src/models/WebApi';
import Editor, { ValidityFunc } from '../Editor';

// import { WebApi } from '../../../../server/src/models/WebApi';

interface Props {
  requestMapping: RequestMappingSave;
  setRequestMapping: (arg: any) => void;
  goToRespMapping: () => void;
}
const httpMethods = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'DELETE',
  'CONNECT',
  'OPTIONS',
  'TRACE',
  'PATCH',
];

const requestTypes = ['json', 'xml', 'javascript'];

const pathValid = (val: string): undefined | string =>
  isArrayOfStrings(val)
    ? undefined
    : "Your mapping isn't a array of strings (see hint)";

const queryValid: ValidityFunc = (val) =>
  isOneLevelStringJSON(val)
    ? undefined
    : 'Your object contains non string keys!';

const headerValid = queryValid;

const RequestMapping = ({
  requestMapping,
  setRequestMapping,
  goToRespMapping,
}: Props) => {
  return (
    <>
      <h1 className="mb-5"> 1. Create a Request Mapping</h1>
      <div className="row">
        <div className="form-group col-md-4">
          <label>HTTP Method</label>
          <select
            className="custom-select"
            value={requestMapping.method}
            onChange={() => {}}
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
        <div className="form-group col-md-8">
          <label>Base Url</label>
          <input
            type="url"
            className="form-control"
            placeholder="https://..."
            value={requestMapping.url}
            onChange={(e) =>
              setRequestMapping({ ...requestMapping, url: e.target.value })
            }
          />
        </div>
      </div>
      <div className="mb-3">
        URL Path:
        <Editor
          mode="json"
          value={requestMapping.path || ''}
          setValue={(val) =>
            setRequestMapping({ ...requestMapping, path: val })
          }
          valIsValidFunc={pathValid}
        />
      </div>
      <div className="mb-3">
        URL Query:
        <Editor
          mode="json"
          value={requestMapping.query || ''}
          setValue={(val) =>
            setRequestMapping({ ...requestMapping, query: val })
          }
          valIsValidFunc={queryValid}
        />
      </div>
      <div className="mb-3">
        Headers:
        <Editor
          mode="json"
          value={requestMapping.headers || ''}
          setValue={(val) =>
            setRequestMapping({ ...requestMapping, headers: val })
          }
          valIsValidFunc={headerValid}
        />
      </div>
      <div className="mb-3">
        <div>
          Body:
          <select
            className="custom-select w-auto form-control-sm float-right"
            value={requestMapping.type}
            onChange={(e) =>
              setRequestMapping({ ...requestMapping, type: e.target.value })
            }
          >
            {requestTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <br />
        <Editor
          mode={requestMapping.type}
          height="400px"
          value={requestMapping.body || ''}
          setValue={(val) =>
            setRequestMapping({ ...requestMapping, body: val })
          }
        />
      </div>
      <button
        className="btn btn-primary float-right mt-3 mb-5"
        onClick={goToRespMapping}
      >
        {' '}
        <FaArrowRight /> To Response Mapping
      </button>
    </>
  );
};

export default RequestMapping;
