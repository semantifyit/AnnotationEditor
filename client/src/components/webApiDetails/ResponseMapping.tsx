import React from 'react';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { isOneLevelStringJSON } from '../../util/utils';
import { ResponseMappingSave } from '../../../../server/src/models/WebApi';
import Editor, { ValidityFunc } from '../Editor';

// import { WebApi } from '../../../../server/src/models/WebApi';

interface Props {
  responseMapping: ResponseMappingSave;
  setResponseMapping: (arg: any) => void;
  goToTestMapping: () => void;
  goToReqMapping: () => void;
}

const responseTypes = {
  json: 'JSON',
  xml: 'XML',
  yaml: 'YARRRML',
};

const headerValid: ValidityFunc = (val) =>
  isOneLevelStringJSON(val)
    ? undefined
    : 'Your object contains non string keys!';

const ResponseMapping = ({
  responseMapping,
  setResponseMapping,
  goToTestMapping,
  goToReqMapping,
}: Props) => {
  return (
    <>
      <h1 className="mb-5"> 2. Create a Response Mapping</h1>
      <div className="mb-3">
        General + Headers:
        <Editor
          mode="json"
          value={responseMapping.headers || ''}
          setValue={(val) =>
            setResponseMapping({ ...responseMapping, headers: val })
          }
          valIsValidFunc={headerValid}
        />
      </div>
      <div className="mb-3">
        <div>
          Body:
          <select
            className="custom-select w-auto form-control-sm float-right"
            value={responseMapping.type}
            onChange={(e) =>
              setResponseMapping({ ...responseMapping, type: e.target.value })
            }
          >
            {Object.entries(responseTypes).map(([type, name]) => (
              <option key={type} value={type}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <br />
        <Editor
          mode={responseMapping.type}
          height="400px"
          value={responseMapping.body || ''}
          setValue={(val) =>
            setResponseMapping({ ...responseMapping, body: val })
          }
        />
      </div>
      <div className="float-right mt-3 mb-5">
        <button className="btn btn-primary " onClick={goToTestMapping}>
          <FaArrowLeft /> To Request Mapping
        </button>{' '}
        <button className="btn btn-primary" onClick={goToTestMapping}>
          <FaArrowRight /> Test full mapping
        </button>
      </div>
    </>
  );
};

export default ResponseMapping;
