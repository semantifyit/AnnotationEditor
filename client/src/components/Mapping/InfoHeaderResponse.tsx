import React from 'react';
import AceEditor from 'react-ace';
import { FormGroup, Label } from 'reactstrap';
import ButtonModal from './ButtonModal';
import JSONBox from '../JSONBox';

const editorValue = {
  Date: '$.endTime',
  statusCode:
    "$.actionStatus |> (status => status === '200' ? 'http://schema.org/CompletedActionStatus' : 'http://schema.org/FailedActionStatus')",
};

const action = {
  '@context': 'http://schema.org',
  '@type': 'Action',
  actionStatus:
    'http://schema.org/CompletedActionStatus (or http://schema.org/FailedActionStatus, depending on the status of the API response)',
  endTime: '<value_of_the_api_response_header_date>',
};

const InfoHeaderResponse = () => (
  <ButtonModal modalTitle="Info Header Properties" triggerType="icon">
    Add the header properties you wish to use in your response Action. In
    addition to the API headers, some general properties will also be available
    to you here: <br />
    Status Code(<i>statusCode</i>), Status Message (<i>statusMessage</i>),
    Response Time (<i>responseTime</i>)<br />
    You can use Ctrl+Space to get a list of common response headers as well as
    those general properties.
    <br />
    <br />
    For example:
    <br />
    <div
      style={{
        border: '1px solid lightgrey',
        borderRadius: '5px',
        padding: '10px',
      }}
    >
      <FormGroup>
        <Label for="editor-query-info">URL Query Parameter:</Label>
        <AceEditor
          name="editor-query-info"
          mode="json"
          theme="tomorrow"
          fontSize={14}
          maxLines={4}
          readOnly={true}
          highlightActiveLine={false}
          editorProps={{ $blockScrolling: true }}
          value={JSON.stringify(editorValue, null, 2)}
          style={{ border: '1px solid lightgrey' }}
          width="auto"
        />
      </FormGroup>
    </div>
    <br />
    Will result in the following Action response: <br />
    <JSONBox object={action} />
  </ButtonModal>
);

export default InfoHeaderResponse;
