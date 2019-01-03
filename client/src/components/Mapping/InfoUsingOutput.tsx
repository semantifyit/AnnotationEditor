import React from 'react';
import ButtonModal from './ButtonModal';
import { FormGroup, Label } from 'reactstrap';
import AceEditor from 'react-ace';
import JSONBox from '../JSONBox';

const exampleMapping = {
  event_name: '$.result.name',
  event_date: '$.result.startDate',
};
const apiResponse = {
  event_name: 'Forever',
  event_date: '2025-01-01T18:00:00Z',
};
const action = {
  '@context': 'http://schema.org',
  '@type': 'Action',
  result: {
    '@type': 'Event',
    name: 'Forever',
    startDate: '2025-01-01T18:00:00Z',
  },
};

const InfoUsingOutput = () => (
  <ButtonModal
    modalTitle="Using output Properties"
    triggerType="icon"
    btnSize="sm"
    btnColor="dodgerblue"
  >
    For mapping the response of the API instead of describing with your mapping
    how the output of the response mapping should be, you describe the output of
    the API, and how each field gets used in the response Action. <br />
    Instead of then using the dot notation to denote the parameters then get fed
    into the object, we now use it to denote where the field will be mapped to
    in the Action response. <br />
    So for example, with the following mapping:
    <div
      style={{
        border: '1px solid lightgrey',
        borderRadius: '5px',
        padding: '10px',
      }}
    >
      <FormGroup>
        <Label for="editor-query-info">Response Payload:</Label>
        <AceEditor
          name="editor-resp-payload-info"
          mode="json"
          theme="tomorrow"
          fontSize={14}
          maxLines={4}
          readOnly={true}
          highlightActiveLine={false}
          editorProps={{ $blockScrolling: true }}
          value={JSON.stringify(exampleMapping, null, 2)}
          style={{ border: '1px solid lightgrey' }}
          width="auto"
        />
      </FormGroup>
    </div>
    And the following response of the API:
    <JSONBox object={apiResponse} />
    Will result in the following schema.org Action response:
    <JSONBox object={action} />
    (The @type of the Event as well as any additional information of the event
    would come from the properly annotated Action annotation)
    <br />
    <br />
    With the same syntax as for the request mapping, you can use JavaScript
    functions to transform values form the API response.
  </ButtonModal>
);

export default InfoUsingOutput;
